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
import { commandStorageKey } from "./command-library";
import { recordEvent } from "./event-recording";
import { type Command } from "./command-library.types";
import { context } from "../context";

/**
 * Runs a check to see whether the current user language still matches the
 * user language when the command was received. Will record an event in case
 * the language changed.
 *
 * @param ipmId The ID of the IPM command to run the check for
 */
export async function checkLanguage(ipmId: string): Promise<void> {
  await context.untilPreferencesLoaded();
  const commandStorage = context.getPreference(commandStorageKey);
  if (!(ipmId in commandStorage)) {
    return;
  }

  const command: Command = commandStorage[ipmId];

  if (typeof command.attributes?.language !== "string") {
    // This is an old command that didn't get enriched with additional attributes.
    return;
  }

  if (browser.i18n.getUILanguage() === command.attributes.language) {
    return;
  }

  recordEvent(command.ipm_id, command.command_name, "language_skew");
}
