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

import { Prefs } from "../../../adblockpluschrome/lib/prefs";
import {
  ScheduleType,
  setListener,
  setSchedule,
  hasSchedule
} from "../../core/scheduled-event-emitter/background";
import { executeIPMCommands } from "./command-library";
import { getPayload, clearEvents } from "./data-collection";
import { error as logError } from "../../logger/background";
import { intervalKey, serverUrlKey, scheduleName } from "./telemetry.types";

/**
 * Processes a response from the IPM server. Will request command execution
 * if necessary.
 *
 * @param response The response from the IPM server
 */
async function processResponse(response: Response): Promise<void> {
  if (!response.ok) {
    logError(
      `[Telemetry]: Bad response status from IPM server: ${response.status}`
    );
    return;
  }

  // If the server responded with an empty body, we're done here.
  const body = await response.text();
  if (body.length === 0) {
    return;
  }

  // If the server responded with anything else, we assume it's a command or a list of them.
  try {
    const bodyJSON = JSON.parse(body);
    let commands;

    if (Array.isArray(bodyJSON)) {
      commands = bodyJSON;
    } else {
      // adding support to legacy server response, where we receive only one command per ping
      commands = [bodyJSON];
    }

    executeIPMCommands(commands);
  } catch (error) {
    logError("[Telemetry]: Error parsing IPM response.", error);
  }
}

/**
 * Sends a ping together with telemetry data
 */
export async function sendPing(): Promise<void> {
  // Disable IPM when user opted out of data collection.
  if (Prefs.get("data_collection_opt_out") === true) {
    return;
  }

  const payload = await getPayload();

  // We're deleting user events regardless of whether sending them will be
  // successful or not.
  void clearEvents();

  const url = Prefs.get(serverUrlKey);
  if (typeof url !== "string") {
    return;
  }

  void fetch(url, {
    method: "POST",
    cache: "no-cache",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  })
    .then(processResponse)
    .catch((error) => {
      logError("[Telemetry]: Ping sending failed with error:", error);
    });
}

/**
 * Starts The telemetry module.
 *
 * Will schedule pings.
 */
export async function start(): Promise<void> {
  void setListener(scheduleName, () => {
    void sendPing();
  });

  if (!hasSchedule(scheduleName)) {
    await Prefs.untilLoaded;
    const intervalTime = Prefs.get(intervalKey);
    if (typeof intervalTime !== "number") {
      return;
    }

    void sendPing();
    void setSchedule(scheduleName, intervalTime, ScheduleType.interval);
  }
}
