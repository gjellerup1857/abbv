/**
 * This file is part of eyeo's Public API fragment,
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

import browser from "webextension-polyfill";
import {
  allowlistingResponseEvent,
  allowlistingTriggerEvent,
  apiFrameUrl,
} from "../shared/constants.js";
import { injectScriptInFrame } from "../shared/helpers.js";
import { webpageAPI } from "../content/webpage-api.js";

/**
 * Handles the allowlisting of a website
 *
 * @param allowlistingOption The allowlisting options sent from the content script.
 * @param sender The sender object
 * @returns {Promise<{object}>} The result of the allowlisting command
 */
async function handleAllowlisting({allowlistingOption, sender}) {
  // TODO: add implementation
  const manifest = await browser.runtime.getManifest();
  const responses = [
    {
      name: manifest.short_name,
      success: true,
    },
    {
      name: manifest.short_name,
      success: false,
      reason: "Failed in the background script",
    }
  ];

  // Randomly pick one of the two responses
  const randomIndex = Math.floor(Math.random() * responses.length);
  return responses[randomIndex];
}

/**
 * Retrieves the allowlisting status of a tab
 *
 * @param {number} tabId The id of the tab
 * @param {any} ewe The filter engine
 * @returns {Promise<{source: null, oneCA: boolean, status: boolean}>} The allowlisting state
 */
async function getAllowlistStatus({tabId, ewe}) {
  const allowlistingFilters = await ewe.filters.getAllowingFilters(tabId);
  let source = null;

  for (const filter of allowlistingFilters) {
    // eslint-disable-next-line no-await-in-loop
    const metadata = await ewe.filters.getMetadata(filter);
    const {origin} = metadata ?? {};

    if (origin === "web") {
      source = "1ca";
      break;
    } else {
      source = "user";
      // Don't break here, continue searching in case there's a "web" origin
    }
  }

  return {
    status: allowlistingFilters.length > 0,
    source,
    oneCA: true
  };
}

/**
 *
 * @param tabId
 * @param ewe
 * @param getPremiumState
 * @param getAuthPayload
 * @returns {Promise<{extensionInfo: {allowlistState: {source: null, oneCA: boolean, status: boolean}, name: string, version: string}, payload: *}>}
 */
async function getExtensionStatus({tabId, ewe, getPremiumState, getAuthPayload}) {
  // TODO: Finish implementation
  const manifest = await browser.runtime.getManifest();
  const allowlistState = await getAllowlistStatus({tabId, ewe});

  const premiumState = getPremiumState();
  const payload = premiumState.isActive ? getAuthPayload() : null;

  const extensionInfo = {
    name: manifest.short_name,
    version: manifest.version,
    allowlistState
  };

  return {payload, extensionInfo};
}

/**
 * Initializes the Public API fragment.
 *
 * @param {import("./types.js").StartParams} StartParams The start parameters
 */
export function start({ewe, port, addTrustedMessageTypes, getPremiumState, getAuthPayload}) {
  port.on(allowlistingTriggerEvent, async (message, sender) => handleAllowlisting({message, sender}));

  addTrustedMessageTypes(apiFrameUrl, [
    allowlistingTriggerEvent,
  ]);

  browser.webNavigation.onCommitted.addListener(async (details) => {
    // Only inject in iframes
    // if (details.frameId !== 0) {
    // }
    const {tabId, frameId} = details;
    const extensionData = await getExtensionStatus({tabId, ewe, getPremiumState, getAuthPayload});
    injectScriptInFrame({
      tabId,
      frameId,
      func: webpageAPI,
      args: [{
        allowlistingTriggerEvent,
        allowlistingResponseEvent,
        extensionData,
      }]
    });
  }, {url: [{urlMatches: apiFrameUrl}]});
}
