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
/* global browser, isAllowlistFilter */

import * as ewe from "@eyeo/webext-ad-filtering-solution";
import { FilterOrigin } from "../../../src/filters/shared";
import { createFilterMetaData } from "../../utilities/background/bg-functions";
import { Prefs } from "~/alias/prefs";
import { initialize } from "~/alias/subscriptionInit";
import ServerMessages from "~/servermessages";

import {
  chromeStorageSetHelper,
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

const domainPausedKey = "domainPaused";

// Helper that saves the domain pauses
// Inputs:  domainPauses (required object): domain pauses to save
// Returns: undefined
const saveDomainPauses = function (domainPauses) {
  chromeStorageSetHelper(domainPausedKey, domainPauses);
};

// Get or set if AdBlock is domain paused for the domain of the specified tab
// Inputs:  activeTab (optional object with url and id properties): the paused tab
//          newValue (optional boolean): if true, AdBlock will be domain paused
//          sessionOnly (optional boolean): if true, the domain pause will only last for the session
// on the tab's domain, if false, AdBlock will not be domain paused on that domain.
// Returns: undefined if activeTab and newValue were specified; otherwise if activeTab
// is specified it returns true if domain paused, false otherwise; finally it returns
// the complete storedDomainPauses if activeTab is not specified
const adblockIsDomainPaused = async function (activeTab, newValue, origin = FilterOrigin.popup) {
  // get stored domain pauses
  const response = await browser.storage.local.get(domainPausedKey);
  const storedDomainPauses = response[domainPausedKey];

  // return the complete list of stored domain pauses if activeTab is undefined
  if (activeTab === undefined) {
    return storedDomainPauses;
  }

  // return a boolean indicating whether the domain is paused if newValue is undefined
  let activeDomain = parseUri(activeTab.url).host;
  activeDomain = activeDomain.replace(/^www\./, "");
  if (newValue === undefined) {
    if (storedDomainPauses) {
      return Object.prototype.hasOwnProperty.call(storedDomainPauses, activeDomain);
    }
    return false;
  }

  // set or delete a domain pause
  if (newValue === true) {
    // add a domain pause
    const autoExtendMs = Prefs.get("allowlisting_auto_extend_ms");
    const metadata = {
      ...createFilterMetaData(origin),
      expiresAt: Date.now() + autoExtendMs,
      autoExtendMs,
    };
    ewe.filters.add(createDomainAllowlistRule(activeDomain), metadata);
  } else {
    // remove the domain pause
    ewe.filters.remove(createDomainAllowlistRule(activeDomain));
  }
  return undefined;
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

// If Adblock was paused on the domain, and the allowlist filter expired,
// refresh the paused domains map to reflect the change.
ewe.filters.onRemoved.addListener(async (filter) => {
  if (!isAllowlistFilter(filter.text)) {
    return;
  }

  // get stored domain pauses
  const domains = await adblockIsDomainPaused();
  if (!domains) {
    return;
  }

  for (const domain in domains) {
    if (createDomainAllowlistRule(domain) === filter.text) {
      delete domains[domain];
      saveDomainPauses(domains);
      return;
    }
  }
});

// If an allowlist rule is added with the "expiresByTabId" metadata
// property, add the host to the stored domain pause object
// This allows other functionality within AdBlock to correctly
// detect the new temporary allowlist rules (and function correctly)
ewe.filters.onAdded.addListener(async (filter) => {
  if (!isAllowlistFilter(filter.text)) {
    return;
  }
  const metadata = await ewe.filters.getMetadata(filter.text);
  if (!metadata || !metadata.expiresByTabId) {
    return;
  }
  const tab = await browser.tabs.get(metadata.expiresByTabId).catch(() => {
    return null;
  });
  if (!tab || !tab.url) {
    return;
  }
  const tabURL = new URL(tab?.url);
  const host = tabURL.hostname.replace(/^www\./, "");
  const domains = (await adblockIsDomainPaused()) || {};
  domains[host] = metadata.expiresByTabId;
  saveDomainPauses(domains);
});

browser.commands.onCommand.addListener((command) => {
  if (command === "toggle_pause") {
    adblockIsPaused(!adblockIsPaused());
    ServerMessages.recordGeneralMessage("pause_shortcut_used");
  }
});

export {
  adblockIsDomainPaused,
  adblockIsPaused,
  pausedFilterText1,
  pausedFilterText2,
  saveDomainPauses,
};
