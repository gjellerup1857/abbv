/*
 * This file is part of Adblock Plus <https://adblockplus.org/>,
 * Copyright (C) 2006-present eyeo GmbH
 *
 * Adblock Plus is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 3 as
 * published by the Free Software Foundation.
 *
 * Adblock Plus is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Adblock Plus.  If not, see <http://www.gnu.org/licenses/>.
 */

import { type WebNavigation } from "webextension-polyfill";
import { addTrustedMessageTypes, port } from "~/core/messaging/background";
import { setupDetection } from "../content/detection";
import { detectionMessage } from "../shared";
import { executeFunction } from "./script-injector";

/**
 * Will try to inject the detection script if the event happened on the top-
 * level frame.
 *
 * @param details The navigation details
 */
async function injectDetectionScript(
  details: WebNavigation.OnCommittedDetailsType
): Promise<void> {
  const { tabId, frameId } = details;
  // Only inject in the tab's top-level browsing context, not
  // in a nested <iframe>.
  if (details.frameId !== 0) {
    return;
  }

  try {
    await executeFunction(tabId, frameId, setupDetection);
  } catch (_) {
    // Can't recover from this.
  }
}

function informIPMAboutDetection(): void {}

/**
 * Starts the cookie banner detection feature
 */
export function start(): void {
  addTrustedMessageTypes(null, [detectionMessage]);
  port.on(detectionMessage, informIPMAboutDetection);

  browser.webNavigation.onCommitted.addListener((details) => {
    void injectDetectionScript(details);
  });
}
