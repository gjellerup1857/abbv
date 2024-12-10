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
/* global browser, updateButtonUIAndContextMenus, isAllowlistFilter */

import * as ewe from "@eyeo/webext-ad-filtering-solution";
import { FilterOrigin } from "../../../src/filters/shared";
import { createFilterMetaData } from "../../utilities/background/bg-functions";
import { Prefs } from "~/alias/prefs";
import { initialize } from "~/alias/subscriptionInit";
import ServerMessages from "~/servermessages";

import {
  chromeStorageSetHelper,
  isEmptyObject,
  parseUri,
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

// Adds a temporary, allowlist rule for the specified tab
// Inputs:  Tab: the tab to be allowlisted paused tab
//          origin(string): the origin of the allowlist rule
const addTemporaryAllowlistForTab = async (tab, origin = FilterOrigin.popup) => {
  // add a temporary allowlist rule for the tab
  const autoExtendMs = Prefs.get("allowlisting_auto_extend_ms");
  const metadata = {
    ...createFilterMetaData(origin),
    expiresAt: Date.now() + autoExtendMs,
    autoExtendMs,
    expiresByTabId: tab.id,
  };
  const domain = parseUri(tab.url).host;
  await ewe.filters.add(createDomainAllowlistRule(domain), metadata);
};

// Removes a temporary, allowlist rule for the specified tab
// Inputs:  Tab: the tab to be allowlisted paused tab
const removeTemporaryAllowlistForTab = async (tab) => {
  const filters = await ewe.filters.getAllowingFilters(tab.id);
  for (const i = 0; i < filters.length; i++) {
    const filter = filters[i];
    const metadata = await namespace.getMetadata(filter.text);
    if (metadata.expiresByTabId === tab.id) {
      await ewe.filters.remove(filter.text);
    }
  }
};

// return a boolean indicating whether the tab is paused
const isTabTemporaryAllowlisted = async (tab) => {
  const filters = await ewe.filters.getAllowingFilters(tab.id);
  const metaDataMatch = false;
  for (const i = 0; i < filters.length && !metaDataMatch; i++) {
    const filter = filters[i];
    const metadata = await namespace.getMetadata(filter.text);
    metaDataMatch = metadata.expiresByTabId === tab.id;
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
  addTemporaryAllowlistForTab,
  isTabTemporaryAllowlisted,
  removeTemporaryAllowlistForTab,
  adblockIsPaused,
  pausedFilterText1,
  pausedFilterText2,
};
