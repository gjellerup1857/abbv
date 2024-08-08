/*
 * This file is part of AdBlock  <https://getadblock.com/>,
 * Copyright (C) 2013-present  Adblock, Inc.
 *
 * AdBlock is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 3 as
 * published by the Free Software Foundation.
 *
 * AdBlock is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with AdBlock.  If not, see <http://www.gnu.org/licenses/>.
 */

import { Tabs } from "webextension-polyfill";
import * as browser from "webextension-polyfill";

import { port } from "../../../adblockplusui/adblockpluschrome/lib/messaging/port";
import { TabSessionStorage } from "../../../adblockplusui/adblockpluschrome/lib/storage/tab-session";
import { EventEmitter } from "../../../adblockplusui/adblockpluschrome/lib/events";
import { getLocaleInfo } from "../../i18n/background";
import {
  CommandName,
  createSafeOriginUrl,
  dismissCommand,
  doesLicenseStateMatch,
  getBehavior,
  getContent,
  recordEvent,
} from "../../ipm/background";
import * as logger from "../../utilities/background";
import { MessageSender, TabRemovedEventData } from "../../polyfills/background";
import { getSettings } from "../../prefs/background/settings";
import { isDialog, isDialogBehavior, isDialogContent } from "./dialog";
import { Message, ErrorMessage } from "../../polyfills/shared";
import { type HideMessage, type StartInfo, isPingMessage } from "../shared";
import { type Dialog } from "./dialog.types";
import { setDialogCommandHandler } from "./middleware";
import { clearStats, getStats, setStats } from "./stats";
import { DialogEventType, DialogErrorEventType, ShowOnpageDialogResult } from "./tab-manager.types";
import { shouldBeDismissed, shouldBeShown, start as setupTimings } from "./timing";

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
 * Tab-specific session storage for IPM IDs
 */
const assignedIpmIds = new TabSessionStorage("onpage-dialog:ipm");

/**
 * Sends message to the given tab
 *
 * @param tabId - Tab ID
 * @param message - Message
 *
 * @returns message response
 */
function sendMessage(tabId: number, message: Message): Promise<any> {
  return browser.tabs.sendMessage(tabId, message, { frameId: 0 });
}

/**
 * Records dialog event
 *
 * @param dialog - Dialog information
 * @param eventType - Dialog event type
 */
function recordDialogEvent(dialog: Dialog, eventType: DialogEventType): void {
  eventEmitter.emit(eventType, dialog);

  if (typeof dialog.ipmId === "string") {
    void recordEvent(dialog.ipmId, CommandName.createOnPageDialog, eventType);
  }
}

/**
 * Records dialog error event
 *
 * @param dialog - Dialog information
 * @param eventType - Dialog event type
 */
function recordDialogErrorEvent(eventType: DialogErrorEventType): void {
  void recordEvent(null, CommandName.createOnPageDialog, eventType);
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
  recordDialogEvent(dialog, DialogEventType.received); // TODO - remove? load from storage?
}

/**
 * Handles "onpage-dialog.close" messages
 *
 * @param message - Message
 * @param sender - Message sender
 */
async function handleCloseMessage(message: Message, sender: MessageSender): Promise<void> {
  if (typeof sender.page?.id === "undefined") {
    return;
  }

  const dialog = await assignedDialogs.get(sender.page.id);
  if (!isDialog(dialog)) {
    return;
  }

  void removeDialog(sender.page.id);
  recordDialogEvent(dialog, DialogEventType.closed);
}

/**
 * Handles "onpage-dialog.continue" messages
 *
 * @param message - Message
 * @param sender - Message sender
 */
async function handleContinueMessage(message: Message, sender: MessageSender): Promise<void> {
  if (typeof sender.page?.id === "undefined") {
    return;
  }

  const dialog = await assignedDialogs.get(sender.page.id);
  if (!isDialog(dialog)) {
    return;
  }

  const safeTargetUrl = createSafeOriginUrl(dialog.behavior.target);
  if (safeTargetUrl === null) {
    return;
  }

  void browser.tabs.create({ url: safeTargetUrl });

  void removeDialog(sender.page.id);
  recordDialogEvent(dialog, DialogEventType.buttonClicked);
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
  sender: MessageSender,
): Promise<StartInfo | null> {
  logger.debug("[onpage-dialog]: get");
  if (typeof sender.page?.id === "undefined") {
    return null;
  }

  const dialog = await assignedDialogs.get(sender.page.id);
  if (!isDialog(dialog)) {
    logger.debug("[onpage-dialog]: get, no dialog");
    recordDialogErrorEvent(DialogErrorEventType.get_no_dialog_found);
    return null;
  }

  return {
    content: dialog.content,
    localeInfo: getLocaleInfo(),
  };
}

/**
 * Handles "onpage-dialog.ping" messages
 *
 * @param message - Message
 * @param  sender - Message sender
 */
async function handlePingMessage(message: Message, sender: MessageSender): Promise<void> {
  if (!isPingMessage(message) || typeof sender.page?.id === "undefined") {
    return;
  }

  const dialog = await assignedDialogs.get(sender.page.id);
  if (!isDialog(dialog)) {
    logger.debug("[onpage-dialog]: ping message, no dialog");
    recordDialogErrorEvent(DialogErrorEventType.ping_no_dialog_found);
    return;
  }

  // Check whether on-page dialog has been shown long enough already
  if (
    dialog.behavior.displayDuration === 0 ||
    message.displayDuration < dialog.behavior.displayDuration
  ) {
    logger.debug("[onpage-dialog]: ping message, duration exceeded");
    return;
  }

  void removeDialog(sender.page.id);
  recordDialogEvent(dialog, DialogEventType.ignored);
}

/**
 * Handles "onpage-dialog.error" messages
 *
 * @param message - ErrorMessage
 * @param sender - Message sender
 *
 * @returns on-page dialog initialization information
 */
async function handleErrorMessage(message: ErrorMessage, sender: MessageSender): Promise<void> {
  if (typeof sender.page?.id === "undefined") {
    return;
  }
  const dialog = await assignedDialogs.get(sender.page.id);

  if (!dialog) {
    recordEvent(null, CommandName.createOnPageDialog, DialogErrorEventType.error_no_dialog_found);
  }
  recordEvent(dialog.ipmId, CommandName.createOnPageDialog, `${message.type}.${message.error}`);
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
 * Injects the necessary user style and content script into the tab
 * to display the on-page dialog
 *
 * @param tabId - Tab ID
 *
 * @returns true on success, false on error
 */
async function injectScriptAndStyle(tabId: number): Promise<boolean> {
  // We only inject styles into the page when we actually need them. Otherwise
  // websites may use them to detect the presence of the extension. For content
  // scripts this is not a problem, because those only interact with the web
  // page when we tell them to. Therefore we inject them via manifest.json.
  try {
    if (browser.scripting) {
      await browser.scripting.insertCSS({
        files: ["adblock-onpage-dialog-user.css"],
        origin: "USER",
        target: { tabId },
      });
      await browser.scripting.executeScript({
        files: ["onpage-dialog.postload.js"],
        target: { tabId },
      });
    } else {
      await browser.tabs.insertCSS(tabId, {
        file: "adblock-onpage-dialog-user.css",
        allFrames: false,
        cssOrigin: "user",
        runAt: "document_start",
      });
      await browser.tabs.executeScript(tabId, {
        file: "onpage-dialog.postload.js",
        allFrames: false,
      });
    }
    return true;
  } catch (error: unknown) {
    logger.error("Injection of Dialog css & script failed");
    logger.error(error);
    return false;
  }
}

/**
 * Injects the user style and content script into the tab to show the Dialog
 * Updates the statistics on successful injection of the Dialog
 *
 * @param tabId - Tab ID
 * @param ipmId - IPM ID
 */
async function addDialog(tabId: number): Promise<boolean> {
  logger.debug("[onpage-dialog]: addDialog");
  return injectScriptAndStyle(tabId);
}

/**
 * Indicates whether user wants to ignore dialogs
 *
 * @returns whether dialogs should be ignored
 */
async function shouldBeIgnored(): Promise<boolean> {
  // Ignore and dismiss command if user opted-out of 'surveys'
  if (getSettings().show_survey === false) {
    logger.debug("[onpage-dialog]:show_survey - disabled");
    return true;
  }

  // Ignore and dismiss command if user opted-out of 'surveys'
  if (getSettings().suppress_surveys) {
    logger.debug("[onpage-dialog]:suppress_surveys - enabled");
    return true;
  }

  // Ignore and dismiss command if user opted-out of 'on page messages'
  if (getSettings().onpageMessages === false) {
    logger.debug("[onpage-dialog]:onpageMessages - disabled");
    return true;
  }
  return false;
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
  dialog: Dialog,
): Promise<ShowOnpageDialogResult> {
  // Ignore and dismiss dialog if user opted-out of notifications
  if (await shouldBeIgnored()) {
    logger.debug("[onpage-dialog]: User ignores notifications");
    return ShowOnpageDialogResult.rejected;
  }

  // Ignore and dismiss dialog if the given tab already contains a dialog
  if (await assignedDialogs.has(tabId)) {
    logger.debug("[onpage-dialog]: Tab already contains dialog");
    return ShowOnpageDialogResult.rejected;
  }

  const stats = getStats(dialog.id);
  // Ignore if on-page dialog should not be shown for this tab
  if (!(await shouldBeShown(tab, dialog, stats))) {
    logger.debug("[onpage-dialog]: Don't show");
    return ShowOnpageDialogResult.ignored;
  }

  logger.debug("[onpage-dialog]: Show dialog");
  await assignedDialogs.set(tabId, dialog);

  setStats(dialog.id, {
    displayCount: stats.displayCount + 1,
    lastDisplayTime: Date.now(),
  });

  const successfulInjection = await addDialog(tabId);
  if (!successfulInjection) {
    recordDialogEvent(dialog, DialogEventType.injected_error);
    return ShowOnpageDialogResult.error;
  }

  recordDialogEvent(dialog, DialogEventType.injected);
  return ShowOnpageDialogResult.shown;
}

/**
 * Handles browser.tabs.onUpdated events
 *
 * @param tabId - Tab ID
 * @param changeInfo - Tab change information
 * @param tab - Tab
 */
async function handleTabsUpdatedEvent(
  tabId: number,
  changeInfo: Tabs.OnUpdatedChangeInfoType,
  tab: Tabs.Tab,
): Promise<void> {
  if (unassignedDialogs.size === 0) {
    logger.debug("[onpage-dialog]: No command");
    return;
  }

  if (
    changeInfo.status !== "complete" ||
    tab.incognito ||
    typeof tab.url !== "string" ||
    !/^https?:/.test(tab.url)
  ) {
    return;
  }

  for (const dialog of unassignedDialogs.values()) {
    // Ignore and dismiss command if license state doesn't match those in the
    // command
    // eslint-disable-next-line no-await-in-loop
    if (!(await doesLicenseStateMatch(dialog.behavior))) {
      logger.debug("[onpage-dialog]: License has mismatch");
      dismissDialog(dialog);
      continue;
    }

    // eslint-disable-next-line no-await-in-loop
    const result = await showOnpageDialog(tabId, tab, dialog);
    if (result === ShowOnpageDialogResult.rejected) {
      dismissDialog(dialog);
    }
  }
}

/**
 * Initializes on-page manager
 */
async function start(): Promise<void> {
  await setupTimings();

  // Handle messages from content scripts
  port.on("onpage-dialog.close", handleCloseMessage);
  port.on("onpage-dialog.continue", handleContinueMessage);
  port.on("onpage-dialog.get", handleGetMessage);
  port.on("onpage-dialog.ping", handlePingMessage);
  port.on("onpage-dialog.error", handleErrorMessage);

  ext.addTrustedMessageTypes(null, [
    "onpage-dialog.continue",
    "onpage-dialog.close",
    "onpage-dialog.get",
    "onpage-dialog.ping",
    "onpage-dialog.error",
  ]);

  // Dismiss command when tab used for storing session data gets closed,
  // reloaded or unloaded
  assignedIpmIds.on("tab-removed", handleTabRemovedEvent);

  // Handle commands
  browser.tabs.onUpdated.addListener(handleTabsUpdatedEvent);
  setDialogCommandHandler(handleDialogCommand);
}
void start().catch(logger.error);
