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
import { getExtensionStatus } from "./status-api.js";
import { handleAllowlisting } from "./allowlisting-api.js";

/**
 * Initializes the Public API fragment.
 *
 * @param {import("./types.js").StartParams} StartParams The start parameters
 */
export function start({
  ewe,
  port,
  addTrustedMessageTypes,
  isPremiumActive,
  getEncodedLicense,
}) {
  port.on(allowlistingTriggerEvent, async (message, sender) =>
    handleAllowlisting({ allowlistingOptions: message, sender }),
  );

  addTrustedMessageTypes(apiFrameUrl, [allowlistingTriggerEvent]);

  browser.webNavigation.onCommitted.addListener(
    async (details) => {
      // Only inject in iframes
      // if (details.frameId !== 0) {
      // }
      const { tabId, frameId } = details;
      const extensionData = await getExtensionStatus({
        tabId,
        ewe,
        isPremiumActive,
        getEncodedLicense,
      });
      injectScriptInFrame({
        tabId,
        frameId,
        func: webpageAPI,
        args: [
          {
            allowlistingTriggerEvent,
            allowlistingResponseEvent,
            extensionData,
          },
        ],
      });
    },
    { url: [{ urlMatches: apiFrameUrl }] },
  );
}
