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

import { port } from "../../core/messaging/background";
import { isMessage, type Message } from "../../core/messaging/shared";
import { info } from "../../info/background";
import { store } from "../../store/background";
import { type DocLinkMessage, stateKey } from "./doc-link.types";

/**
 * Reads the documentation link preference and substitutes placeholders.
 *
 * @param linkID The linkID replacement string
 * @param store The store where the documentation link can be found
 * @returns The documentation link with tags replaced.
 */
export function getDocLink(linkID: string): string {
  return store[stateKey].value
    .replace(/%LINK%/g, linkID)
    .replace(/%LANG%/g, browser.i18n.getUILanguage());
}

/**
 * Returns the name of the browser. Will report all Chromium browsers that
 * are not Edge or Opera as "chrome".
 *
 * @returns The name of the browser in use
 */
export function getBrowserName(): string {
  const { application, platform } = info;

  if (
    platform === "chromium" &&
    application !== "opera" &&
    application !== "edge"
  ) {
    return "chrome";
  }

  return application;
}

/**
 * Checks whether the given candidate satisfies the requirements to be a
 * DocLinkMessage.
 *
 * @param candidate The candidate to check
 * @returns Whether the given candidate satisfies the requirements to be a
 *  DocLinkMessage
 */
export function isDocLinkMessage(
  candidate: unknown
): candidate is DocLinkMessage {
  return isMessage(candidate) && typeof (candidate as any).link === "string";
}

/**
 * Handles a message asking for a documentation link.
 *
 * @param message The message to handle
 * @returns A documentation link with tags replaced. If the message is
 *  invalid, it will return the empty string.
 */
export function handleDocLinkMessage(message: Message): string {
  if (!isDocLinkMessage(message)) {
    return "";
  }

  return getDocLink(message.link.replace("{browser}", getBrowserName()));
}

/**
 * Starts the docLink module.
 * Adds a listener for the `prefs.getDocLink` message.
 */
export function start(): void {
  port.on("prefs.getDocLink", (message) => handleDocLinkMessage(message));
}
