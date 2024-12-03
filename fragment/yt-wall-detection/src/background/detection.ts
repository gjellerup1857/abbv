/**
 * This file is part of eyeo's YouTube ad wall detection fragment,
 * Copyright (C) 2024-present eyeo GmbH

 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.

 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.

 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import type Browser from "webextension-polyfill";
import * as browser from "webextension-polyfill";

import { type MessageSender, type AdWallMessage } from "@eyeo/polyfills/all";
import {
  noop,
  type StartInfo,
  ytAllowlistStartDate,
} from "./detection.types.js";

import {
  youTubeAlreadyAllowLlisted,
  youTubeAutoAllowlisted,
  youTubeWallDetected,
  youTubeNavigation,
} from "../shared/index.js";

/**
 * capture the allowlist YT start date (the update or install date)
 *
 */
const captureStartDate = function (parameters: StartInfo): void {
  if (parameters.prefs.get(ytAllowlistStartDate) === 0) {
    parameters.prefs.set(ytAllowlistStartDate, Date.now());
    /* eslint-disable @typescript-eslint/no-unsafe-argument */
    parameters.logger.debug(
      "[yt-detection]: set start date",
      new Date(parameters.prefs.get(ytAllowlistStartDate)).toLocaleDateString(),
    );
  }
};

/**
 * Capture the allowlist YT start date (the update or install date)
 *
 */
const captureDateOnUpdate = (
  parameters: StartInfo,
  details: Browser.Runtime.OnInstalledDetailsType,
): void => {
  if (details.reason === "update" || details.reason === "install") {
    captureStartDate(parameters);
  }
};

/**
 * Process the YouTube Wall Detected message from the content script
 *
 */
const processYouTubeWallMessage = async (
  parameters: StartInfo,
  message: AdWallMessage,
  sender: MessageSender,
): Promise<void> => {
  const tabId = sender.tab?.id ?? sender.page?.id;
  const tabURL = sender.tab?.url ?? sender.page?.url;
  if (typeof tabId === "undefined" || typeof tabURL === "undefined") {
    return;
  }
  const { sendAdWallEvents = noop } = parameters;

  const filters = await parameters.ewe.filters.getAllowingFilters(tabId);
  const isAllowListed = !!filters.length;
  if (isAllowListed) {
    sendAdWallEvents(
      youTubeAlreadyAllowLlisted,
      message.userLoggedIn ? "1" : "0",
      "1",
    );
    return;
  }
  sendAdWallEvents(youTubeWallDetected, message.userLoggedIn ? "1" : "0", "0");

  const senderURL = new URL(tabURL);
  const ruleText = `@@||${senderURL.hostname}$document`;
  const metadata = {
    expiresByTabId: tabId,
    origin: "auto",
  };
  await parameters.ewe.filters.add(ruleText, metadata);
  if (message.currentPlaybackTime > 5) {
    senderURL.searchParams.set(
      "t",
      Math.floor(message.currentPlaybackTime).toString(),
    );
    senderURL.searchParams.delete("ab_channel");
    await browser.tabs.update(tabId, { url: senderURL.href });
  } else {
    await browser.tabs.reload(tabId);
  }
  sendAdWallEvents(youTubeAutoAllowlisted);
};

/**
 * Initializes YouTube telemetry
 */
export function start(parameters: StartInfo): void {
  /**
   * The following StartInfo properties are passed into the start function
   * as a temporary solution because core utillities for those objects are missing.
   * Once a core utility for these objects are created, it is expected that they would
   * no longer need to be passed in but imported.
   */
  const { sendAdWallEvents = noop } = parameters;
  // Capture the start date for the YT auto allowlist logic
  const captureDateOnUpdatedWithParameters = captureDateOnUpdate.bind(
    null,
    parameters,
  );
  browser.runtime.onInstalled.addListener(captureDateOnUpdatedWithParameters);

  const processYouTubeWallMessageWithParameters =
    processYouTubeWallMessage.bind(null, parameters);
  parameters.port.on(
    youTubeWallDetected,
    processYouTubeWallMessageWithParameters,
  );
  parameters.port.on(youTubeNavigation, (message: AdWallMessage): void => {
    sendAdWallEvents(youTubeNavigation, message.userLoggedIn ? "1" : "0");
  });

  parameters.addTrustedMessageTypes("https://youtube.com", [
    youTubeWallDetected,
    youTubeNavigation,
  ]);
  parameters.addTrustedMessageTypes("https://www.youtube.com", [
    youTubeWallDetected,
    youTubeNavigation,
  ]);
}
