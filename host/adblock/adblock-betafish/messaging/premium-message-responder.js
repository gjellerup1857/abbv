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
/* global browser, ext, isTrustedSender, openTab,
 */

import * as ewe from "@eyeo/webext-ad-filtering-solution";

import { port } from "../../adblockplusui/adblockpluschrome/lib/messaging/port";

import { License, replacedCounts, channels } from "../picreplacement/check";
import { channelsNotifier } from "../picreplacement/channels";
import SyncService from "../picreplacement/sync-service";

const gabHostnames = [
  "https://getadblock.com",
  "https://dev.getadblock.com",
  "https://dev1.getadblock.com",
  "https://dev2.getadblock.com",
  "https://getadblockpremium.com",
];
/**
 * Process events related to the Premium object - License, Channels, and Sync-Service
 *
 */
const uiPorts = new Map();
const messageTypes = new Map([
  ["license", "license.respond"],
  ["channels", "channels.respond"],
  ["sync", "sync.respond"],
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
    case "license":
      filters.set("license", newFilter);
      break;
    case "channels":
      filters.set("channels", newFilter);
      break;
    case "sync":
      filters.set("sync", newFilter);
      break;
    default:
    // do nothing
  }
}

function onConnect(uiPort) {
  if (!isTrustedSender(uiPort.sender)) {
    return;
  }

  if (uiPort.name !== "premium") {
    return;
  }

  const filters = new Map();
  uiPorts.set(uiPort, filters);

  uiPort.onDisconnect.addListener(() => {
    uiPorts.delete(uiPort);
  });

  uiPort.onMessage.addListener((message) => {
    const [type, action] = message.type.split(".", 2);
    if (action === "listen") {
      listen(
        type,
        filters,
        message.filter,
        message,
        uiPort.sender && uiPort.sender.tab && uiPort.sender.tab.id,
      );
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
      await browser.tabs.executeScript(tabId, {
        file: scriptFileName,
        frameId,
        runAt: "document_start",
      });
    }
  } catch (error) {
    /* eslint-disable-next-line no-console */
    console.error(error);
  }
};

/**
 * Return an a clone of some the methods of the License object
 * to be used as a proxy on the Options page
 *
 * @returns a clone of the License object
 */
function getPremiumAssociatedObject() {
  return {
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
}

/**
 * Return a boolean to indicate the License state
 *
 * @returns a Promise containing a boolean to indicate License state
 */
const processIsActiveLicense = async () => {
  await License.ready();
  return License.isActiveLicense();
};

/**
 * Return a Promise containing a clone of some the methods and data of the License object
 *
 * @returns a Promise containing a clone of some the methods and data of the License object
 */
const processLicenseConfig = async () => {
  try {
    await License.ready();
    const response = getPremiumAssociatedObject();
    Object.assign(response, License.get());
    return response;
  } catch (e) {
    /* eslint-disable-next-line no-console */
    console.error("error occurred during adblock:getLicenseConfig message handling");
    /* eslint-disable-next-line no-console */
    console.error(e);
  }
  return {};
};

/**
 * Process the 'load_my_adblock' messages when the user is subscribed to
 * the Distraction Control filter list
 */
port.on("adblock:load_my_adblock", async (message, sender) => {
  await License.ready();
  if (
    License.isActiveLicense() &&
    sender.page &&
    sender.page.url &&
    sender.page.url.href &&
    sender.page.url.href.startsWith("http") &&
    ((await ewe.subscriptions.has("https://cdn.adblockcdn.com/filters/distraction-control.txt")) ||
      (await ewe.subscriptions.has(
        "https://easylist-downloads.adblockplus.org/v3/full/adblock_premium.txt",
      ))) &&
    !(await ewe.filters.getAllowingFilters(sender.page.id)).length
  ) {
    void injectScript(
      "adblock-picreplacement-push-notification-wrapper-cs.js",
      sender.page.id,
      sender.frame.id,
    );
  }
  return {};
});
ext.addTrustedMessageTypes(null, ["adblock:load_my_adblock"]);

/**
 * Process general messages related to the 'License' object,
 * which require sender validation. (These may come from extension pages,
 * where the sender URL starts with the extension URL)
 *
 */
port.on("adblock:activate", async () => {
  await License.ready();
  License.activate();
});
port.on("adblock:cleanUpSevenDayAlarm", async () => {
  await License.ready();
  License.cleanUpSevenDayAlarm();
  return {};
});
port.on("adblock:getLicenseConfig", () => processLicenseConfig());
port.on("adblock:updatePeriodically", async () => {
  await License.ready();
  License.updatePeriodically();
  return {};
});

/**
 * Process messages related to the 'License' object
 * which require domain validation
 * the messages come from content scripts on the getadblock.com domain
 *
 */
port.on("adblock:isActiveLicense", () => processIsActiveLicense());
port.on("adblock:payment_success", async () => {
  await License.ready();
  try {
    License.activate();
    return { ack: true };
  } catch (e) {
    /* eslint-disable-next-line no-console */
    console.error("error occurred during payment_success message handling");
    /* eslint-disable-next-line no-console */
    console.error(e);
    return { ack: false };
  }
});
for (const hostname of gabHostnames) {
  ext.addTrustedMessageTypes(hostname, ["adblock:isActiveLicense", "adblock:payment_success"]);
}

/**
 * Process the 'safe' messages related to the 'License' object
 * which do not require sender validation (they typically come from content scripts)
 *
 */
port.on("adblock:openPremiumPayURL", async () => {
  await License.ready();
  openTab(License.MAB_CONFIG.payURL);
  return {};
});
port.on("adblock:setBlacklistCTAStatus", async (message) => {
  await License.ready();
  License.shouldShowBlacklistCTA(message.isEnabled);
  return {};
});
port.on("adblock:setWhitelistCTAStatus", async (message) => {
  await License.ready();
  License.shouldShowWhitelistCTA(message.isEnabled);
  return {};
});
ext.addTrustedMessageTypes(null, [
  "adblock:openPremiumPayURL",
  "adblock:setBlacklistCTAStatus",
  "adblock:setWhitelistCTAStatus",
]);

/**
 * Process the messages related to Channels object
 *
 */
port.on("adblock:channels.disableAllChannels", () => channels.disableAllChannels());
port.on("adblock:channels.getGuide", () => channels.getGuide());
port.on("adblock:channels.getIdByName", (message) => channels.getIdByName(message.name));
port.on("adblock:channels.initializeListeners", () => channels.initializeListeners());
port.on("adblock:channels.isAnyEnabled", () => channels.isAnyEnabled());
port.on("adblock:channels.isCustomChannelEnabled", () => channels.isCustomChannelEnabled());
port.on("adblock:channels.setEnabled", (message) =>
  channels.setEnabled(message.channelId, message.enabled),
);

/**
 * Return a Promise containing an object
 * - to indicate that Image Swap is disable on the page
 * - the Image Swap meta data
 *
 * @returns a Promise containing a boolean to indicate License state
 */
const processGetRandomlisting = async function (message, sender) {
  try {
    if ((await ewe.filters.getAllowingFilters(sender.page.id)).length) {
      return { disabledOnPage: true };
    }
    await License.ready();
    if (!License.isActiveLicense()) {
      return { disabledOnPage: true };
    }
    const result = channels.randomListing(message.opts);
    if (result) {
      return result;
    }
    return { disabledOnPage: true };
  } catch (e) {
    /* eslint-disable-next-line no-console */
    console.error("error occurred during getrandomlisting message handling");
    /* eslint-disable-next-line no-console */
    console.error(e);
    return { disabledOnPage: true };
  }
};

/**
 * Process the `getrandomlisting` &
 * 'channels.recordOneAdReplaced' message from the Image Swap content script
 *
 */
port.on("adblock:channels.getrandomlisting", (message, sender) =>
  processGetRandomlisting(message, sender),
);
port.on("adblock:channels.recordOneAdReplaced", async (message, sender) => {
  await License.ready();
  if (License.isActiveLicense()) {
    replacedCounts.recordOneAdReplaced(sender.page.id);
  }
});
ext.addTrustedMessageTypes(null, [
  "adblock:channels.getrandomlisting",
  "adblock:channels.recordOneAdReplaced",
]);

/**
 * Process the messages related to Custom channel object
 *
 */
port.on("adblock:customchannel.isMaximumAllowedImages", () => {
  const customChannelId = channels.getIdByName("CustomChannel");
  const customChannel = channels.channelGuide[customChannelId].channel;
  return customChannel.isMaximumAllowedImages();
});
port.on("adblock:customchannel.getListings", () => {
  const customChannelId = channels.getIdByName("CustomChannel");
  const customChannel = channels.channelGuide[customChannelId].channel;
  return customChannel.getListings();
});
port.on("adblock:customchannel.addCustomImage", (message) => {
  const customChannelId = channels.getIdByName("CustomChannel");
  const customChannel = channels.channelGuide[customChannelId].channel;
  return customChannel.addCustomImage(message.imageInfo);
});
port.on("adblock:customchannel.removeListingByURL", (message) => {
  const customChannelId = channels.getIdByName("CustomChannel");
  const customChannel = channels.channelGuide[customChannelId].channel;
  return customChannel.removeListingByURL(message.url);
});

/**
 * Process the messages related to Sync Service object
 *
 */
port.on("adblock:resetLastGetErrorResponse", () => {
  SyncService.resetLastGetErrorResponse();
  return {};
});
port.on("adblock:resetLastGetStatusCode", () => {
  SyncService.resetLastGetStatusCode();
  return {};
});
port.on("adblock:resetLastPostStatusCode", () => {
  SyncService.resetLastPostStatusCode();
  return {};
});
port.on("adblock:SyncService.disableSync", (message) => {
  SyncService.disableSync(message.removeName);
  return {};
});
port.on("adblock:SyncService.enableSync", (message) => {
  SyncService.enableSync(message.initialGet);
  return {};
});
port.on("adblock:SyncService.getAllExtensionNames", () => SyncService.getAllExtensionNames());
port.on("adblock:SyncService.getCurrentExtensionName", () => SyncService.getCurrentExtensionName());
port.on("adblock:SyncService.getLastPostStatusCode", () => SyncService.getLastPostStatusCode());
port.on("adblock:SyncService.getLastGetStatusCode", () => SyncService.getLastGetStatusCode());
port.on("adblock:SyncService.processUserSyncRequest", () => {
  SyncService.processUserSyncRequest();
  return {};
});
port.on("adblock:SyncService.removeExtensionName", (message) => {
  SyncService.removeExtensionName(message.dataDeviceName, message.dataExtensionGUID);
  return {};
});
port.on("adblock:SyncService.resetAllErrors", () => {
  SyncService.resetAllSyncErrors();
  return {};
});
port.on("adblock:SyncService.setCurrentExtensionName", (message) => {
  SyncService.setCurrentExtensionName(message.name);
  return {};
});

/**
 * Add the listener related to the Channels notifier
 */
function addChannelsNotifierListeners() {
  channelsNotifier.on("channels.changed", getListener("channels", "changed"));
}

/**
 * Add the listener related to the License notifier
 */
function addLicenseNotifierListeners() {
  License.ready().then(() => {
    License.licenseNotifier.on("license.updating", getListener("license", "updating"));
    License.licenseNotifier.on("license.updated", getListener("license", "updated"));
    License.licenseNotifier.on("license.updated.error", getListener("license", "updated.error"));
    License.licenseNotifier.on("license.expired", getListener("license", "expired"));
  });
}

/**
 * Add the listener related to the Sync Service notifier
 */
function addSyncNotifierListeners() {
  SyncService.syncNotifier.on("sync.data.receieved", getListener("sync", "sync.data.receieved"));
  SyncService.syncNotifier.on("sync.data.getting", getListener("sync", "sync.data.getting"));
  SyncService.syncNotifier.on(
    "sync.data.error.initial.fail",
    getListener("sync", "sync.data.error.initial.fail"),
  );
  SyncService.syncNotifier.on(
    "sync.data.getting.error",
    getListener("sync", "sync.data.getting.error"),
  );
  SyncService.syncNotifier.on(
    "extension.names.downloading",
    getListener("sync", "extension.names.downloading"),
  );
  SyncService.syncNotifier.on(
    "extension.names.downloaded",
    getListener("sync", "extension.names.downloaded"),
  );
  SyncService.syncNotifier.on(
    "extension.names.downloading.error",
    getListener("sync", "extension.names.ownloading.error"),
  );
  SyncService.syncNotifier.on(
    "extension.name.updating",
    getListener("sync", "extension.name.updating"),
  );
  SyncService.syncNotifier.on(
    "extension.name.updated",
    getListener("sync", "extension.name.updated"),
  );
  SyncService.syncNotifier.on(
    "extension.name.updated.error",
    getListener("sync", "extension.name.updated.error"),
  );
  SyncService.syncNotifier.on(
    "extension.name.remove",
    getListener("sync", "extension.name.remove"),
  );
  SyncService.syncNotifier.on(
    "extension.name.removed",
    getListener("sync", "extension.name.removed"),
  );
  SyncService.syncNotifier.on(
    "extension.name.remove.error",
    getListener("sync", "extension.name.remove.error"),
  );
  SyncService.syncNotifier.on("post.data.sending", getListener("sync", "post.data.sending"));
  SyncService.syncNotifier.on("post.data.sent", getListener("sync", "post.data.sent"));
  SyncService.syncNotifier.on("post.data.sent.error", getListener("sync", "post.data.sent.error"));
}

function start() {
  addChannelsNotifierListeners();
  addLicenseNotifierListeners();
  addSyncNotifierListeners();
}

start();
