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

import * as browser from "webextension-polyfill";

import { Prefs } from "../../../adblockpluschrome/lib/prefs";
import { getStoredCommandIds } from "./command-library";
import {
  type CommandName,
  CommandVersion,
  commandLibraryVersion
} from "./command-library.types";
import {
  type BaseAttributes,
  DataType,
  type DeviceData,
  type EventData,
  type IpmData,
  LicenseState,
  type PayloadData,
  PlatformStatus,
  PlatformType,
  type UserData,
  eventStorageKey
} from "./data-collection.types";
import { getPremiumState } from "../../premium/background";
import { getInstallationId } from "../../id/background";
import { info } from "../../info/background";

/**
 * Takes a number, turns it into a string, and pads it if necessary to create
 * a string of the length 2.
 *
 * @param value The number to pad
 * @returns The padded number
 */
function leftPad(value: number): string {
  return value.toString().padStart(2, "0");
}

/**
 * Returns a string representing a current timestamp, in local time.
 *
 * @example
 *  "2011-10-05T14:48:00"
 * @returns A string representing the current timestamp
 */
function getLocalTimeStamp(): string {
  const date = new Date();
  return [
    date.getFullYear(),
    "-",
    leftPad(date.getMonth() + 1),
    "-",
    leftPad(date.getDate()),
    "T",
    leftPad(date.getHours()),
    ":",
    leftPad(date.getMinutes()),
    ":",
    leftPad(date.getSeconds())
  ].join("");
}

/**
 * Returns an object with base attributes that all MoEngage telemetry objects share.
 *
 * @returns The base attributes
 */
async function getBaseAttributes(): Promise<BaseAttributes> {
  return {
    app_name: info.baseName,
    browser_name: info.application,
    os: (await browser.runtime.getPlatformInfo()).os,
    language_tag: browser.i18n.getUILanguage(),
    app_version: info.addonVersion,
    command_library_version: commandLibraryVersion,
    install_type: (await browser.management.getSelf()).installType
  };
}

/**
 * Creates an object containing all data for an event that the IPM server expects.
 *
 * @param ipmId The IPM command id
 * @param name The event name
 * @returns A fully qualified event data object
 */
async function getEventData(
  ipmId: string,
  command: CommandName,
  name: string
): Promise<EventData> {
  return {
    type: DataType.event,
    device_id: await getInstallationId(),
    action: name,
    platform: PlatformType.web,
    app_version: info.addonVersion,
    user_time: getLocalTimeStamp(),
    attributes: {
      ...(await getBaseAttributes()),
      ipm_id: ipmId,
      command_name: command,
      command_version: CommandVersion[command]
    }
  };
}

/**
 * Creates an object containing all device data that the IPM server expects.
 *
 * @returns An object containing device data
 */
async function getDeviceData(): Promise<DeviceData> {
  await Prefs.untilLoaded;
  return {
    type: DataType.device,
    device_id: await getInstallationId(),
    attributes: {
      ...(await getBaseAttributes()),
      blocked_total: 0, // We're not sending block count to protect user privacy
      license_status: getPremiumState().isActive
        ? LicenseState.active
        : LicenseState.inactive
    }
  };
}

/**
 * Creates an object containing all user data that the IPM server expects.
 *
 * @returns An object containing user data
 */
async function getUserData(): Promise<UserData> {
  return {
    type: DataType.customer,
    platforms: [{ platform: PlatformType.web, active: PlatformStatus.true }],
    attributes: await getBaseAttributes()
  };
}

/**
 * Gets data about stored commands that will be consumed by the IPM server.
 *
 * @returns an object containing stored commands data
 */
function getIpmData(): IpmData {
  return {
    active: getStoredCommandIds().map((id) => ({ id }))
  };
}

/**
 * Creates the payload to send to the IPM server.
 *
 * @returns An object containing the payload
 */
export async function getPayload(): Promise<PayloadData> {
  await Prefs.untilLoaded;
  const user = await getUserData();
  const device = await getDeviceData();
  const events = Prefs.get(eventStorageKey);
  const ipm = getIpmData();
  return { user, device, events, ipm };
}

/**
 * Clears all recorded user events.
 */
export async function clearEvents(): Promise<void> {
  await Prefs.untilLoaded;
  void Prefs.set(eventStorageKey, []);
}

/**
 * Records a user event
 *
 * @param ipmId - The IPM ID
 * @param name - The name of the event to record
 */
export async function recordEvent(
  ipmId: string,
  command: CommandName,
  name: string
): Promise<void> {
  await Prefs.untilLoaded;
  const eventData = await getEventData(ipmId, command, name);
  const eventStorage = Prefs.get(eventStorageKey) as EventData[];
  eventStorage.push(eventData);
  void Prefs.set(eventStorageKey, eventStorage);
}
