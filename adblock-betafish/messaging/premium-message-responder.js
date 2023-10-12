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

/* For ESLint: List any global identifiers used in this file below */
/* global browser, isTrustedSender, isTrustedSenderDomain, openTab,
   processMessageResponse */

import * as ewe from '@eyeo/webext-sdk';

import { License, replacedCounts, channels } from '../picreplacement/check';
import { channelsNotifier } from '../picreplacement/channels';
import SyncService from '../picreplacement/sync-service';
import { getSettings } from '../prefs/background';

/**
 * Process events related to the Premium object - License, Channels, and Sync-Service
 *
 */
const uiPorts = new Map();
const messageTypes = new Map([
  ['license', 'license.respond'],
  ['channels', 'channels.respond'],
  ['sync', 'sync.respond'],
]);


function sendMessage(type, action, ...args) {
  if (uiPorts.size === 0) {
    return;
  }
  for (const [uiPort, filters] of uiPorts) {
    const actions = filters.get(type);
    if (actions && actions.indexOf(action) !== -1) {
      uiPort.postMessage({
        type: messageTypes.get(type),
        action,
        args,
      });
    }
  }
}

function getListener(type, action) {
  return (...args) => {
    sendMessage(type, action, ...args);
  };
}

function listen(type, filters, newFilter) {
  switch (type) {
    case 'license':
      filters.set('license', newFilter);
      break;
    case 'channels':
      filters.set('channels', newFilter);
      break;
    case 'sync':
      filters.set('sync', newFilter);
      break;
    default:
    // do nothing
  }
}

function onConnect(uiPort) {
  if (!isTrustedSender(uiPort.sender)) {
    return;
  }

  if (uiPort.name !== 'premium') {
    return;
  }

  const filters = new Map();
  uiPorts.set(uiPort, filters);

  uiPort.onDisconnect.addListener(() => {
    uiPorts.delete(uiPort);
  });

  uiPort.onMessage.addListener((message) => {
    const [type, action] = message.type.split('.', 2);
    if (action === 'listen') {
      listen(type, filters, message.filter, message,
        uiPort.sender && uiPort.sender.tab && uiPort.sender.tab.id);
    }
  });
}
browser.runtime.onConnect.addListener(onConnect);

const injectScript = async function (scriptFileName, tabId, frameId) {
  try {
    if (browser.scripting) {
      await browser.scripting.executeScript({
        target: { tabId, frameIds: [frameId] },
        files: [scriptFileName],
      });
    } else {
      await browser.tabs.executeScript(tabId, { file: scriptFileName, frameId, runAt: 'document_start' });
    }
  } catch (error) {
    /* eslint-disable-next-line no-console */
    console.error(error);
  }
};

/**
 * Process complex messages related to the 'License' object
 *
 */
License.ready().then(() => {
  browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.message === 'load_my_adblock') {
      if (
        License.isActiveLicense()
        && sender.url
        && sender.url.startsWith('http')
        && ewe.subscriptions.has('https://cdn.adblockcdn.com/filters/distraction-control.txt')
        && ewe.filters.getAllowingFilters(sender.tab.id).length === 0
      ) {
        void injectScript('adblock-picreplacement-push-notification-wrapper-cs.js', sender.tab.id, sender.frameId);
      }
      sendResponse({});
    }
  });

  /**
   * Process general messages related to the 'License' object,
   * which require sender validation. (These may come from content scripts,
   * where the sender URL is the page, not the extension.)
   *
   */
  /* eslint-disable consistent-return */
  browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (!isTrustedSender(sender)) {
      return;
    }
    const { command } = message;
    switch (command) {
      case 'cleanUpSevenDayAlarm':
        License.cleanUpSevenDayAlarm();
        sendResponse({});
        break;
      case 'updatePeriodically':
        License.updatePeriodically();
        sendResponse({});
        break;
      case 'shouldShowMyAdBlockEnrollment':
        return processMessageResponse(sendResponse, License.shouldShowMyAdBlockEnrollment());
      default:
    }
  });

  /**
   * Process general messages related to the 'License' object,
   * which do not require sender validation (or come from injected files)
   *
   */
  /* eslint-disable consistent-return */
  browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (!isTrustedSenderDomain(sender)) {
      return;
    }
    const { command } = message;
    switch (command) {
      case 'openPremiumPayURL':
        openTab(License.MAB_CONFIG.payURL);
        sendResponse({});
        break;
      case 'payment_success':
        License.activate();
        sendResponse({ ack: true });
        break;
      case 'isActiveLicense':
        return processMessageResponse(sendResponse, License.isActiveLicense());
      case 'setBlacklistCTAStatus':
        License.shouldShowBlacklistCTA(message.isEnabled);
        sendResponse({});
        break;
      case 'setWhitelistCTAStatus':
        License.shouldShowWhitelistCTA(message.isEnabled);
        sendResponse({});
        break;
      default:
    }
  });

  /**
   * Process the message related to getting the 'License' object
   *
   */
  /* eslint-disable consistent-return */
  browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.command === 'getLicenseConfig') {
      sendResponse({});
      const response = {
        getFormattedActiveSinceDate: License.getFormattedActiveSinceDate(),
        MAB_CONFIG: License.MAB_CONFIG,
        shouldShowMyAdBlockEnrollment: License.shouldShowMyAdBlockEnrollment(),
        shouldShowPremiumCTA: License.shouldShowPremiumCTA(),
        isActiveLicense: License.isActiveLicense(),
        isLicenseCodeValid: License.isLicenseCodeValid(),
        pageReloadedOnSettingChangeKey: License.pageReloadedOnSettingChangeKey,
        userClosedSyncCTAKey: License.userClosedSyncCTAKey,
        userSawSyncCTAKey: License.userSawSyncCTAKey,
        themesForCTA: License.userSawSyncCTAKey,
      };
      Object.assign(response, License.get());
      return Promise.resolve(response);
    }
  });

  /**
   * Process the messages related to Channels object
   *
   */
  /* eslint-disable consistent-return */
  browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (!isTrustedSender(sender)) {
      return;
    }
    const { command } = message;
    switch (command) {
      case 'channels.getGuide':
        return processMessageResponse(sendResponse, channels.getGuide());
      case 'channels.isAnyEnabled':
        return processMessageResponse(sendResponse, channels.isAnyEnabled());
      case 'channels.isCustomChannelEnabled':
        return processMessageResponse(sendResponse, channels.isCustomChannelEnabled());
      case 'channels.initializeListeners':
        return processMessageResponse(sendResponse, channels.initializeListeners());
      case 'channels.setEnabled':
        return processMessageResponse(sendResponse,
          channels.setEnabled(message.channelId, message.enabled));
      case 'channels.getIdByName':
        return processMessageResponse(sendResponse, channels.getIdByName(message.name));
      case 'channels.disableAllChannels':
        return processMessageResponse(sendResponse, channels.disableAllChannels());
      default:
    }
  });

  /**
   * Process the `getrandomlisting` &
   * 'channels.recordOneAdReplaced' message from the Image Swap content script
   *
   */
  browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.command === 'channels.getrandomlisting') {
      if (!!ewe.filters.getAllowingFilters(sender.tab.id).length || !License.isActiveLicense()) {
        sendResponse({ disabledOnPage: true });
        return;
      }
      const result = channels.randomListing(message.opts);
      if (result) {
        sendResponse(result);
        return;
      }
      sendResponse({ disabledOnPage: true });
    } else if (message.command === 'channels.recordOneAdReplaced') {
      sendResponse({});
      if (License.isActiveLicense()) {
        replacedCounts.recordOneAdReplaced(sender.tab.id);
      }
    }
  });

  /**
   * Process the messages related to Custom channel object
   *
   */
  /* eslint-disable consistent-return */
  browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (!isTrustedSender(sender)) {
      return;
    }
    const { command } = message;
    switch (command) {
      case 'customchannel.isMaximumAllowedImages': {
        const customChannelId = channels.getIdByName('CustomChannel');
        const customChannel = channels.channelGuide[customChannelId].channel;
        return processMessageResponse(sendResponse, customChannel.isMaximumAllowedImages());
      }
      case 'customchannel.getListings': {
        const customChannelId = channels.getIdByName('CustomChannel');
        const customChannel = channels.channelGuide[customChannelId].channel;
        return processMessageResponse(sendResponse, customChannel.getListings());
      }
      case 'customchannel.addCustomImage': {
        const customChannelId = channels.getIdByName('CustomChannel');
        const customChannel = channels.channelGuide[customChannelId].channel;
        return processMessageResponse(sendResponse,
          customChannel.addCustomImage(message.imageInfo));
      }
      case 'customchannel.removeListingByURL': {
        const customChannelId = channels.getIdByName('CustomChannel');
        const customChannel = channels.channelGuide[customChannelId].channel;
        return processMessageResponse(sendResponse,
          customChannel.removeListingByURL(message.url));
      }
      default:
    }
  });

  /**
   * Process the messages related to Sync Service object
   *
   */
  /* eslint-disable consistent-return */
  browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (!isTrustedSender(sender)) {
      return;
    }
    const { command } = message;
    switch (command) {
      case 'resetLastGetStatusCode':
        SyncService.resetLastGetStatusCode();
        sendResponse({});
        break;
      case 'resetLastGetErrorResponse':
        SyncService.resetLastGetErrorResponse();
        sendResponse({});
        break;
      case 'resetLastPostStatusCode':
        SyncService.resetLastPostStatusCode();
        sendResponse({});
        break;
      case 'resetAllSyncErrors':
        SyncService.resetAllSyncErrors();
        sendResponse({});
        break;
      case 'SyncService.enableSync':
        SyncService.enableSync(message.initialGet);
        sendResponse({});
        break;
      case 'SyncService.disableSync':
        SyncService.disableSync(message.removeName);
        sendResponse({});
        break;
      case 'SyncService.getLastPostStatusCode':
        return processMessageResponse(sendResponse, SyncService.getLastPostStatusCode());
      case 'SyncService.getLastGetStatusCode':
        return processMessageResponse(sendResponse, SyncService.getLastGetStatusCode());
      case 'SyncService.getAllExtensionNames':
        return processMessageResponse(sendResponse, SyncService.getAllExtensionNames());
      case 'SyncService.getCurrentExtensionName':
        return processMessageResponse(sendResponse, SyncService.getCurrentExtensionName());
      case 'SyncService.processUserSyncRequest':
        SyncService.processUserSyncRequest();
        sendResponse({});
        break;
      case 'SyncService.removeExtensionName':
        SyncService.removeExtensionName(message.dataDeviceName, message.dataExtensionGUID);
        sendResponse({});
        break;
      case 'SyncService.setCurrentExtensionName':
        SyncService.setCurrentExtensionName(message.name);
        sendResponse({});
        break;
      default:
    }
  });

  License.licenseNotifier.on('license.updating', getListener('license', 'updating'));
  License.licenseNotifier.on('license.updated', getListener('license', 'updated'));
  License.licenseNotifier.on('license.updated.error', getListener('license', 'updated.error'));
  License.licenseNotifier.on('license.expired', getListener('license', 'expired'));

  SyncService.syncNotifier.on('sync.data.receieved', getListener('sync', 'sync.data.receieved'));
  SyncService.syncNotifier.on('sync.data.getting', getListener('sync', 'sync.data.getting'));
  SyncService.syncNotifier.on('sync.data.error.initial.fail', getListener('sync', 'sync.data.error.initial.fail'));
  SyncService.syncNotifier.on('sync.data.getting.error', getListener('sync', 'sync.data.getting.error'));
  SyncService.syncNotifier.on('extension.names.downloading', getListener('sync', 'extension.names.downloading'));
  SyncService.syncNotifier.on('extension.names.downloaded', getListener('sync', 'extension.names.downloaded'));
  SyncService.syncNotifier.on('extension.names.downloading.error', getListener('sync', 'extension.names.ownloading.error'));
  SyncService.syncNotifier.on('extension.name.updating', getListener('sync', 'extension.name.updating'));
  SyncService.syncNotifier.on('extension.name.updated', getListener('sync', 'extension.name.updated'));
  SyncService.syncNotifier.on('extension.name.updated.error', getListener('sync', 'extension.name.updated.error'));
  SyncService.syncNotifier.on('extension.name.remove', getListener('sync', 'extension.name.remove'));
  SyncService.syncNotifier.on('extension.name.removed', getListener('sync', 'extension.name.removed'));
  SyncService.syncNotifier.on('extension.name.remove.error', getListener('sync', 'extension.name.remove.error'));
  SyncService.syncNotifier.on('post.data.sending', getListener('sync', 'post.data.sending'));
  SyncService.syncNotifier.on('post.data.sent', getListener('sync', 'post.data.sent'));
  SyncService.syncNotifier.on('post.data.sent.error', getListener('sync', 'post.data.sent.error'));

  channelsNotifier.on('channels.changed', getListener('channels', 'changed'));
});

const webNavigationHandler = async function (details) {
  await License.ready();
  const {
    url = '', documentLifecycle = 'active', tabId, frameId,
  } = details;
  if (
    url.startsWith('http')
    && License.isActiveLicense()
    && documentLifecycle === 'active'
    && getSettings().picreplacement
  ) {
    void injectScript('adblock-picreplacement.js', tabId, frameId);
  }
};

/**
 * Initializes module
 */
const start = function () {
  browser.webNavigation.onCommitted.addListener(webNavigationHandler);
};
start();
