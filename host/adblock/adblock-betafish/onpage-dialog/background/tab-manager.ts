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

import { shouldBeDismissed, shouldBeShown, start as setupTimings } from "./timing";
import { Message, ErrorMessage } from "../../polyfills/shared";
import { HideMessage, PingMessage, StartInfo } from "../shared";
import {
  DialogBehavior,
  DialogEventType,
  DialogErrorEventType,
  DialogExitEventType,
  isDialogBehavior,
  isDialogContent,
  setDialogCommandHandler,
} from "./middleware";
import { clearStats, getStats, isStats, setStats } from "./stats";
import { Stats } from "./stats.types";

/**
 * Tab-specific session storage for IPM IDs
 */
const assignedIpmIds = new TabSessionStorage("onpage-dialog:ipm");
/**
 * Queue of IPM IDs that haven't been assigned to a tab yet
 */
const unassignedIpmIds = new Set<string>();

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
 * Dismisses on-page dialog command
 *
 * @param ipmId - IPM ID
 */
function dismissDialogCommand(ipmId: string): void {
  logger.debug("[onpage-dialog]: Dismiss command");
  unassignedIpmIds.delete(ipmId);
  dismissCommand(ipmId);
}

/**
 * Dismissed on-page dialog
 *
 * @param tabId - Tab ID
 * @param ipmId - IPM ID
 */
async function dismissDialog(tabId: number, ipmId: string): Promise<void> {
  logger.debug("[onpage-dialog]: Dismiss dialog");
  try {
    await sendMessage(tabId, { type: "onpage-dialog.hide" } as HideMessage);
    await assignedIpmIds.transaction(async () => {
      await assignedIpmIds.delete(tabId);
    });
  } catch (ex) {
    // Ignore if tab has already been removed
  }

  // Dismiss command if on-page dialog should no longer be shown for any tab
  const behavior = getBehavior(ipmId);
  if (!isDialogBehavior(behavior)) {
    return;
  }

  const stats = getStats(ipmId);
  if (!isStats(stats)) {
    return;
  }

  // rather than after all on-page dialogs have been shown
  if (!shouldBeDismissed(behavior.timing, stats)) {
    logger.debug("[onpage-dialog]: Keep command active");
    return;
  }

  dismissDialogCommand(ipmId);
  clearStats(ipmId);
}

/**
 * Handles commands
 *
 * @param ipmId - IPM ID
 * @param isInitialization Whether the command is being restored when the
 *   module initializes
 */
function handleCommand(ipmId: string, isInitialization: boolean): void {
  if (!isInitialization) {
    setStats(ipmId, {
      displayCount: 0,
      lastDisplayTime: 0,
    });
  }
  unassignedIpmIds.add(ipmId);
  recordEvent(ipmId, CommandName.createOnPageDialog, DialogEventType.received);
}

/**
 * Handles "onpage-dialog.close" messages
 *
 * @param message - Message
 * @param sender - Message sender
 */
async function handleCloseMessage(message: Message, sender: MessageSender): Promise<void> {
  const ipmId = await assignedIpmIds.get(sender.page.id);
  if (typeof ipmId !== "string") {
    return;
  }

  void dismissDialog(sender.page.id, ipmId);
  recordEvent(ipmId, CommandName.createOnPageDialog, DialogEventType.closed);
}

/**
 * Handles "onpage-dialog.continue" messages
 *
 * @param message - Message
 * @param sender - Message sender
 */
async function handleContinueMessage(message: Message, sender: MessageSender): Promise<void> {
  const ipmId = await assignedIpmIds.get(sender.page.id);
  if (!ipmId) {
    return;
  }

  const behavior = getBehavior(ipmId) as DialogBehavior;
  if (!behavior) {
    return;
  }

  const targetUrl = createSafeOriginUrl(behavior.target);
  if (!targetUrl) {
    return;
  }

  void browser.tabs.create({ url: targetUrl });

  void dismissDialog(sender.page.id, ipmId);
  recordEvent(ipmId, CommandName.createOnPageDialog, DialogEventType.buttonClicked);
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
  const ipmId = await assignedIpmIds.get(sender.page.id);
  if (!ipmId) {
    logger.debug("[onpage-dialog]: get no IPM id");
    recordEvent(ipmId, CommandName.createOnPageDialog, DialogErrorEventType.get_no_ipm_found);
    return null;
  }

  const content = getContent(ipmId);
  if (!isDialogContent(content)) {
    logger.debug("[onpage-dialog]: get no dialog found");
    recordEvent(ipmId, CommandName.createOnPageDialog, DialogErrorEventType.get_no_dialog_found);
    return null;
  }
  logger.debug("[onpage-dialog]: get");
  return {
    content,
    localeInfo: getLocaleInfo(),
  };
}

/**
 * Handles "onpage-dialog.ping" messages
 *
 * @param message - Message
 * @param  sender - Message sender
 */
async function handlePingMessage(message: PingMessage, sender: MessageSender): Promise<void> {
  const ipmId = await assignedIpmIds.get(sender.page.id);
  if (!ipmId) {
    recordEvent(ipmId, CommandName.createOnPageDialog, DialogErrorEventType.ping_no_ipm_found);
    return;
  }

  const behavior = getBehavior(ipmId);
  if (!behavior || !isDialogBehavior(behavior)) {
    recordEvent(ipmId, CommandName.createOnPageDialog, DialogErrorEventType.ping_no_behavior_found);
    return;
  }

  // Check whether on-page dialog has been shown long enough already
  if (behavior.displayDuration === 0 || message.displayDuration < behavior.displayDuration) {
    recordEvent(ipmId, CommandName.createOnPageDialog, DialogEventType.initial_ping);
    return;
  }

  void dismissDialog(sender.page.id, ipmId);
  recordEvent(ipmId, CommandName.createOnPageDialog, DialogEventType.ignored);
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
  const ipmId = await assignedIpmIds.get(sender.page.id);
  if (!ipmId) {
    recordEvent(null, CommandName.createOnPageDialog, DialogErrorEventType.error_no_ipm_found);
    recordEvent(ipmId, CommandName.createOnPageDialog, `${message.type}.${message.error}`);
    return;
  }
  recordEvent(ipmId, CommandName.createOnPageDialog, `${message.type}.${message.error}`);
}

/**
 * Handles "tab-removed" tab session storage event
 *
 * @param data - Event data
 */
function handleTabRemovedEvent(data: TabRemovedEventData): void {
  const { tabId, value: ipmId } = data;
  if (typeof ipmId !== "string") {
    return;
  }

  void dismissDialog(tabId, ipmId);
  recordEvent(ipmId, CommandName.createOnPageDialog, DialogEventType.ignored);
}

/**
 * Injects the necessary user style and content script into the tab
 * to display the on-page dialog
 *
 * @param tabId - Tab ID
 * @param ipmId - IPM ID
 *
 * @returns true on success, false on error
 */
async function injectScriptAndStyle(tabId: number, ipmId: string): Promise<boolean> {
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
    logger.error("Injection of OPD css & script failed");
    logger.error(error);
    recordEvent(ipmId, CommandName.createOnPageDialog, DialogEventType.injected_error);
    dismissDialogCommand(ipmId);
    return false;
  }
}

/**
 * Injects the user style and content script into the tab to show the OPD
 * Updates the statistics on successful injection of the OPD
 *
 * @param tabId - Tab ID
 * @param ipmId - IPM ID
 * @param stats - On-page dialog stats
 */
async function showDialog(tabId: number, ipmId: string, stats: Stats): Promise<void> {
  logger.debug("[onpage-dialog]: Show dialog");
  await assignedIpmIds.transaction(async () => {
    await assignedIpmIds.set(tabId, ipmId);
  });
  if (await injectScriptAndStyle(tabId, ipmId)) {
    setStats(ipmId, {
      displayCount: stats.displayCount + 1,
      lastDisplayTime: Date.now(),
    });
    recordEvent(ipmId, CommandName.createOnPageDialog, DialogEventType.injected);
  }
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
  if (unassignedIpmIds.size === 0) {
    logger.debug("[onpage-dialog]: No command");
    return;
  }

  if (changeInfo.status !== "complete" || tab.incognito || !tab.url || !/^https?:/.test(tab.url)) {
    return;
  }

  /* eslint-disable no-await-in-loop */
  for (const ipmId of unassignedIpmIds) {
    // Ignore and dismiss command if user opted-out of 'surveys'
    if (getSettings().show_survey === false) {
      logger.debug("[onpage-dialog]:show_survey - disabled");
      recordEvent(ipmId, CommandName.createOnPageDialog, DialogExitEventType.tab_disabled);
      dismissDialogCommand(ipmId);
      continue;
    }

    // Ignore and dismiss command if user opted-out of 'surveys'
    if (getSettings().suppress_surveys) {
      logger.debug("[onpage-dialog]:suppress_surveys - enabled");
      recordEvent(ipmId, CommandName.createOnPageDialog, DialogExitEventType.tab_suppress_surveys);
      dismissDialogCommand(ipmId);
      continue;
    }

    // Ignore and dismiss command if user opted-out of 'on page messages'
    if (getSettings().onpageMessages === false) {
      logger.debug("[onpage-dialog]:onpageMessages - disabled");
      recordEvent(ipmId, CommandName.createOnPageDialog, DialogExitEventType.tab_opm_disabled);
      dismissDialogCommand(ipmId);
      continue;
    }

    // Ignore and dismiss command if it has no behavior
    const behavior = getBehavior(ipmId);
    if (!isDialogBehavior(behavior)) {
      logger.debug("[onpage-dialog]: No command behavior");
      recordEvent(
        ipmId,
        CommandName.createOnPageDialog,
        DialogErrorEventType.tab_no_behavior_found,
      );
      dismissDialogCommand(ipmId);
      continue;
    }

    // Ignore and dismiss command if License states doesn't match the license state of the command
    if (!(await doesLicenseStateMatch(behavior))) {
      logger.debug("[onpage-dialog]: License state mis-match");
      dismissCommand(ipmId);
      return;
    }

    // Ignore and dismiss command if it has no stats
    const stats = getStats(ipmId);
    if (!isStats(stats)) {
      logger.debug("[onpage-dialog]: No command stats");
      recordEvent(ipmId, CommandName.createOnPageDialog, DialogErrorEventType.tab_no_stats_found);
      dismissDialogCommand(ipmId);
      continue;
    }
    // Ignore command if on-page dialog should not be shown for this tab
    // eslint-disable-next-line no-nested-ternary
    if (!(await shouldBeShown(behavior, tab, stats))) {
      logger.debug("[onpage-dialog]: Don't show");
      continue;
    }

    await showDialog(tabId, ipmId, stats);
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
  setDialogCommandHandler(handleCommand);
}
void start().catch(logger.error);
