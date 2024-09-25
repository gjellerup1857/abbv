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

import type Browser from "webextension-polyfill";
import * as browser from "webextension-polyfill";
import * as ewe from "@eyeo/webext-ad-filtering-solution";

import { adblockIsDomainPaused } from "~/pause/background";
import { AdWallMessage } from "~/polyfills/shared";
import { ytAllowlistStartDate } from "./detection.types";
import * as logger from "~/utilities/background";
import { MessageSender } from "~/polyfills/background";
import { port } from "../../../adblockplusui/adblockpluschrome/lib/messaging/port";
import { Prefs } from "~/alias/prefs";
import ServerMessages from "~/servermessages";
import { youTubeAutoAllowlisted, youTubeWallDetected, youTubeNavigation } from "../shared/index";

/**
 * capture the allowlist YT start date (the update or install date)
 *
 */
const captureStartDate = function (): void {
  if (Prefs.get(ytAllowlistStartDate) === 0) {
    Prefs.set(ytAllowlistStartDate, Date.now());
    logger.debug(
      "[yt-detection]: set start date",
      new Date(Prefs.get(ytAllowlistStartDate)).toLocaleDateString(),
    );
  }
};

/**
 * capture the allowlist YT start date (the update or install date)
 *
 */
const captureDateOnUpdate = (details: Browser.Runtime.OnInstalledDetailsType): void => {
  if (details.reason === "update" || details.reason === "install") {
    captureStartDate();
  }
};

/**
 * Process the YouTube Wall Detected message from the content script
 *
 */
const processYouTubeWallDetectedMessage = async (
  message: AdWallMessage,
  sender: MessageSender,
): Promise<void> => {
  if (typeof sender.page?.id === "undefined") {
    return;
  }
  const filters = await ewe.filters.getAllowingFilters(sender.page.id);
  const isAllowListed = !!filters.length;
  ServerMessages.recordAdWallMessage(
    youTubeWallDetected,
    message.userLoggedIn ? "1" : "0",
    isAllowListed ? "1" : "0",
  );
  if (sender && sender.page) {
    adblockIsDomainPaused({ url: sender.page.url, id: sender.page.id }, true, true, "auto");
    browser.tabs.reload(sender.page.id);
    ServerMessages.recordAdWallMessage(youTubeAutoAllowlisted);
    browser.tabs.reload(sender.page.id);
    return;
  }
};

/**
 * Initializes YouTube telemetry
 */
function start(): void {
  // Capture the start date for the YT auto allowlist logic
  browser.runtime.onInstalled.addListener(captureDateOnUpdate);

  port.on(youTubeWallDetected, processYouTubeWallDetectedMessage);
  port.on(youTubeNavigation, (message: AdWallMessage): void => {
    ServerMessages.recordAdWallMessage(youTubeNavigation, message.userLoggedIn ? "1" : "0");
  });

  ext.addTrustedMessageTypes("https://youtube.com", [youTubeWallDetected, youTubeNavigation]);
  ext.addTrustedMessageTypes("https://www.youtube.com", [youTubeWallDetected, youTubeNavigation]);
}

start();
