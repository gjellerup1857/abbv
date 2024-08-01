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
import {
  sevenDaysInMilliSeconds,
  ytAllowlistHardEndDate,
  ytAllowlistLanguageCodes,
  ytAllowlistStartDate,
} from "./detection.types";
import { determineUserLanguage } from "~/utilities/background/bg-functions";
import * as logger from "~/utilities/background";
import { MessageSender } from "~/polyfills/background";
import { port } from "../../../adblockplusui/adblockpluschrome/lib/messaging/port";
import { Prefs } from "~/alias/prefs";
import ServerMessages from "~/servermessages";
import { youTubeAutoAllowlisted, youTubeWallDetected, youTubeNavigation } from "../shared/index";

/**
 * Should the extension allowlist YT users in a specific locale/language
 *
 */
const shouldAllowlistForLanguages = function (): Boolean {
  const allowlistLanguages = Prefs.get(ytAllowlistLanguageCodes);
  const locale = determineUserLanguage();
  const language = locale.substring(0, 2);
  return allowlistLanguages.includes(language);
};

/**
 * Should the extension allowlist YT users today?
 *
 */
const shouldAllowListForToday = function (): Boolean {
  if (Prefs.get(ytAllowlistStartDate)) {
    const today = new Date();
    logger.debug("[yt-detection]: today", today.toLocaleDateString());
    const startDate = new Date(Prefs.get(ytAllowlistStartDate));
    logger.debug("[yt-detection]: YT allowlist start date", startDate.toLocaleDateString());
    const endDate = new Date();
    endDate.setTime(startDate.getTime() + sevenDaysInMilliSeconds); // Add 7 days to the start date, to determine the end date
    logger.debug("[yt-detection]: end date (start date + 7)", endDate.toLocaleDateString());
    const hardEndDate = new Date(Prefs.get(ytAllowlistHardEndDate));
    logger.debug("[yt-detection]: Prefs hard end date", hardEndDate.toLocaleDateString());
    return today > startDate && today < endDate && today < hardEndDate;
  }
  return false;
};

/**
 * Should the extension allowlist for this locale and date.
 *
 */
const shouldAllowList = function (): Boolean {
  return shouldAllowlistForLanguages() && shouldAllowListForToday();
};

/**
 * capture the allowlist YT start date (the update or install date)
 *
 */
const captureStartDate = function (): void {
  if (!shouldAllowlistForLanguages()) {
    logger.debug("[yt-detection]: user language not a match");
    return;
  }
  const today = new Date();
  const hardEndDate = new Date(Prefs.get(ytAllowlistHardEndDate));
  if (today >= hardEndDate) {
    Prefs.reset(ytAllowlistStartDate);
    logger.debug("[yt-detection]: expiration date exceeded");
    return;
  }
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
  const filters = await ewe.filters.getAllowingFilters(sender.page.id);
  const isAllowListed = !!filters.length;
  ServerMessages.recordAdWallMessage(
    youTubeWallDetected,
    message.userLoggedIn ? "1" : "0",
    isAllowListed ? "1" : "0",
  );
  if (sender && sender.page && shouldAllowList()) {
    adblockIsDomainPaused({ url: sender.page.url, id: sender.page.id }, true);
    browser.tabs.reload(sender.page.id);
    ServerMessages.recordAdWallMessage(youTubeAutoAllowlisted);
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
