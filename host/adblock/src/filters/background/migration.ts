/*
 * This file is part of AdBlock  <https://getadblock.com/>,
 * Copyright (C) 2013-present  Adblock, Inc.
 *
 * AdBlock is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 3 as
 * published by the Free Software Foundation.
 *
 * AdBlock is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with AdBlock.  If not, see <http://www.gnu.org/licenses/>.
 */

import * as browser from "webextension-polyfill";
import * as ewe from "@eyeo/webext-ad-filtering-solution";
import { FilterOrigin } from "../shared";
import { Prefs } from "~/alias/prefs";
import ServerMessages from "~/servermessages";

async function migrateToSmartAllowlisting(): Promise<boolean> {
  const localesEnabled = ["en", "de", "en-GB"]; // TODO: get this from ab testing
  const userLocale = browser.i18n.getUILanguage();

  if (!localesEnabled.includes(userLocale)) {
    return false;
  }

  const origins: string[] = [FilterOrigin.popup, FilterOrigin.wizard];
  const minDate = new Date(2020, 10, 11); // 11th November 2020
  const maxDate = new Date(2023, 11, 1); // 1st December 2023

  const filters = await ewe.filters.getUserFilters();
  const documentAllowLists = filters.filter(
    (filter) => filter.text.startsWith("@@") && filter.text.includes("document"),
  );
  const documentAllowListsWithMetadata = await Promise.all(
    documentAllowLists.map(async (filter) => {
      const metadata = await ewe.filters.getMetadata(filter.text);
      return { ...filter, metadata };
    }),
  );

  const allowlistsFromGfc = documentAllowListsWithMetadata.filter(
    ({ metadata }) =>
      metadata?.origin === FilterOrigin.web &&
      metadata?.created &&
      metadata.created >= minDate.getTime() &&
      metadata.created <= maxDate.getTime(),
  );

  const existingSmartAllowlists = documentAllowListsWithMetadata.filter(
    ({ metadata }) => metadata?.autoExtendMs && metadata?.expiresAt,
  );

  const allowlistsToTransition = documentAllowListsWithMetadata.filter(
    ({ metadata }) =>
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      !metadata?.autoExtendMs && !metadata?.expiresAt && origins.includes(metadata?.origin),
  );

  // transition to smart allowlisting
  const autoExtendMs = Prefs.get("allowlisting_auto_extend_ms");
  await Promise.all(
    allowlistsToTransition.map(async ({ text: filterText, metadata }) => {
      await ewe.filters.setMetadata(filterText, {
        ...metadata,
        autoExtendMs,
        expiresAt: Date.now() + autoExtendMs,
      });
    }),
  );

  ServerMessages.recordGeneralMessage("migrated_popup_allowlists", null, {
    transitionedCount: allowlistsToTransition.length,
    fromGfcCount: allowlistsFromGfc.length,
    allowlistsLeftCount:
      documentAllowListsWithMetadata.length -
      allowlistsToTransition.length -
      allowlistsFromGfc.length -
      existingSmartAllowlists.length,
  });

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
