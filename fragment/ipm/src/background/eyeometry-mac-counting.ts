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

import * as ewe from "@eyeo/webext-ad-filtering-solution";

import { prefs, logger } from "./context";

async function applyOptOut(): Promise<void> {
  const isOptedOut = prefs.get("data_collection_opt_out");

  await ewe.telemetry.setOptOut(
    typeof isOptedOut === "boolean" ? isOptedOut : true,
  );
}

async function initOptOut(): Promise<void> {
  await prefs.untilLoaded;

  await applyOptOut();
  prefs.on("data_collection_opt_out", applyOptOut);
}

/**
 * Initializes the settings for Eyeometry-based client counting.
 */
export async function initialize(): Promise<void> {
  try {
    await initOptOut();
  } catch (error) {
    logger.error(
      "Eyeometry-based MAC counting initialization failed with error: ",
      error,
    );
  }
}
