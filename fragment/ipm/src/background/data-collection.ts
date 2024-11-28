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

import { getStoredCommandIds } from "./command-library";
import { CommandName, CommandVersion } from "./command-library.types";
import {
  type BaseAttributes,
  DataType,
  type DeviceData,
  type EventData,
  type IpmCapability,
  type IpmData,
  LicenseState,
  type PayloadData,
  PlatformStatus,
  PlatformType,
  type UserData,
  eventStorageKey,
} from "./data-collection.types";
import { context } from "./context";

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
    leftPad(date.getSeconds()),
  ].join("");
}

/**
 * Returns an object with base attributes that all MoEngage telemetry objects share.
 *
 * @returns The base attributes
 */
async function getBaseAttributes(): Promise<BaseAttributes> {
  return {
    app_name: context.getAppName(),
    browser_name: context.getBrowserName(),
    os: (await browser.runtime.getPlatformInfo()).os,
    language_tag: browser.i18n.getUILanguage(),
    app_version: context.getAppVersion(),
    install_type: (await browser.management.getSelf()).installType,
  };
}

/**
 * Creates an object containing all data for an event that the IPM server expects.
 *
 * @param ipmId The IPM command id
 * @param commandName - The name of the command the event belongs to
 * @param commandVersion - The version of the command the event belongs to
 * @param name The event name
 * @returns A fully qualified event data object
 */
async function getEventData(
  ipmId: string,
  commandName: string,
  commandVersion: number,
  name: string,
): Promise<EventData> {
  return {
    type: DataType.event,
    device_id: await context.getId(),
    action: name,
    platform: PlatformType.web,
    app_version: context.getAppVersion(),
    user_time: getLocalTimeStamp(),
    attributes: {
      ...(await getBaseAttributes()),
      ipm_id: ipmId,
      command_name: commandName,
      command_version: commandVersion,
    },
  };
}

/**
 * Creates an object containing all device data that the IPM server expects.
 *
 * @returns An object containing device data
 */
async function getDeviceData(): Promise<DeviceData> {
  await context.untilPreferencesLoaded();
  return {
    type: DataType.device,
    device_id: await context.getId(),
    attributes: {
      ...(await getBaseAttributes()),
      blocked_total: 0, // We're not sending block count to protect user privacy
      license_status: context.isLicenseValid()
        ? LicenseState.active
        : LicenseState.inactive,
    },
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
    attributes: await getBaseAttributes(),
  };
}

/**
 * Gets commands data supported by the extension to send to the IPM server
 *
 * @returns a list of objects containing the supported commands data
 */
export function getSupportedCommandsData(): IpmCapability[] {
  const commandNames = Object.values(CommandName);
  const supportedCommandsData = commandNames.map((name) => ({
    name,
    version: CommandVersion[name],
  }));

  return supportedCommandsData;
}

/**
 * Gets IPM data in the extension that will be consumed by the IPM server.
 *
 * @returns an object containing the IPM data
 */
function getIpmData(): IpmData {
  return {
    active: getStoredCommandIds().map((id) => ({ id })),
    capabilities: [
      {
        name: "multi_ipm_response",
        version: 1,
      },
      ...getSupportedCommandsData(),
    ],
  };
}

/**
 * Creates the payload to send to the IPM server.
 *
 * @returns An object containing the payload
 */
export async function getPayload(): Promise<PayloadData> {
  await context.untilPreferencesLoaded();
  const user = await getUserData();
  const device = await getDeviceData();
  const events = context.getPreference(eventStorageKey);
  const ipm = getIpmData();
  return { user, device, events, ipm };
}

/**
 * Clears all recorded user events.
 */
export async function clearEvents(): Promise<void> {
  await context.untilPreferencesLoaded();
  void context.setPreference(eventStorageKey, []);
}

/**
 * Generates and stores event data.
 *
 * **NOTE**: To record events, please do not use this function directly.
 * Instead refer to the functions provided in the event recording file.
 *
 * @param ipmId An ipm ID (or a replacement string)
 * @param commandName A command name (or a replacement string)
 * @param commandVersion A command version (or a replacement number)
 * @param name The name of the event to store
 */
export async function storeEvent(
  ipmId: string,
  commandName: string,
  commandVersion: number,
  name: string,
): Promise<void> {
  await context.untilPreferencesLoaded();
  const eventData = await getEventData(
    ipmId,
    commandName,
    commandVersion,
    name,
  );
  const eventStorage = context.getPreference(eventStorageKey) as EventData[];
  eventStorage.push(eventData);
  void context.setPreference(eventStorageKey, eventStorage);
}
