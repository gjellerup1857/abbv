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
  statusTriggerEvent,
  statusResponseEvent,
} from "../shared/constants.js";
import { isValidAllowlistingCommand } from "../shared/helpers.js";

let throttled = false;
const { short_name: extName } = browser.runtime.getManifest();

const extAllowlistingTriggerEvent = `${allowlistingTriggerEvent}.${extName}`;
const extAllowlistingResponseEvent = `${allowlistingResponseEvent}.${extName}`;
const extStatusTriggerEvent = `${statusTriggerEvent}.${extName}`;
const extStatusResponseEvent = `${statusResponseEvent}.${extName}`;

/**
 * Sends a response to the main world by dispatching an event to the DOM.
 *
 * @param response The response to be sent.
 */
function sendResponseToMainWorld(eventType, detail) {
  let options = { detail };
  if (typeof cloneInto === "function") {
    // Firefox requires content scripts to clone objects
    // that are passed to the document
    options = cloneInto(options, document.defaultView);
  }

  document.dispatchEvent(new CustomEvent(eventType, options));
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
    "Received allowlist command in isolated world command from main world",
    allowlistingCommand,
  );

  const { requestId } = allowlistingCommand;
  const responseEventType = `${extAllowlistingResponseEvent}.${requestId}`;
  if (!isValidAllowlistingCommand(allowlistingCommand)) {
    sendResponseToMainWorld(responseEventType, {
      extName,
      success: false,
      reason: "invalid_command",
    });

    return;
  }

  const { options } = allowlistingCommand;

  const response = await browser.runtime.sendMessage({
    type: allowlistingTriggerEvent,
    options,
  });

  console.log("received response from extension in isolated world", response);
  sendResponseToMainWorld(responseEventType, response);
}

async function getStatus(statusCommand) {
  console.log(
    "Received status command in isolated world command from main world",
    statusCommand,
  );

  const { requestId } = statusCommand;
  const responseEventType = `${extStatusResponseEvent}.${requestId}`;

  const response = await browser.runtime.sendMessage({
    type: statusTriggerEvent,
  });

  console.log("received response from extension in isolated world", response);
  sendResponseToMainWorld(responseEventType, response);
}

/**
 * Signals to the Main world script that the content script was initialized
 * by adding a hidden div into the page.
 */
function sendReadySignal() {
  const html = document.documentElement;
  html.dataset[extName.replace(/\s+/g, "")] = "true";
  console.log("Isolated world script is ready");
}

/**
 * Starts the initialization of the Isolated world API
 */
function start() {
  document.addEventListener(extAllowlistingTriggerEvent, (ev) => {
    const { detail } = ev;
    return allowlistWebsiteListener(detail);
  });

  document.addEventListener(extStatusTriggerEvent, (ev) => {
    const { detail } = ev;
    return getStatus(detail);
  });

  sendReadySignal();
}

start();
