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

import * as browser from 'webextension-polyfill';
import { ExtendedInstallType } from 'adblock-betafish/management';
import {
  CommandName,
  createSafeOriginUrl,
  dismissCommand,
  doesLicenseStateMatch,
  getBehavior,
  recordEvent,
} from '../../ipm/background';

import * as logger from '../../utilities/background';
import { getSettings, settings } from '../../prefs/background/settings';
import {
  NewTabEventType,
  isNewTabBehavior,
  setNewTabCommandHandler,
} from './middleware';

const tabIds = new Set<number | undefined>();

const onCreatedHandlerByIPMids = new Map();
const onUpdatedHandlerByIPMids = new Map();

const openNewtabOnUpdatedHandlerByIPMids = new Map();

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
  if (changeInfo.status !== 'complete' || tab === null || tabId !== tab.id) {
    return;
  }
  const onUpdatedHandler = openNewtabOnUpdatedHandlerByIPMids.get(ipmId);
  openNewtabOnUpdatedHandlerByIPMids.delete(ipmId);
  browser.tabs.onUpdated.removeListener(onUpdatedHandler);
  recordEvent(ipmId, CommandName.createTab, NewTabEventType.loaded);
};

/**
 * Opens the new tab to the URL specified on the IPM command
 *
 * @param ipmId - IPM ID
 */
async function openNewtab(
  ipmId: string,
): Promise<void> {
  // Ignore and dismiss command if it has no behavior
  logger.debug('[new-tab]:openNewtab');
  const behavior = getBehavior(ipmId);
  if (!isNewTabBehavior(behavior)) {
    logger.debug('[new-tab]: No command behavior');
    dismissCommand(ipmId);
    return;
  }
  // Ignore and dismiss command if License states doesn't match the license state of the command
  if (!await doesLicenseStateMatch(behavior)) {
    logger.debug('[new-tab]: License state mis-match');
    dismissCommand(ipmId);
    return;
  }

  const targetUrl = createSafeOriginUrl(behavior.target);
  if (!targetUrl) {
    dismissCommand(ipmId);
    return;
  }
  let tab: browser.Tabs.Tab | null = null;
  const onUpdatedHandler = openNewtabOnUpdated.bind(null, ipmId);
  openNewtabOnUpdatedHandlerByIPMids.set(ipmId, onUpdatedHandler);
  browser.tabs.onUpdated.addListener(onUpdatedHandler);

  tab = await browser.tabs.create({ url: targetUrl }).catch((error) => {
    logger.error('[new-tab]: create tab error', error);
    return null;
  });
  if (tab !== null) {
    recordEvent(ipmId, CommandName.createTab, NewTabEventType.created);
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

  browser.tabs.onCreated.removeListener(onCreatedHandler);
  browser.tabs.onUpdated.removeListener(onUpdatedHandler);
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
  if (tab.url === 'about:newtab') {
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
  if (!tabIds.has(tabId) || changeInfo.status !== 'complete') {
    return;
  }

  tabIds.delete(tabId);

  // Open our own new tab only when a new tab gets opened
  // that isn't part of the user browsing the web.
  if (tab.url && /^https?:/.test(tab.url)) {
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
  logger.debug('[new-tab]:tab manager handleCommand', ipmId);

  const { installType } = await browser.management.getSelf();
  if ((installType as ExtendedInstallType) === 'admin') {
    dismissCommand(ipmId);
    return;
  }

  await settings.onload();
  // Ignore and dismiss command if user opted-out of 'surveys'
  if (getSettings().suppress_update_page) {
    logger.debug('[new-tab]:suppress_update_page - true');
    dismissCommand(ipmId);
    return;
  }
  const onCreatedHandler = onCreated.bind(null, ipmId);
  onCreatedHandlerByIPMids.set(ipmId, onCreatedHandler);

  const onUpdatedHandler = onUpdated.bind(null, ipmId);
  onUpdatedHandlerByIPMids.set(ipmId, onUpdatedHandler);

  browser.tabs.onCreated.addListener(onCreatedHandler);
  browser.tabs.onRemoved.addListener(onRemoved);
  browser.tabs.onUpdated.addListener(onUpdatedHandler);
}


/**
 * Initializes new tab manager
 */
async function start(): Promise<void> {
  logger.debug('[new-tab]:tab manager start');

  setNewTabCommandHandler(handleCommand);
}

void start().catch(logger.error);
