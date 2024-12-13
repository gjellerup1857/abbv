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

import browser from "webextension-polyfill";
import { detectionEventName, detectionMessage } from "../shared";

/**
 * Forwards a cookie banner detection event to the ServiceWorker (or background
 * script).
 */
export function forwardDetectionEvent(): void {
  void browser.runtime.sendMessage({ type: detectionMessage });
}

/**
 * Starts the content script of the cookie banner detection feature.
 */
export function start(): void {
  document.addEventListener(detectionEventName, forwardDetectionEvent);
}

start();
