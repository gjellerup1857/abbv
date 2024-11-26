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
import * as ewe from "@eyeo/webext-ad-filtering-solution";
import { FilterOrigin } from "../shared";
import { Prefs } from "../../../adblockpluschrome/lib/prefs";

async function migrateToSmartAllowlisting(): Promise<boolean> {
  const expectedAssignment = "historical-popup-allowlists-migration";
  const assignments = await ewe.experiments.getAssignments();
  // check if migration is enabled for the user
  if (!assignments[expectedAssignment]) {
    return false;
  }

  const flagName = "allowlist-migration-disabled-locale";
  const disabledLocales =
    ((await ewe.experiments.getFlag(flagName)) as string[]) ?? [];
  const userLocale = browser.i18n.getUILanguage();

  if (disabledLocales.includes(userLocale)) {
    return false;
  }

  const filters = await ewe.filters.getUserFilters();
  const documentAllowLists = filters.filter(
    (filter) => filter.text.startsWith("@@") && filter.text.includes("document")
  );
  const documentAllowListsWithMetadata = await Promise.all(
    documentAllowLists.map(async (filter) => {
      const metadata = await ewe.filters.getMetadata(filter.text);
      return { ...filter, metadata };
    })
  );

  const allowlistsToTransition = documentAllowListsWithMetadata.filter(
    ({ metadata }) =>
      !metadata?.autoExtendMs &&
      !metadata?.expiresAt &&
      metadata?.origin === FilterOrigin.popup
  );

  // transition to smart allowlisting
  const autoExtendMs = Prefs.get("allowlisting_auto_extend_ms");
  await Promise.all(
    allowlistsToTransition.map(async ({ text: filterText, metadata }) => {
      await ewe.filters.setMetadata(filterText, {
        ...metadata,
        autoExtendMs,
        expiresAt: Date.now() + autoExtendMs
      });
    })
  );

  return true;
}

/**
 * Initializes the migration module
 */
export async function start(): Promise<void> {
  await Prefs.untilLoaded;
  const prefsKey = "migration_popup_to_smart_allowlist_complete";

  if (Prefs.get(prefsKey)) {
    return;
  }

  try {
    await migrateToSmartAllowlisting();
    await Prefs.set(prefsKey, true);
  } catch (error) {
    await Prefs.set(prefsKey, false);
    console.error("Failed to migrate to smart allowlisting", error);
  }
}
