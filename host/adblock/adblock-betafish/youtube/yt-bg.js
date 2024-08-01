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
/* global browser, addCustomFilter, getUserFilters, isWhitelistFilter */

import * as ewe from "@eyeo/webext-ad-filtering-solution";
import { settings, getSettings } from "~/prefs/background/settings";

const ytChannelNamePages = new Map();

const webRequestFilter = {
  url: [{ hostEquals: "www.youtube.com" }],
};

let lastInjectedTimestamp = 10000;

// Creates a custom filter entry that whitelists a YouTube channel
// Inputs: channelName:string parsed channel name
// Returns:  null if successful, otherwise an exception
const createAllowlistFilterForYoutubeChannelName = function (channelName, origin) {
  if (channelName) {
    const filterText = `@@||www.youtube.com/*${channelName}|$document`;
    return addCustomFilter(filterText, origin);
  }
  return undefined;
};

// Creates a custom filter entry that whitelists a YouTube channel
// Inputs: url:string url of the page
// Returns: null if successful, otherwise an exception
const createWhitelistFilterForYoutubeChannel = function (url, origin) {
  let ytChannel;
  if (/ab_channel=/.test(url)) {
    [, ytChannel] = url.match(/ab_channel=([^]*)/);
  } else {
    ytChannel = url.split("/").pop();
  }
  if (ytChannel) {
    return createAllowlistFilterForYoutubeChannelName(ytChannel, origin);
  }
  return undefined;
};

const removeAllowlistFilterForYoutubeChannel = function (text) {
  if (isWhitelistFilter(text)) {
    ewe.filters.remove([text]);
  }
};

const injectScript = async function (scriptFileName, tabId) {
  try {
    if (browser.scripting) {
      return browser.scripting.executeScript({
        target: { tabId, allFrames: false },
        files: [scriptFileName],
      });
    }
    return browser.tabs.executeScript(tabId, {
      file: scriptFileName,
      allFrames: false,
      runAt: "document_start",
    });
  } catch (error) {
    /* eslint-disable-next-line no-console */
    console.error(error);
    return null;
  }
};

// inject the manage YT subscription
const injectManagedContentScript = async function (details, historyUpdated) {
  const { tabId } = details;
  const pingResponse = await browser.tabs.sendMessage(tabId, { command: "ping_yt_manage_cs" });
  // Since the onHistoryStateUpdated may get called more than once with the exact same data,
  // check the timestamps, and only inject the content script once
  const diff = details.timeStamp - lastInjectedTimestamp;
  if (pingResponse && pingResponse.status === "yes") {
    lastInjectedTimestamp = details.timeStamp;
    void browser.tabs.sendMessage(tabId, { command: "addYouTubeOnPageIcons", historyUpdated });
  } else if (diff > 100) {
    // check if the timestamp difference is more than 100 ms
    lastInjectedTimestamp = details.timeStamp;
    await injectScript("purify.min.js", tabId);
    await injectScript("adblock-yt-manage-cs.js", tabId);
    void browser.tabs.sendMessage(tabId, { command: "addYouTubeOnPageIcons", historyUpdated });
  }
};

const managedSubPageCompleted = async (details) => {
  await settings.onload();

  if (!getSettings().youtube_channel_whitelist || !getSettings().youtube_manage_subscribed) {
    browser.webNavigation.onCompleted.removeListener(managedSubPageCompleted, webRequestFilter);
    return;
  }

  const theURL = new URL(details.url);
  if (theURL.pathname === "/feed/channels") {
    void injectManagedContentScript(details);
  }
};

// On single page sites, such as YouTube, that update the URL using the History API pushState(),
// they don't actually load a new page, we need to get notified when this happens
// and trigger the injection of the manage subscription content script when the user
// navigates to the page via YT
const ytHistoryHandler = async (details) => {
  await settings.onload();

  if (!getSettings().youtube_channel_whitelist) {
    browser.webNavigation.onHistoryStateUpdated.removeListener(ytHistoryHandler, webRequestFilter);
    return;
  }

  if (
    details &&
    Object.prototype.hasOwnProperty.call(details, "tabId") &&
    Object.prototype.hasOwnProperty.call(details, "url") &&
    details.transitionType === "link"
  ) {
    const myURL = new URL(details.url);
    if (getSettings().youtube_manage_subscribed && myURL.pathname === "/feed/channels") {
      // check if the user clicked the back / forward buttons, if so,
      // the data on the page is already loaded,
      // so the content script does not have to wait for it to load.
      void injectManagedContentScript(
        details,
        !(details.transitionQualifiers && details.transitionQualifiers.includes("forward_back")),
      );
    }
  }
};

const addYTChannelListeners = function () {
  browser.webNavigation.onHistoryStateUpdated.addListener(ytHistoryHandler, webRequestFilter);
  browser.webNavigation.onCompleted.addListener(managedSubPageCompleted, webRequestFilter);
};

const removeYTChannelListeners = function () {
  browser.webNavigation.onHistoryStateUpdated.removeListener(ytHistoryHandler, webRequestFilter);
  browser.webNavigation.onCompleted.removeListener(managedSubPageCompleted, webRequestFilter);
};

const openYTManagedSubPage = function () {
  browser.tabs.create({ url: "https://www.youtube.com/feed/channels" });
};

const getAllAdsAllowedUserFilters = async function () {
  const userFilters = await getUserFilters();
  const adsAllowedUserFilters = [];
  for (let inx = 0; inx < userFilters.length; inx++) {
    const filter = userFilters[inx];
    if (isWhitelistFilter(filter.text) && filter.text && filter.text.includes("youtube.com")) {
      adsAllowedUserFilters.push(filter.text);
    }
  }
  return adsAllowedUserFilters;
};

const start = function () {
  addYTChannelListeners();
};

// Listen for the message from the content scripts
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.command === "updateYouTubeChannelName" && message.channelName) {
    ytChannelNamePages.set(sender.tab.id, message.channelName);
    sendResponse({});
    return;
  }
  if (message.command === "getAllAdsAllowedUserFilters") {
    /* eslint-disable consistent-return */
    return getAllAdsAllowedUserFilters();
  }
  if (message.command === "removeAllowlistFilterForYoutubeChannel" && message.text) {
    removeAllowlistFilterForYoutubeChannel(message.text);
    sendResponse({});
  }
  if (message.command === "createWhitelistFilterForYoutubeChannel" && message.url) {
    sendResponse(createWhitelistFilterForYoutubeChannel(message.url, message.origin));
  }
  if (message.command === "createAllowlistFilterForYoutubeChannelName" && message.channelName) {
    sendResponse(createAllowlistFilterForYoutubeChannelName(message.channelName, message.origin));
  }
  if (message.command === "blockAllSubscribedChannel" && message.channelNames) {
    setTimeout(async () => {
      const { channelNames } = message;
      const parsedChannelNames = [];
      const userFilters = await getAllAdsAllowedUserFilters();
      for (const [channelName] of Object.entries(channelNames)) {
        const name = channelNames[channelName].parsedChannelName;
        parsedChannelNames.push(name);
        for (let inx = 0; inx < userFilters.length; inx++) {
          const filterText = userFilters[inx];
          if (filterText.indexOf(name) > 1) {
            removeAllowlistFilterForYoutubeChannel(filterText);
          }
        }
      }
    }, 10);
    sendResponse({});
  }
  if (message.command === "allowAllSubscribedChannel" && message.channelNames) {
    const { channelNames } = message;
    for (const [channelName] of Object.entries(channelNames)) {
      const name = channelNames[channelName].parsedChannelName;
      createAllowlistFilterForYoutubeChannelName(name);
    }
    sendResponse({});
  }
});

// eslint-disable-next-line no-restricted-globals
Object.assign(self, {
  addYTChannelListeners,
  removeYTChannelListeners,
  ytChannelNamePages,
  openYTManagedSubPage,
});

start();
