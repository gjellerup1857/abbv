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
/* global browser, updateButtonUIAndContextMenus  */

import * as ewe from "@eyeo/webext-ad-filtering-solution";

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
  sessionStorageSet(domainPausedKey, domainPauses);
};

// Helper that removes any domain pause filter rules based on tab events
// Inputs:  tabId (required integer): identifier for the affected tab
//          newDomain (optional string): the current domain of the tab
// Returns: undefined
const domainPauseChangeHelper = function (tabId, newDomain) {
  // get stored domain pauses
  const storedDomainPauses = sessionStorageGet(domainPausedKey);

  // check if any of the stored domain pauses match the affected tab
  for (const aDomain in storedDomainPauses) {
    if (storedDomainPauses[aDomain] === tabId && aDomain !== newDomain) {
      // Remove the filter that white-listed the domain
      ewe.filters.remove([`@@${aDomain}$document`]);
      delete storedDomainPauses[aDomain];

      // save updated domain pauses
      saveDomainPauses(storedDomainPauses);
    }
  }
  updateButtonUIAndContextMenus();
};

// Handle the effects of a tab update event on any existing domain pauses
// Inputs:  tabId (required integer): identifier for the affected tab
//          changeInfo (required object with a url property): contains the
// new url for the tab
//          tab (optional Tab object): the affected tab
// Returns: undefined
const domainPauseNavigationHandler = function (tabId, changeInfo) {
  if (changeInfo === undefined || changeInfo.url === undefined || tabId === undefined) {
    return;
  }

  const newDomain = parseUri(changeInfo.url).host;

  domainPauseChangeHelper(tabId, newDomain);
};

// Handle the effects of a tab remove event on any existing domain pauses
// Inputs:  tabId (required integer): identifier for the affected tab
//          changeInfo (optional object): info about the remove event
// Returns: undefined
const domainPauseClosedTabHandler = function (tabId) {
  if (tabId === undefined) {
    return;
  }

  domainPauseChangeHelper(tabId);
};

// Get or set if AdBlock is domain paused for the domain of the specified tab
// Inputs:  activeTab (optional object with url and id properties): the paused tab
//          newValue (optional boolean): if true, AdBlock will be domain paused
// on the tab's domain, if false, AdBlock will not be domain paused on that domain.
// Returns: undefined if activeTab and newValue were specified; otherwise if activeTab
// is specified it returns true if domain paused, false otherwise; finally it returns
// the complete storedDomainPauses if activeTab is not specified

const adblockIsDomainPaused = function (activeTab, newValue) {
  // get stored domain pauses
  let storedDomainPauses = sessionStorageGet(domainPausedKey);

  // return the complete list of stored domain pauses if activeTab is undefined
  if (activeTab === undefined) {
    return storedDomainPauses;
  }

  // return a boolean indicating whether the domain is paused if newValue is undefined
  const activeDomain = parseUri(activeTab.url).host;
  if (newValue === undefined) {
    if (storedDomainPauses) {
      return Object.prototype.hasOwnProperty.call(storedDomainPauses, activeDomain);
    }
    return false;
  }

  // create storedDomainPauses object if needed
  if (!storedDomainPauses) {
    storedDomainPauses = {};
  }

  // set or delete a domain pause
  if (newValue === true) {
    // add a domain pause
    ewe.filters.add([`@@${activeDomain}$document`]);
    storedDomainPauses[activeDomain] = activeTab.id;
    browser.tabs.onUpdated.removeListener(domainPauseNavigationHandler);
    browser.tabs.onRemoved.removeListener(domainPauseClosedTabHandler);
    browser.tabs.onUpdated.addListener(domainPauseNavigationHandler);
    browser.tabs.onRemoved.addListener(domainPauseClosedTabHandler);
  } else {
    // remove the domain pause
    ewe.filters.remove([`@@${activeDomain}$document`]);
    delete storedDomainPauses[activeDomain];
  }

  // save the updated list of domain pauses
  saveDomainPauses(storedDomainPauses);
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

// If AdBlock was domain paused on shutdown, then unpause / remove
// all domain pause white-list entries at startup.
browser.storage.local.get(domainPausedKey).then((response) => {
  const storedDomainPauses = response[domainPausedKey];
  if (!isEmptyObject(storedDomainPauses)) {
    initialize.then(() => {
      for (const aDomain in storedDomainPauses) {
        ewe.filters.remove([`@@${aDomain}$document`]);
      }
      browser.storage.local.remove(domainPausedKey);
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
  adblockIsDomainPaused,
  adblockIsPaused,
  pausedFilterText1,
  pausedFilterText2,
  saveDomainPauses,
};
