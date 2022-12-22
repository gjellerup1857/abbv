/* For ESLint: List any global identifiers used in this file below */
/* global browser, isTrustedSender,  isTrustedTarget, tryToUnwhitelist, getUserFilters,
   createDomainAllowlistFilter, addCustomFilter, countCache, checkUpdateProgress,
   adblockIsPaused, pageIsWhitelisted, adblockIsDomainPaused, getCurrentTabInfo,
   openTab, updateFilterLists, isTrustedSenderDomain, updateButtonUIAndContextMenus,
   getDebugInfo, addYTChannelListeners, removeYTChannelListeners, openYTManagedSubPage,
   addTwitchAllowlistListeners, removeTwitchAllowlistListeners, abpPrefPropertyNames,
   pausedFilterText1, pausedFilterText2, updateCustomFilterCountMap, LocalCDN
*/


import * as ewe from '../../vendor/webext-sdk/dist/ewe-api';
import {
  getSettings, setSetting, settings, settingsNotifier, isValidTheme,
} from '../prefs/settings';
import SubscriptionAdapter from '../subscriptionadapter';
import DataCollectionV2 from '../datacollection.v2';
import ServerMessages from '../servermessages';
import LocalDataCollection from '../localdatacollection';
import ExcludeFilter from '../excludefilter';
import { getNewBadgeTextReason, showIconBadgeCTA } from '../alias/icon';

const processMessageResponse = (sendResponse, responseData) => {
  sendResponse({});
  return Promise.resolve(responseData);
};

Object.assign(window, {
  processMessageResponse,
});

const uiPorts = new Map();
const messageTypes = new Map([
  ['settings', 'settings.respond'],
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
    case 'settings':
      filters.set('settings', newFilter);
      break;
    default:
        // do nothing
  }
}

function onConnect(uiPort) {
  if (!isTrustedSender(uiPort.sender)) {
    return;
  }

  if (uiPort.name !== 'settings') {
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

/**
 * Process messages and events related to the 'Settings' object
 *
 */
settings.onload().then(() => {
  /* eslint-disable consistent-return */
  browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (!isTrustedSender(sender)) {
      return;
    }
    const { command } = message;
    switch (command) {
      case 'setSetting':
        setSetting(message.name, message.isEnabled);
        sendResponse({});
        break;
      case 'isValidTheme':
        return processMessageResponse(sendResponse, isValidTheme(message.name));
      case 'getABPPrefPropertyNames':
        return processMessageResponse(sendResponse, abpPrefPropertyNames);
      default:
    }
  });
  settingsNotifier.on('settings.changed', getListener('settings', 'changed'));
});

/**
 * Process messages from Popup menu and other UI components
 *
 */
/* eslint-disable consistent-return */
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!isTrustedSender(sender)) {
    return;
  }
  const { command } = message;
  switch (command) {
    case 'pageIsWhitelisted':
      sendResponse(pageIsWhitelisted(JSON.parse(message.page)));
      break;
    case 'adblockIsPaused': {
      const isPaused = adblockIsPaused(message.newValue);
      sendResponse(isPaused);
      return Promise.resolve(isPaused);
    }
    case 'adblockIsDomainPaused': {
      const isDomainPaused = adblockIsDomainPaused(message.activeTab, message.newValue);
      sendResponse(isDomainPaused);
      return Promise.resolve(isDomainPaused);
    }
    case 'getPausedFilterText':
      return processMessageResponse(sendResponse, { pausedFilterText1, pausedFilterText2 });
    case 'getCurrentTabInfo':
      sendResponse({});
      return getCurrentTabInfo(false, message.tabId).then(results => results);
    case 'updateCustomFilterCountMap':
      updateCustomFilterCountMap(message.countMap);
      sendResponse({});
      return;
    case 'updateFilterLists':
      updateFilterLists();
      sendResponse({});
      return;
    case 'checkUpdateProgress':
      sendResponse(checkUpdateProgress());
      return;
    case 'getCustomFilterCount':
      sendResponse({ response: countCache.getCustomFilterCount(message.host) });
      return;
    case 'subscriptions.has':
      return processMessageResponse(sendResponse, ewe.subscriptions.has(message.url));
    case 'createDomainAllowlistFilter':
      sendResponse({});
      return createDomainAllowlistFilter(message.url, message.origin).then(results => results);
    case 'getUserFilters':
      sendResponse({ response: getUserFilters() });
      return;
    case 'tryToUnwhitelist':
      sendResponse({});
      return tryToUnwhitelist(message.url, message.id).then(results => results);
    case 'getDebugInfo':
      sendResponse({});
      return getDebugInfo();
    case 'showIconBadgeCTA':
      sendResponse({});
      showIconBadgeCTA(message.value);
      return;
    case 'getNewBadgeTextReason':
      sendResponse({ reason: getNewBadgeTextReason() });
      return;
    case 'updateButtonUIAndContextMenus':
      updateButtonUIAndContextMenus();
      sendResponse({});
      break;
    default:
  }
});

/**
 * Process the 'addCustomFilter' message the wizards, which requires verifing the
 * `addCustomFilterRandomName` on the message matches what is current set on the global
 * name space
 *
 */
/* eslint-disable consistent-return */
browser.runtime.onMessage.addListener((message) => {
  if (
    message.command === 'addCustomFilter'
    && message.filterTextToAdd
    && message.addCustomFilterRandomName === window.addCustomFilterRandomName
  ) {
    window.addCustomFilterRandomName = '';
    return addCustomFilter(message.filterTextToAdd, message.origin).then(results => results);
  }
});

/**
 * Process messages that are sent from a content script
 *
 */
//
/* eslint-disable consistent-return */
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (isTrustedSenderDomain(sender) || isTrustedSender(sender)) {
    const { command } = message;
    switch (command) {
      case 'subscribe':
        SubscriptionAdapter.subscribe({ id: message.id });
        sendResponse({});
        break;
      case 'unsubscribe':
        SubscriptionAdapter.unsubscribe({ adblockId: message.adblockId });
        sendResponse({});
        break;
      case 'getIdFromURL':
        sendResponse({});
        return processMessageResponse(sendResponse,
          SubscriptionAdapter.getIdFromURL(message.url));
      case 'isLanguageSpecific':
        sendResponse({});
        return processMessageResponse(sendResponse,
          SubscriptionAdapter.isLanguageSpecific(message.id));
      case 'getSubscriptionsMinusText':
        sendResponse({});
        return processMessageResponse(sendResponse,
          SubscriptionAdapter.getSubscriptionsMinusText());
      case 'getAllSubscriptionsMinusText':
        sendResponse({});
        return processMessageResponse(sendResponse,
          SubscriptionAdapter.getAllSubscriptionsMinusText());
      case 'recordGeneralMessage':
        ServerMessages.recordGeneralMessage(message.msg, undefined, message.additionalParams);
        sendResponse({});
        break;
      default:
    }
  }
});

/**
 * Process messages that are sent from a content script & trusted senders
 *
 */
//
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const { command } = message;
  switch (command) {
    case 'getSettings':
      sendResponse(getSettings());
      break;
    case 'openTab':
      openTab(message.urlToOpen);
      sendResponse({});
      break;
    default:
  }
});

/**
 * Process messages for the LocalCDN
 *
 */
/* eslint-disable consistent-return */
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!isTrustedSender(sender)) {
    return;
  }
  const { command } = message;
  switch (command) {
    case 'LocalCDN.start':
      LocalCDN.start();
      sendResponse({});
      break;
    case 'LocalCDN.end':
      LocalCDN.end();
      sendResponse({});
      break;
    case 'LocalCDN.isAvailable':
      return processMessageResponse(sendResponse, (typeof LocalCDN === 'object'));
    default:
  }
});

/**
 * Process messages for the DataCollectionV2
 *
 */
/* eslint-disable consistent-return */
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!isTrustedSender(sender)) {
    return;
  }
  const { command } = message;
  switch (command) {
    case 'DataCollectionV2.start':
      return processMessageResponse(sendResponse, DataCollectionV2.start());
    case 'DataCollectionV2.end':
      return processMessageResponse(sendResponse, DataCollectionV2.end());
    default:
  }
});

/**
 * Process messages for the  Exclude Filters, Local Data Collection,
 * Server Messages, YT Channel & Twitch Channel Listeners
 *
 */
/* eslint-disable consistent-return */
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!isTrustedSender(sender)) {
    return;
  }
  const { command } = message;
  switch (command) {
    case 'addYTChannelListeners':
      addYTChannelListeners();
      sendResponse({});
      break;
    case 'removeYTChannelListeners':
      removeYTChannelListeners();
      sendResponse({});
      break;
    case 'openYTManagedSubPage':
      openYTManagedSubPage();
      sendResponse({});
      break;
    case 'addTwitchAllowlistListeners':
      addTwitchAllowlistListeners();
      sendResponse({});
      break;
    case 'removeTwitchAllowlistListeners':
      removeTwitchAllowlistListeners();
      sendResponse({});
      break;
    case 'recordAnonymousErrorMessage':
      ServerMessages.recordAnonymousErrorMessage(message.msg, undefined, message.additionalParams);
      sendResponse({});
      break;
    case 'LocalDataCollection.clearCache':
      LocalDataCollection.clearCache();
      sendResponse({});
      break;
    case 'LocalDataCollection.end':
      return processMessageResponse(sendResponse, LocalDataCollection.end());
    case 'LocalDataCollection.start':
      return processMessageResponse(sendResponse, LocalDataCollection.start());
    case 'LocalDataCollection.saveCacheData':
      sendResponse({});
      return LocalDataCollection.saveCacheData();
    case 'LocalDataCollection.easyPrivacyURL':
      return processMessageResponse(sendResponse, LocalDataCollection.easyPrivacyURL);
    case 'LocalDataCollection.EXT_STATS_KEY':
      return processMessageResponse(sendResponse, LocalDataCollection.EXT_STATS_KEY);
    case 'ExcludeFilter.setExcludeFilters':
      ExcludeFilter.setExcludeFilters(message.filters);
      sendResponse({});
      break;
    default:
  }
});
