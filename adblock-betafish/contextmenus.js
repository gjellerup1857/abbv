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
/* global browser, ext, adblockIsPaused, adblockIsDomainPaused
   log, License, reloadTab, getSettings */

import { Prefs } from 'prefs';
import * as ewe from '../vendor/webext-sdk/dist/ewe-api';
import { setBadge } from '../vendor/adblockplusui/adblockpluschrome/lib/browserAction';
import ServerMessages from './servermessages';

const updateButtonUIAndContextMenus = function () {
  browser.tabs.query({}).then((tabs) => {
    for (const tab of tabs) {
      tab.url = tab.url ? tab.url : tab.pendingUrl;
      if (adblockIsPaused() || adblockIsDomainPaused({ url: tab.url.href, id: tab.id })) {
        setBadge(tab.id, { number: '' });
      }
      const page = new ext.Page(tab);
      // eslint-disable-next-line no-use-before-define
      updateContextMenuItems(page);
    }
  });
};
browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.command === 'updateButtonUIAndContextMenus') {
    updateButtonUIAndContextMenus();
    sendResponse({});
  }
});

// Bounce messages back to content scripts.
const emitPageBroadcast = (function emitBroadcast() {
  const injectMap = {
    topOpenWhitelistUI:
      {
        allFrames: false,
        include: [
          'jquery-3.5.1.min.js',
          'adblock-uiscripts-load_wizard_resources.js',
          'adblock-uiscripts-top_open_whitelist_ui.js',
        ],
      },
    topOpenWhitelistCompletionUI:
      {
        allFrames: false,
        include: [
          'jquery-3.5.1.min.js',
          'adblock-uiscripts-load_wizard_resources.js',
          'adblock-uiscripts-top_open_whitelist_completion_ui.js',
        ],
      },
    topOpenBlacklistUI:
      {
        allFrames: false,
        include: [
          'jquery-3.5.1.min.js',
          'purify.min.js',
          'adblock-uiscripts-load_wizard_resources.js',
          'adblock-uiscripts-blacklisting-overlay.js',
          'adblock-uiscripts-blacklisting-clickwatcher.js',
          'adblock-uiscripts-blacklisting-elementchain.js',
          'adblock-uiscripts-blacklisting-blacklistui.js',
          'adblock-uiscripts-top_open_blacklist_ui.js',
        ],
      },
    sendContentToBack:
      {
        allFrames: true,
        include: ['adblock-uiscripts-send_content_to_back.js'],
      },
  };

  // Inject the required scripts to execute fnName(parameter) in
  // the given tab.
  // Inputs: fnName:string name of function to execute on tab.
  //         fnName must exist in injectMap above.
  //         parameter:object to pass to fnName.  Must be JSON.stringify()able.
  //         alreadyInjected?:int used to recursively inject required scripts.
  //         tabID:int representing the ID of the tab to execute in.
  //         tabID defaults to the active tab
  const executeOnTab = function (fnName, parameter, alreadyInjected, tabID) {
    const injectedSoFar = alreadyInjected || 0;
    const data = injectMap[fnName];
    const details = { allFrames: data.allFrames };

    // If there's anything to inject, inject the next item and recurse.
    if (data.include.length > injectedSoFar) {
      details.file = data.include[injectedSoFar];
      browser.tabs.executeScript(tabID, details).then(() => {
        executeOnTab(fnName, parameter, injectedSoFar + 1, tabID);
      }).catch((error) => {
        log(error);
      });
    } else {
      // Nothing left to inject, so execute the function.
      const param = JSON.stringify(parameter);
      details.code = `${fnName}(${param});`;
      browser.tabs.executeScript(tabID, details);
    }
  };

  // The emitPageBroadcast() function
  const theFunction = function (request) {
    executeOnTab(request.fn, request.options, 0, request.tabID);
  };

  return theFunction;
}());

const contextMenuItem = (() => ({
  pauseAll:
    {
      title: browser.i18n.getMessage('pause_adblock_everywhere'),
      contexts: ['all'],
      onclick: () => {
        ServerMessages.recordGeneralMessage('cm_pause_clicked');
        adblockIsPaused(true);
        updateButtonUIAndContextMenus();
      },
    },
  unpauseAll:
    {
      title: browser.i18n.getMessage('resume_blocking_ads'),
      contexts: ['all'],
      onclick: () => {
        ServerMessages.recordGeneralMessage('cm_unpause_clicked');
        adblockIsPaused(false);
        updateButtonUIAndContextMenus();
      },
    },
  pauseDomain:
    {
      title: browser.i18n.getMessage('domain_pause_adblock'),
      contexts: ['all'],
      onclick: (info, tab) => {
        ServerMessages.recordGeneralMessage('cm_domain_pause_clicked');
        adblockIsDomainPaused({ url: tab.url, id: tab.id }, true);
        updateButtonUIAndContextMenus();
      },
    },
  unpauseDomain:
    {
      title: browser.i18n.getMessage('resume_blocking_ads'),
      contexts: ['all'],
      onclick: (info, tab) => {
        ServerMessages.recordGeneralMessage('cm_domain_unpause_clicked');
        adblockIsDomainPaused({ url: tab.url, id: tab.id }, false);
        updateButtonUIAndContextMenus();
      },
    },
  blockThisAd:
    {
      title: browser.i18n.getMessage('block_this_ad'),
      contexts: ['all'],
      onclick(info, tab) {
        window.addCustomFilterRandomName = `ab-${Math.random().toString(36).substr(2)}`;
        emitPageBroadcast({
          fn: 'topOpenBlacklistUI',
          options: {
            info,
            showBlacklistCTA: License.shouldShowBlacklistCTA(),
            isActiveLicense: License.isActiveLicense(),
            settings: getSettings(),
            addCustomFilterRandomName: window.addCustomFilterRandomName,
          },
        }, {
          tab,
        });
      },
    },
  blockAnAd:
    {
      title: browser.i18n.getMessage('block_an_ad_on_this_page'),
      contexts: ['all'],
      onclick(info, tab) {
        window.addCustomFilterRandomName = `ab-${Math.random().toString(36).substr(2)}`;
        emitPageBroadcast({
          fn: 'topOpenBlacklistUI',
          options: {
            nothingClicked: true,
            showBlacklistCTA: License.shouldShowBlacklistCTA(),
            isActiveLicense: License.isActiveLicense(),
            settings: getSettings(),
            addCustomFilterRandomName: window.addCustomFilterRandomName,
          },
        }, {
          tab,
        });
      },
    },
}))();

let updateContextMenuItems = function (page) {
  // Remove the AdBlock context menu items
  browser.contextMenus.removeAll();

  // Check if the context menu items should be added
  if (!Prefs.shouldShowBlockElementMenu) {
    return;
  }

  const adblockIsPaused = window.adblockIsPaused();
  const domainIsPaused = window.adblockIsDomainPaused({ url: page.url.href, id: page.id });
  if (adblockIsPaused) {
    browser.contextMenus.create(contextMenuItem.unpauseAll);
  } else if (domainIsPaused) {
    browser.contextMenus.create(contextMenuItem.unpauseDomain);
  } else if (ewe.filters.getAllowingFilters(page.id).length) {
    browser.contextMenus.create(contextMenuItem.pauseAll);
  } else {
    browser.contextMenus.create(contextMenuItem.blockThisAd);
    browser.contextMenus.create(contextMenuItem.blockAnAd);
    browser.contextMenus.create(contextMenuItem.pauseDomain);
    browser.contextMenus.create(contextMenuItem.pauseAll);
  }
};

const updateContextMenuItemsNoOp = function () {
  // Remove the AdBlock context menu items
  browser.contextMenus.removeAll();
};
// startup test to check if the context menu API functions correctly
// the `create` function is invoked twice, because it's the second
// and all subsequent calls that fail.
try {
  browser.contextMenus.create(contextMenuItem.blockThisAd);
  browser.contextMenus.create(contextMenuItem.blockThisAd);
} catch (e) {
  updateContextMenuItems = updateContextMenuItemsNoOp;
}
browser.contextMenus.removeAll();

browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status) {
    updateContextMenuItems(new ext.Page(tab));
  }
});

browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.command !== 'sendContentToBack') {
    return;
  } // not for us
  emitPageBroadcast({ fn: 'sendContentToBack', options: {} });
  sendResponse({});
});

browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.command === 'reloadTabForWhitelist') {
    reloadTab(sender.tab.id, () => {
      emitPageBroadcast({
        fn: 'topOpenWhitelistCompletionUI',
        options: {
          rule: request.rule,
          isActiveLicense: License.isActiveLicense(),
          showWhitelistCTA: License.shouldShowWhitelistCTA(),
        },
        tabID: sender.tab.id,
      });
    });
    sendResponse({});
  }
});

browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.command === 'showWhitelistCompletion') {
    emitPageBroadcast({
      fn: 'topOpenWhitelistCompletionUI',
      options: {
        rule: request.rule,
        isActiveLicense: License.isActiveLicense(),
        showWhitelistCTA: License.shouldShowWhitelistCTA(),
      },
      tabID: sender.tab.id,
    });
    sendResponse({});
  }
});

browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.command === 'showBlacklist' && typeof request.nothingClicked === 'boolean') {
    window.addCustomFilterRandomName = `ab-${Math.random().toString(36).substr(2)}`;
    emitPageBroadcast({
      fn: 'topOpenBlacklistUI',
      options: {
        nothingClicked: request.nothingClicked,
        isActiveLicense: License.isActiveLicense(),
        showBlacklistCTA: License.shouldShowBlacklistCTA(),
        settings: getSettings(),
        addCustomFilterRandomName: window.addCustomFilterRandomName,
      },
      tabID: request.tabId,
    });
    sendResponse({});
  }
});

browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.command === 'showWhitelist') {
    window.addCustomFilterRandomName = `ab-${Math.random().toString(36).substr(2)}`;
    emitPageBroadcast({
      fn: 'topOpenWhitelistUI',
      options: {
        addCustomFilterRandomName: window.addCustomFilterRandomName,
      },
      tabID: request.tabId,
    });
    sendResponse({});
  }
});

// Update browser actions and context menus when whitelisting might have
// changed. That is now when initally loading the filters and later when
// importing backups or saving filter changes.
// Update browser actions and context menus when whitelisting might have
// changed. That is now when initally loading the filters and later when
// importing backups or saving filter changes.
ewe.subscriptions.onAdded.addListener(updateButtonUIAndContextMenus);
ewe.subscriptions.onChanged.addListener(updateButtonUIAndContextMenus);
ewe.subscriptions.onRemoved.addListener(updateButtonUIAndContextMenus);

Prefs.on(Prefs.shouldShowBlockElementMenu, () => {
  updateButtonUIAndContextMenus();
});

updateButtonUIAndContextMenus();

Object.assign(window, {
  emitPageBroadcast,
  updateButtonUIAndContextMenus,
});
