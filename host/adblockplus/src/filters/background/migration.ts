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

async function migrateToSmartAllowlisting(): Promise<void> {
  const localesEnabled = ["en", "de", "en-GB"]; // TODO: get this from ab testing
  const userLocale = browser.i18n.getUILanguage();

  if (!localesEnabled.includes(userLocale)) {
    return;
  }

  const filters = await ewe.filters.getUserFilters();

  for (const filter of filters) {
    const isDocumentAllowlist =
      filter.text.startsWith("@@") && filter.text.includes("document");
    const metadata = await ewe.filters.getMetadata(filter.text);
    const isSmartAllowlist = metadata?.autoExtendMs && metadata?.expiresAt;
    const hasAffectedOrigin = metadata?.origin === FilterOrigin.popup;

    // transition to smart allowlist
    if (isDocumentAllowlist && !isSmartAllowlist && hasAffectedOrigin) {
      const autoExtendMs = Prefs.get("allowlisting_auto_extend_ms");
      metadata.expiresAt = Date.now() + autoExtendMs;
      metadata.autoExtendMs = autoExtendMs;
      await ewe.filters.setMetadata(filter.text, metadata);
    }
  }
}

/**
 * Initializes the migration module
 */
export async function start(): Promise<void> {
  if (Prefs.get("popup_to_smart_allowlist")) {
    return;
  }

  try {
    await migrateToSmartAllowlisting();
    await Prefs.set("popup_to_smart_allowlist", true);
  } catch (error) {
    console.error("Failed to migrate to smart allowlisting", error);
  }
}
