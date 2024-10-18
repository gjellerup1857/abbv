/*
 * This file is part of Adblock Plus <https://adblockplus.org/>,
 * Copyright (C) 2006-present eyeo GmbH
 *
 * Adblock Plus is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 3 as
 * published by the Free Software Foundation.
 *
 * Adblock Plus is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Adblock Plus.  If not, see <http://www.gnu.org/licenses/>.
 */

import * as ewe from "@eyeo/webext-ad-filtering-solution";

import { type Tabs } from "webextension-polyfill";

import {
  type MessageSender,
  addTrustedMessageTypes,
  port
} from "../../core/messaging/background";
import { TabSessionStorage } from "../../../adblockpluschrome/lib/storage/tab-session";
import { EventEmitter } from "../../../adblockpluschrome/lib/events";
import { getLocaleInfo } from "../../i18n/background";
import { info } from "../../info/background";
import {
  CommandEventType,
  CommandName,
  createSafeOriginUrl,
  dismissCommand,
  doesLicenseStateMatch,
  getBehavior,
  getCommand,
  getContent,
  isCommandExpired,
  recordEvent
} from "../../ipm/background";
import * as logger from "../../logger/background";
import { type Message, isMessage } from "~/core/messaging/shared";
import { type TabRemovedEventData } from "../../polyfills/background";
import { type HideMessage, type StartInfo, isPingMessage } from "../shared";
import { isDialog, isDialogBehavior, isDialogContent } from "./dialog";
import { type Dialog } from "./dialog.types";
import { setDialogCommandHandler } from "./middleware";
import { clearStats, getStats, setStats } from "./stats";
import {
  coolDownPeriodKey,
  DialogEventType,
  lastShownKey,
  ShowOnpageDialogResult
} from "./tab-manager.types";
import {
  shouldBeDismissed,
  shouldBeShown,
  start as setupTimings
} from "./timing";
import { checkLanguage } from "~/ipm/background/language-check";
import { isTabPage, pageEmitter } from "~/core/pages/background";
import { Prefs } from "../../../adblockpluschrome/lib/prefs";

/**
 * Tab-specific session storage for dialogs
 */
const assignedDialogs = new TabSessionStorage("onpage-dialog:dialogs");
/**
 * Dialog event emitter
 */
export const eventEmitter = new EventEmitter();
/**
 * Queue of dialogs that haven't been assigned to a tab yet
 * Keys are dialog IDs
 */
const unassignedDialogs = new Map<string, Dialog>();

/**
 * Compares two dialogs to see which has the higher priority.
 *
 * @param dialogA The first dialog
 * @param dialogB The second dialog
 * @returns 1 if dialogA has a higher priority, 1 if dialogB does, 0 if both are equal
 */
export function compareDialogsByPriority(
  dialogA: Dialog,
  dialogB: Dialog
): number {
  if (dialogA.behavior.priority > dialogB.behavior.priority) {
    return -1;
  }

  if (dialogA.behavior.priority < dialogB.behavior.priority) {
    return 1;
  }

  const ipmIdA = (dialogA.ipmId ?? "x").toUpperCase();
  const ipmIdB = (dialogB.ipmId ?? "x").toUpperCase();

  if (ipmIdA < ipmIdB) {
    return -1;
  }
  if (ipmIdA > ipmIdB) {
    return 1;
  }

  return 0;
}

/**
 * Checks whether the global dialog cool down period is still ongoing.
 *
 * @returns true if the cool down period is till ongoing, false if not
 */
export async function isCoolDownPeriodOngoing(): Promise<boolean> {
  await Prefs.untilLoaded;
  return Prefs.get(lastShownKey) + Prefs.get(coolDownPeriodKey) > Date.now();
}

/**
 * Removes on-page dialog
 *
 * @param tabId - Tab ID
 */
async function removeDialog(tabId: number): Promise<void> {
  logger.debug("[onpage-dialog]: Remove dialog");

  const dialog = await assignedDialogs.get(tabId);
  if (!isDialog(dialog)) {
    return;
  }

  try {
    const message: HideMessage = { type: "onpage-dialog.hide" };
    await sendMessage(tabId, message);
    await assignedDialogs.delete(tabId);
  } catch (ex) {
    // Ignore if tab has already been removed
  }

  // Determine whether dialog should remain active
  const stats = getStats(dialog.id);
  if (!shouldBeDismissed(dialog, stats)) {
    logger.debug("[onpage-dialog]: Keep dialog active");
    return;
  }

  dismissDialog(dialog);
  clearStats(dialog.id);
}

/**
 * Dismisses on-page dialog
 *
 * @param dialog - Dialog information
 */
function dismissDialog(dialog: Dialog): void {
  logger.debug("[onpage-dialog]: Dismiss dialog");
  unassignedDialogs.delete(dialog.id);

  if (typeof dialog.ipmId === "string") {
    dismissCommand(dialog.ipmId);
  }
}

/**
 * Forwards message from a tab to its top-level frame
 *
 * @param message - Message
 * @param sender - Message sender
 *
 * @returns message response
 */
async function forwardMessage(
  message: unknown,
  sender: MessageSender
): Promise<unknown> {
  if (!isMessage(message) || typeof sender.tab?.id === "undefined") {
    return;
  }

  return await sendMessage(sender.tab.id, message);
}

/**
 * Handles "onpage-dialog.close" messages
 *
 * @param message - Message
 * @param sender - Message sender
 */
async function handleCloseMessage(
  message: Message,
  sender: MessageSender
): Promise<void> {
  if (typeof sender.tab?.id === "undefined") {
    return;
  }

  const dialog = await assignedDialogs.get(sender.tab.id);
  if (!isDialog(dialog)) {
    return;
  }

  void removeDialog(sender.tab.id);
  recordDialogEvent(dialog, DialogEventType.closed);
}

/**
 * Handles "onpage-dialog.continue" messages
 *
 * @param message - Message
 * @param sender - Message sender
 */
async function handleContinueMessage(
  message: Message,
  sender: MessageSender
): Promise<void> {
  if (typeof sender.tab?.id === "undefined") {
    return;
  }

  const dialog = await assignedDialogs.get(sender.tab.id);
  if (!isDialog(dialog)) {
    return;
  }

  const safeTargetUrl = createSafeOriginUrl(dialog.behavior.target);
  if (safeTargetUrl === null) {
    return;
  }

  void browser.tabs.create({ url: safeTargetUrl });

  void removeDialog(sender.tab.id);
  recordDialogEvent(dialog, DialogEventType.buttonClicked);
}

/**
 * Handles IPM commands
 *
 * @param ipmId - IPM ID
 */
async function handleDialogCommand(ipmId: string): Promise<void> {
  if (typeof ipmId !== "string") {
    return;
  }

  const behavior = getBehavior(ipmId);
  if (!isDialogBehavior(behavior)) {
    return;
  }

  const content = getContent(ipmId);
  if (!isDialogContent(content)) {
    return;
  }

  const dialog: Dialog = { behavior, content, id: ipmId, ipmId };
  unassignedDialogs.set(dialog.id, dialog);
}

/**
 * Handles "onpage-dialog.get" messages
 *
 * @param message - Message
 * @param sender - Message sender
 *
 * @returns on-page dialog initialization information
 */
async function handleGetMessage(
  message: Message,
  sender: MessageSender
): Promise<StartInfo | null> {
  if (typeof sender.tab?.id === "undefined") {
    return null;
  }

  const dialog = await assignedDialogs.get(sender.tab.id);
  if (!isDialog(dialog)) {
    return null;
  }

  return {
    content: dialog.content,
    localeInfo: getLocaleInfo()
  };
}

/**
 * Handles "onpage-dialog.ping" messages
 *
 * @param message - Message
 * @param  sender - Message sender
 */
async function handlePingMessage(
  message: Message,
  sender: MessageSender
): Promise<void> {
  if (!isPingMessage(message) || typeof sender.tab?.id === "undefined") {
    return;
  }

  const dialog = await assignedDialogs.get(sender.tab.id);
  if (!isDialog(dialog)) {
    return;
  }

  // Check whether on-page dialog has been shown long enough already
  if (
    dialog.behavior.displayDuration === 0 ||
    message.displayDuration < dialog.behavior.displayDuration
  ) {
    return;
  }

  void removeDialog(sender.tab.id);
  recordDialogEvent(dialog, DialogEventType.ignored);
}

/**
 * Handles "tab-removed" tab session storage event
 *
 * @param data - Event data
 */
function handleTabRemovedEvent(data: TabRemovedEventData): void {
  const { tabId, value: dialog } = data;

  if (!isDialog(dialog)) {
    return;
  }

  void removeDialog(tabId);
  recordDialogEvent(dialog, DialogEventType.ignored);
}

/**
 * Handles "loaded" page events
 *
 * @param page - Page that finished loading
 */
async function handlePageLoadedEvent(page: unknown): Promise<void> {
  if (!isTabPage(page)) {
    return;
  }

  if (!page.id) {
    return;
  }

  const tab = await browser.tabs.get(page.id);

  if (unassignedDialogs.size === 0) {
    logger.debug("[onpage-dialog]: No command");
    return;
  }

  if (
    tab.incognito ||
    typeof tab.url !== "string" ||
    !/^https?:/.test(tab.url)
  ) {
    return;
  }

  // Before we iterate over the IPM dialogs, let's check if the cool down
  // period is still ongoing.
  if (await isCoolDownPeriodOngoing()) {
    logger.debug("[onpage-dialog]: Cool down period still ongoing");
    return;
  }

  // Now sort the waiting dialogs by priority.
  const dialogs = Array.from(unassignedDialogs.values()).sort(
    compareDialogsByPriority
  );

  // Finally iterate over list and try until a dialog can be shown, or the
  // list is empty.
  for (const dialog of dialogs) {
    // Ignore and dismiss command if license state doesn't match those in the
    // command
    if (!(await doesLicenseStateMatch(dialog.behavior))) {
      logger.debug("[onpage-dialog]: License has mismatch");
      dismissDialog(dialog);
      continue;
    }

    // Ignore and dismiss command if it has expired
    if (typeof dialog.ipmId === "string") {
      const command = getCommand(dialog.ipmId);
      if (command && isCommandExpired(command)) {
        logger.error("[onpage-dialog]: Command has expired.");
        recordDialogEvent(dialog, CommandEventType.expired);
        dismissDialog(dialog);
        continue;
      }
    }

    const result = await showOnpageDialog(page.id, tab, dialog);
    if (result === ShowOnpageDialogResult.rejected) {
      dismissDialog(dialog);
    }
  }
}

/**
 * Records dialog event
 *
 * @param dialog - Dialog information
 * @param eventType - Dialog event type
 */
function recordDialogEvent(
  dialog: Dialog,
  eventType: CommandEventType | DialogEventType
): void {
  eventEmitter.emit(eventType, dialog);

  if (typeof dialog.ipmId === "string") {
    recordEvent(dialog.ipmId, CommandName.createOnPageDialog, eventType);
  }
}

/**
 * Sends message to the given tab
 *
 * @param tabId - Tab ID
 * @param message - Message
 *
 * @returns message response
 */
async function sendMessage(tabId: number, message: Message): Promise<unknown> {
  return await browser.tabs.sendMessage(tabId, message, { frameId: 0 });
}

/**
 * Indicates whether user wants to ignore dialogs
 *
 * @returns whether dialogs should be ignored
 */
async function shouldBeIgnored(): Promise<boolean> {
  const ignoredCategories = await ewe.notifications.getIgnoredCategories();
  return ignoredCategories.includes("*");
}

/**
 * Show dialog on given tab
 *
 * @param tabId - ID of tab in which to show the dialog
 * @param tab - Tab in which to show the dialog
 * @param dialog - Dialog information
 *
 * @returns result of attempting to show on-page dialog
 */
export async function showOnpageDialog(
  tabId: number,
  tab: Tabs.Tab,
  dialog: Dialog
): Promise<ShowOnpageDialogResult> {
  // If we're here because of an IPM command, run the mandatory language skew check
  if (typeof dialog.ipmId === "string") {
    void checkLanguage(dialog.ipmId);
  }

  // Ignore and dismiss dialog if user opted-out of notifications
  if (await shouldBeIgnored()) {
    logger.debug("[onpage-dialog]: User ignores notifications");
    return ShowOnpageDialogResult.rejected;
  }

  // This is called both by IPM and local dialog logic, so we need to check
  // if the cool down period is still ongoing in case it'a a local dialog.
  if (await isCoolDownPeriodOngoing()) {
    logger.debug("[onpage-dialog]: Cool down period still ongoing");
    return ShowOnpageDialogResult.ignored;
  }

  const stats = getStats(dialog.id);
  const shouldDialogBeDismissed = shouldBeDismissed(dialog, stats);
  const shouldDialogBeShown = await shouldBeShown(tab, dialog, stats);

  // Reject commands that should be dismissed
  if (shouldDialogBeDismissed) {
    logger.debug("[onpage-dialog]: Reject dialog");
    return ShowOnpageDialogResult.rejected;
  }

  // Ignore and dismiss dialog that should be shown in a given tab,
  // if such tab already contains a dialog
  if (shouldDialogBeShown && (await assignedDialogs.has(tabId))) {
    logger.debug("[onpage-dialog]: Tab already contains dialog");
    return ShowOnpageDialogResult.rejected;
  }

  // Ignore if on-page dialog should not be shown for this tab
  if (!shouldDialogBeShown) {
    logger.debug("[onpage-dialog]: Don't show");
    return ShowOnpageDialogResult.ignored;
  }

  logger.debug("[onpage-dialog]: Show dialog");
  await assignedDialogs.set(tabId, dialog);

  // Sometimes dialog fails to be asssigned to the page,
  // in that case we should ignore it so it can be retried
  const assignedDialogOnPage = await assignedDialogs.get(tabId);
  if (!isDialog(assignedDialogOnPage)) {
    logger.debug("[onpage-dialog]: Failed to be assigned to the page ", tabId);
    return ShowOnpageDialogResult.ignored;
  }

  const now = Date.now();
  setStats(dialog.id, {
    displayCount: stats.displayCount + 1,
    lastDisplayTime: now
  });
  await Prefs.set(lastShownKey, now);

  await addDialog(tabId);

  recordDialogEvent(dialog, DialogEventType.injected);

  return ShowOnpageDialogResult.shown;
}

/**
 * Injects the necessary user styles into the tab and tells the tab
 * to display the on-page dialog
 *
 * @param tabId - ID of tab in which to show the dialog
 */
async function addDialog(tabId: number): Promise<void> {
  // We only inject styles into the page when we actually need them. Otherwise
  // websites may use them to detect the presence of the extension. For content
  // scripts this is not a problem, because those only interact with the web
  // page when we tell them to. Therefore we inject them via manifest.json.
  if (browser.scripting) {
    await browser.scripting.insertCSS({
      files: ["skin/onpage-dialog.css"],
      origin: "USER",
      target: { tabId }
    });
  } else {
    await browser.tabs.insertCSS(tabId, {
      cssOrigin: "user",
      file: "/skin/onpage-dialog.css"
    });
  }

  await browser.tabs.sendMessage(tabId, {
    type: "onpage-dialog.show",
    platform: info.platform
  });
}

/**
 * Initializes on-page manager
 */
export async function start(): Promise<void> {
  await setupTimings();

  // Handle messages from content scripts
  port.on("onpage-dialog.close", handleCloseMessage);
  port.on("onpage-dialog.continue", handleContinueMessage);
  port.on("onpage-dialog.get", handleGetMessage);
  port.on("onpage-dialog.ping", handlePingMessage);
  port.on("onpage-dialog.hide", forwardMessage);
  port.on("onpage-dialog.resize", forwardMessage);

  addTrustedMessageTypes(null, [
    "onpage-dialog.continue",
    "onpage-dialog.close",
    "onpage-dialog.get",
    "onpage-dialog.ping",
    "onpage-dialog.hide",
    "onpage-dialog.resize"
  ]);

  // Dismiss dialog when tab used for storing session data gets closed
  assignedDialogs.on("tab-removed", handleTabRemovedEvent);

  // Handle commands
  pageEmitter.on("loaded", handlePageLoadedEvent);
  setDialogCommandHandler(handleDialogCommand);
}
