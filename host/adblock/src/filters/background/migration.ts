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

async function migrateToSmartAllowlisting(): Promise<void> {
  const localesEnabled = ["en", "de", "en-GB"]; // TODO: get this from ab testing
  const userLocale = browser.i18n.getUILanguage();

  if (!localesEnabled.includes(userLocale)) {
    return;
  }

  const origins: string[] = [FilterOrigin.popup, FilterOrigin.youtube, FilterOrigin.wizard];

  const filters = await ewe.filters.getUserFilters();
  const minDate = new Date(2020, 10, 11); // 11th November 2020
  const maxDate = new Date(2021, 10, 11); // TODO: replace it with actual date
  let transitionedCount = 0;
  let fromGfcCount = 0;
  let allowlistsLeftCount = 0;

  for (const filter of filters) {
    const isDocumentAllowlist = filter.text.startsWith("@@") && filter.text.includes("document");
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const metadata = await ewe.filters.getMetadata(filter.text);
    const isSmartAllowlist = metadata && metadata.autoExtendMs && metadata.expiresAt;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const hasAffectedOrigin = metadata && metadata.origin && origins.includes(metadata.origin);
    const isFrom1CA = metadata && metadata.origin === FilterOrigin.web;
    const isDuringGFCPeriod =
      metadata &&
      metadata.created &&
      minDate.getTime() <= metadata.created &&
      metadata.created <= maxDate.getTime();

    if (isDocumentAllowlist && !isSmartAllowlist && !hasAffectedOrigin) {
      allowlistsLeftCount += 1;
    }

    if (isDocumentAllowlist && isFrom1CA && isDuringGFCPeriod) {
      fromGfcCount += 1;
    }

    // transition to smart allowlist
    if (isDocumentAllowlist && !isSmartAllowlist && hasAffectedOrigin) {
      const autoExtendMs = Prefs.get("allowlisting_auto_extend_ms");
      metadata.expiresAt = Date.now() + autoExtendMs;
      metadata.autoExtendMs = autoExtendMs;
      await ewe.filters.setMetadata(filter.text, metadata);

      transitionedCount += 1;
    }
  }

  ServerMessages.recordGeneralMessage("migrated_popup_allowlists", null, {
    allowlistsLeftCount,
    fromGfcCount,
    transitionedCount,
  });
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
