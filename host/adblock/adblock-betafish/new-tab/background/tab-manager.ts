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

import * as browser from "webextension-polyfill";
import { ExtendedInstallType } from "~/management";
import {
  CommandEventType,
  CommandName,
  createSafeOriginUrl,
  dismissCommand,
  doesLicenseStateMatch,
  getBehavior,
  getCommand,
  isCommandExpired,
  recordEvent,
} from "../../ipm/background";

import * as logger from "../../utilities/background";
import { getSettings, settings } from "../../prefs/background/settings";
import { CreationMethod, isNewTabBehavior, setNewTabCommandHandler } from "./middleware";
import {
  NewTabEventType,
  NewTabErrorEventType,
  NewTabExitEventType,
  blockCountQueryParameter,
} from "./tab-manager.types";
import { Prefs } from "../../alias/prefs";
import { checkLanguage } from "../../ipm/background/language-check";

const tabIds = new Set<number | undefined>();

const onCreatedHandlerByIPMids = new Map();
const onUpdatedHandlerByIPMids = new Map();

const openNewtabOnUpdatedHandlerByIPMids = new Map();

let newTabCounter = 0;

/**
 *  Count interval at which to send the number of new tabs opened
 *  that are not blank (HTTP/S and browser pages)
 */
const newTabMessageSendTrigger = [1, 10, 20, 100, 200];

/**
 * Registers an event with the data collection feature.
 *
 * @param ipmId The ipm id to register the event for
 * @param name The event name to register
 */
function registerEvent(
  ipmId: string,
  name: CommandEventType | NewTabEventType | NewTabExitEventType | NewTabErrorEventType,
): void {
  recordEvent(ipmId, CommandName.createTab, name);
}

/**
 * Event handler for the on tab updated event
 *
 * @param tabId - The id of the tab updated
 * @param changeInfo - Lists the changes to the state of the tab that is updated
 * @param tab - The tab updated
 */
const openNewtabOnUpdated = (
  ipmId: string,
  tabId: number,
  changeInfo: browser.Tabs.OnUpdatedChangeInfoType,
  tab: browser.Tabs.Tab,
) => {
  if (changeInfo.status !== "complete" || tab === null || tabId !== tab.id) {
    return;
  }
  const onUpdatedHandler = openNewtabOnUpdatedHandlerByIPMids.get(ipmId);
  openNewtabOnUpdatedHandlerByIPMids.delete(ipmId);
  browser.tabs.onUpdated.removeListener(onUpdatedHandler);
  registerEvent(ipmId, NewTabEventType.loaded);
};

/**
 * Adds a query parameter to the given URL that contains the number of
 * blocked requests, and returns the new URL.
 *
 * Will yield `null` if the URL is not well-formed.
 *
 * @param urlString A well-formed URL
 * @returns The URL with an added block count parameter
 */
async function addBlockCountToURL(urlString: string): Promise<string | null> {
  let url;
  try {
    url = new URL(urlString);
  } catch (_) {
    return null;
  }

  await Prefs.untilLoaded;
  const blockCount = Prefs.get("blocked_total");
  url.searchParams.append(blockCountQueryParameter, blockCount);
  return url.toString();
}

/**
 * Opens the new tab to the URL specified on the IPM command
 *
 * @param ipmId - IPM ID
 */
async function openNewtab(ipmId: string): Promise<void> {
  logger.debug("[new-tab]:openNewtab");

  const command = getCommand(ipmId);
  if (!command) {
    return;
  }

  // Run mandatory language skew check
  void checkLanguage(ipmId);

  // Ignore and dismiss command if it has no behavior
  const behavior = getBehavior(ipmId);
  if (!isNewTabBehavior(behavior)) {
    logger.debug("[new-tab]: No command behavior");
    registerEvent(ipmId, NewTabErrorEventType.noBehaviorFound);
    dismissCommand(ipmId);
    return;
  }
  // Ignore and dismiss command if License states doesn't match the license state of the command
  if (!(await doesLicenseStateMatch(behavior))) {
    logger.debug("[new-tab]: License state mis-match");
    registerEvent(ipmId, NewTabErrorEventType.licenseStateNoMatch);
    dismissCommand(ipmId);
    return;
  }

  const targetUrl = createSafeOriginUrl(behavior.target);
  if (!targetUrl) {
    registerEvent(ipmId, NewTabErrorEventType.noUrlFound);
    dismissCommand(ipmId);
    return;
  }

  const url = await addBlockCountToURL(targetUrl);
  if (url === null) {
    registerEvent(ipmId, NewTabErrorEventType.noUrlFound);
    dismissCommand(ipmId);
    logger.debug("[new-tab]: Invalid URL.");
    return;
  }

  // Ignore and dismiss command if it has expired
  if (isCommandExpired(command)) {
    logger.error("[new-tab]: Command has expired.");
    registerEvent(ipmId, CommandEventType.expired);
    dismissCommand(ipmId);
    return;
  }

  let tab: browser.Tabs.Tab | null = null;
  const onUpdatedHandler = openNewtabOnUpdated.bind(null, ipmId);
  openNewtabOnUpdatedHandlerByIPMids.set(ipmId, onUpdatedHandler);
  browser.tabs.onUpdated.addListener(onUpdatedHandler);

  tab = await browser.tabs.create({ url }).catch((error) => {
    logger.error("[new-tab]: create tab error", error);
    registerEvent(ipmId, NewTabErrorEventType.tabCreationError);
    return null;
  });
  if (tab !== null) {
    registerEvent(ipmId, NewTabEventType.created);
    dismissCommand(ipmId);
  }
}

/**
 * Once we've determined the conditions to open new are met,
 * do some housecleaning and then open the new tab
 *
 * @param ipmId - IPM ID
 */
const openNotificationTab = (ipmId: string) => {
  const onCreatedHandler = onCreatedHandlerByIPMids.get(ipmId);
  onCreatedHandlerByIPMids.delete(ipmId);
  const onUpdatedHandler = onUpdatedHandlerByIPMids.get(ipmId);
  onUpdatedHandlerByIPMids.delete(ipmId);

  // If we're here via the `force` method, we don't have handlers
  if (typeof onCreatedHandler !== "undefined") {
    browser.tabs.onCreated.removeListener(onCreatedHandler);
    browser.tabs.onUpdated.removeListener(onUpdatedHandler);
  }
  // eslint-disable-next-line no-use-before-define
  browser.tabs.onRemoved.removeListener(onRemoved);

  tabIds.clear();
  openNewtab(ipmId);
};

/**
 * Event handler for the on tab create event
 *
 * @param tab - The tab created
 */
const onCreated = (ipmId: string, tab: browser.Tabs.Tab) => {
  // Firefox loads its New Tab Page immediately and doesn't notify us
  // when it's complete so we need to open our new tab already here.
  if (tab.url === "about:newtab") {
    openNotificationTab(ipmId);
    return;
  }
  tabIds.add(tab.id);
};

/**
 * Event handler for the on tab removed event
 *
 * @param tabId - The id of the tab removed
 */
const onRemoved = (tabId: number) => {
  tabIds.delete(tabId);
};

/**
 * Event handler for the on tab updated event
 *
 * @param tabId - The id of the tab updated
 * @param changeInfo - Lists the changes to the state of the tab that is updated
 * @param tab - The tab updated
 */
const onUpdated = (
  ipmId: string,
  tabId: number,
  changeInfo: browser.Tabs.OnUpdatedChangeInfoType,
  tab: browser.Tabs.Tab,
) => {
  // Only look at tabs that have been opened since we started listening
  // and that have completed loading.
  if (!tabIds.has(tabId) || changeInfo.status !== "complete") {
    return;
  }

  tabIds.delete(tabId);

  // Open our own new tab only when a new tab gets opened
  // that isn't part of the user browsing the web.
  if (tab.url && /^https?:/.test(tab.url)) {
    newTabCounter += 1;
    if (newTabMessageSendTrigger.includes(newTabCounter)) {
      recordEvent(ipmId, CommandName.createTab, `${NewTabEventType.has_content}:${newTabCounter}`);
    }
    return;
  }

  openNotificationTab(ipmId);
};

/**
 * Handles new tab command
 *
 * @param ipmId - IPM ID
 */
async function handleCommand(ipmId: string): Promise<void> {
  logger.debug("[new-tab]:tab manager handleCommand", ipmId);

  const { installType } = await browser.management.getSelf();
  if ((installType as ExtendedInstallType) === "admin") {
    registerEvent(ipmId, NewTabExitEventType.admin);
    dismissCommand(ipmId);
    return;
  }

  await settings.onload();
  // Ignore and dismiss command if user opted-out of 'surveys'
  if (getSettings().suppress_update_page) {
    logger.debug("[new-tab]:suppress_update_page - true");
    registerEvent(ipmId, NewTabExitEventType.disabled);
    dismissCommand(ipmId);
    return;
  }

  // Ignore and dismiss command if behavior is invalid.
  logger.debug("[new-tab]:openNewtab");
  const behavior = getBehavior(ipmId);
  if (!isNewTabBehavior(behavior)) {
    logger.debug("[new-tab]: Invalid command behavior");
    registerEvent(ipmId, NewTabErrorEventType.noBehaviorFound);
    dismissCommand(ipmId);
    return;
  }

  // Let the IPM know we received the command.
  registerEvent(ipmId, NewTabEventType.received);

  // If the method is `force`, we need to create the tab right away.
  if (behavior.method === CreationMethod.force) {
    openNotificationTab(ipmId);
    return;
  }

  // Add listeners
  const onCreatedHandler = onCreated.bind(null, ipmId);
  onCreatedHandlerByIPMids.set(ipmId, onCreatedHandler);

  const onUpdatedHandler = onUpdated.bind(null, ipmId);
  onUpdatedHandlerByIPMids.set(ipmId, onUpdatedHandler);

  browser.tabs.onCreated.addListener(onCreatedHandler);
  browser.tabs.onRemoved.addListener(onRemoved);
  browser.tabs.onUpdated.addListener(onUpdatedHandler);

  newTabCounter = 0;
}

/**
 * Initializes new tab manager
 */
async function start(): Promise<void> {
  logger.debug("[new-tab]:tab manager start");

  setNewTabCommandHandler(handleCommand);
}

void start().catch(logger.error);
