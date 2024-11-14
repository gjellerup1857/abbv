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
} from "../shared/constants.js";

let throttled = false;
const manifest = browser.runtime.getManifest();
const extName = manifest.short_name;

const extAllowlistingTriggerEvent = `${extName}.${allowlistingTriggerEvent}`;
const extAllowlistingResponseEvent = `${extName}.${allowlistingResponseEvent}`;

/**
 * Checks if the allowlisting command has the right format.
 *
 * @param {object} allowlistingCommand The allowlisting command
 * @returns {boolean} True if the command is valid, false otherwise.
 */
function isValidAllowlistingCommand(allowlistingCommand) {
  return (
    allowlistingCommand &&
    typeof allowlistingCommand === "object" &&
    typeof allowlistingCommand.timeout === "number" &&
    allowlistingCommand.timeout > 0 &&
    typeof allowlistingCommand.options === "object" &&
    typeof allowlistingCommand.options.expiresAt === "number" &&
    allowlistingCommand.options.expiresAt > 0
  );
}

/**
 * Sends an allowlisting command to the background script, if the background script doesn't reply in
 * timoutMS then this will return and error response
 *
 * @param allowlistingCommand The command to be passed to the background script
 * @param timeoutMs How long should it wait for a reply
 * @returns {Promise<{reason: string, success: boolean, extName: string}>} The result from the background script
 * or a timeout error
 */
async function sendAllowlistCommand(allowlistingCommand) {
  const { options, timeout } = allowlistingCommand;

  const messagePromise = browser.runtime.sendMessage({
    type: allowlistingTriggerEvent,
    options,
  });

  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(
      () => reject(new Error("Timeout waiting for background response")),
      timeout,
    ),
  );

  // Timeout if no response from the background script is received in time
  try {
    return await Promise.race([messagePromise, timeoutPromise]);
  } catch (error) {
    return {
      extName,
      success: false,
      reason: error.message,
    };
  }
}

/**
 * Sends a response to the main world by dispatching an event to the DOM.
 *
 * @param response The response to be sent.
 */
function sendResponseToMainWorld(response) {
  let options = { detail: response };
  if (typeof cloneInto === "function") {
    // Firefox requires content scripts to clone objects
    // that are passed to the document
    options = cloneInto(options, document.defaultView);
  }

  document.dispatchEvent(
    new CustomEvent(extAllowlistingResponseEvent, options),
  );
}

/**
 * Listener for dispatched allowlisting events from the main world script.
 * This listener is throttled, meaning that multiple events from the main world
 * will not be passed to the background script if there is already an allowlisting
 * command in execution
 *
 * @param allowlistingCommand The allowlisting command
 * @returns {Promise<void>} The result of the allowlisting command
 */
async function allowlistWebsiteListener(allowlistingCommand) {
  console.log(
    "Received allowlist command from page script",
    allowlistingCommand,
  );
  if (!isValidAllowlistingCommand(allowlistingCommand)) {
    sendResponseToMainWorld({
      extName,
      success: false,
      reason: "Invalid allowlisting command",
    });

    return;
  }

  if (throttled) {
    return;
  }

  throttled = true;
  const response = await sendAllowlistCommand(allowlistingCommand);
  console.log("received response from extension in content script", response);
  sendResponseToMainWorld(response);
  throttled = false;
}

function start() {
  document.addEventListener(extAllowlistingTriggerEvent, (ev) => {
    const { detail } = ev;
    return allowlistWebsiteListener(detail);
  });
}

start();
