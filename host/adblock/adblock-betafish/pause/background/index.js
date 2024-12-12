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

/* For ESLint: List any global identifiers used in this file below */
/* global browser */

import * as ewe from "@eyeo/webext-ad-filtering-solution";
import { FilterOrigin } from "../../../src/filters/shared";
import { createFilterMetaData } from "../../utilities/background/bg-functions";
import { Prefs } from "~/alias/prefs";
import { initialize } from "~/alias/subscriptionInit";
import ServerMessages from "~/servermessages";

import {
  chromeStorageSetHelper,
  sessionStorageGet,
  sessionStorageSet,
} from "~/utilities/background/bg-functions";

const pausedKey = "paused";
// white-list all blocking requests regardless of frame / document, but still allows element hiding
const pausedFilterText1 = "@@*";
// white-list all documents, which prevents element hiding
const pausedFilterText2 = "@@*$document";

const createDomainAllowlistRule = function (domain) {
  return `@@||${domain}^$document`;
};

// Get or set if AdBlock is paused
// Inputs: newValue (optional boolean): if true, AdBlock will be paused, if
// false, AdBlock will not be paused.
// Returns: undefined if newValue was specified, otherwise it returns true
// if paused, false otherwise.
const adblockIsPaused = function (newValue) {
  if (newValue === undefined) {
    return sessionStorageGet(pausedKey) === true;
  }

  if (newValue === true) {
    chromeStorageSetHelper(pausedKey, true, () => {
      ewe.filters.add([pausedFilterText1]);
      ewe.filters.add([pausedFilterText2]);
    });
  } else {
    ewe.filters.remove([pausedFilterText1]);
    ewe.filters.remove([pausedFilterText2]);
    browser.storage.local.remove(pausedKey);
  }
  sessionStorageSet(pausedKey, newValue);
  return undefined;
};

/**
 * Adds an allowlist rule for the specified URL
 * @param {string} origin - a String representing the method that
 *                 user or event that added the filter rule
 */
const allowlistTab = async (tabURL, origin = FilterOrigin.popup) => {
  const autoExtendMs = Prefs.get("allowlisting_auto_extend_ms");
  const metadata = {
    ...createFilterMetaData(origin),
    expiresAt: Date.now() + autoExtendMs,
    autoExtendMs,
  };

  const url = new URL(tabURL);
  const host = url.hostname.replace(/^www\./, "");
  await ewe.filters.add(createDomainAllowlistRule(host), metadata);
};

/**
 * Removes all allowlist rules for the specified tab
 * @param {number} tabId - the id of the tab that should have all
 *                         allowing filters removed
 * @return {boolean} true, if the rule(s) were removed
 *                   false, if no allowlist rules were found
 */
const removeAllAllowlistRulesForTab = async (tabId) => {
  const filters = await ewe.filters.getAllowingFilters(tabId);
  let removedFilters = false;
  for (let i = 0; i < filters.length; i++) {
    // eslint-disable-next-line no-await-in-loop
    await ewe.filters.remove(filters[i]);
    removedFilters = true;
  }
  return removedFilters;
};

/**
 * Determines if the tab temporarily allowlisted
 * @param {number} tabId - the id of the tab that should have all
 *                         allowing filters removed
 * @return {boolean} true, if the  tab is temporarily allowlisted
 *                   false, if the tab is not temporarily allowlisted
 */
// return a boolean indicating whether the tab is paused
const isTabTemporaryAllowlisted = async (tabId) => {
  const filters = await ewe.filters.getAllowingFilters(tabId);
  let metaDataMatch = false;
  for (let i = 0; i < filters.length && !metaDataMatch; i++) {
    // eslint-disable-next-line no-await-in-loop
    const metadata = await ewe.filters.getMetadata(filters[i]);
    metaDataMatch = metadata?.expiresByTabId === tabId;
  }
  return metaDataMatch;
};

// If AdBlock was paused on shutdown (adblock_is_paused is true), then
// unpause / remove the white-list all entry at startup.
browser.storage.local.get(pausedKey).then((response) => {
  if (response[pausedKey]) {
    initialize.then(() => {
      ewe.filters.remove([pausedFilterText1]);
      ewe.filters.remove([pausedFilterText2]);
      browser.storage.local.remove(pausedKey);
    });
  }
});

browser.commands.onCommand.addListener((command) => {
  if (command === "toggle_pause") {
    adblockIsPaused(!adblockIsPaused());
    ServerMessages.recordGeneralMessage("pause_shortcut_used");
  }
});

export {
  allowlistTab,
  isTabTemporaryAllowlisted,
  removeAllAllowlistRulesForTab,
  adblockIsPaused,
  pausedFilterText1,
  pausedFilterText2,
};
