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
/* global License*/

import * as ewe from "@eyeo/webext-ad-filtering-solution";

import { Prefs } from "~/alias/prefs";
import ServerMessages from "./servermessages";
import { createFilterMetaData } from "./utilities/background/bg-functions";

const trustedSoftonicDomains = [
  "softonic-ar.com",
  "softonic-id.com",
  "softonic-th.com",
  "softonic.cn",
  "softonic.com",
  "softonic.com.br",
  "softonic.com.tr",
  "softonic.jp",
  "softonic.kr",
  "softonic.nl",
  "softonic.pl",
  "softonic.ru",
  "softonic.vn",
  "softoniclabs.com",
];

function getAllowlistingDomain(hostname) {
  // Softonic generates subdomains for various software
  // (e.g., chrome.softonic.com, minecraft.softonic.com).
  // Allowlisting the subdomains of the trusted Softonic domains list
  // is intended to affect other subdomains.
  if (hostname.includes("softonic")) {
    const domainParts = hostname.split(".");
    while (domainParts.length > 0) {
      const subdomain = domainParts.join(".");
      if (trustedSoftonicDomains.includes(subdomain)) {
        return subdomain;
      }

      domainParts.shift();
    }
  }

  return hostname.replace(/^www\./, "");
}

/**
 * Function to be called when a valid allowlisting request was received
 *
 * @param domain - Domain to allowlist
 * @param {?Object} options Additional options for the allowlisting.
 * @param {Number} [options.expiresAt] The timestamp when the filter should
 *  expire (allowed 1 day - 365 days in the future).
 *
 */
async function onAllowlisting(domain, options) {
  if (License.isActiveLicense()) {
    return;
  }

  const host = getAllowlistingDomain(domain);
  const metadata = createFilterMetaData("web");
  if (options && options.expiresAt) {
    metadata.expiresAt = options.expiresAt;
  }

  await ewe.filters.add([`@@||${host}^$document`], metadata);
}

/**
 * Remove all web based allowlisting filters
 */
async function removeWebAllowlistingFilters() {
  const allowlistingFilters = (await ewe.filters.getUserFilters()).filter(
    (filter) => filter.type === "allowing",
  );

  const allowlistingFiltersWithMetadata = await Promise.all(
    allowlistingFilters.map(async (filter) => {
      const metadata = await ewe.filters.getMetadata(filter.text);
      return { filter, metadata };
    }),
  );
  const webAllowlistingFilters = allowlistingFiltersWithMetadata
    .filter(({ metadata }) => metadata && metadata.origin === "web")
    .map(({ filter }) => filter);
  return ewe.filters.remove(webAllowlistingFilters.map((filter) => filter.text));
}

/**
 * Initializes module
 */
async function start() {
  await Prefs.untilLoaded;

  const authorizedKeys = Prefs.get("allowlisting_authorizedKeys");
  ewe.allowlisting.setAuthorizedKeys(authorizedKeys);
  ewe.allowlisting.setAllowlistingCallback(onAllowlisting);

  await License.ready();
  if (License.isActiveLicense()) {
    removeWebAllowlistingFilters();
  }

  License.licenseNotifier.on("license.status.changed", () => {
    if (License.isActiveLicense()) {
      ewe.allowlisting.setAuthorizedKeys([]);
      removeWebAllowlistingFilters();
    } else {
      ewe.allowlisting.setAuthorizedKeys(authorizedKeys);
    }
  });

  ewe.allowlisting.onUnauthorized.addListener((error) => {
    ServerMessages.recordErrorMessage("one_click_allowlisting_error ", undefined, {
      errorMessage: error.toString(),
    });
    // eslint-disable-next-line no-console
    console.error(error);
  });
}

start();
