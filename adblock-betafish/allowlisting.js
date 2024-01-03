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

import * as ewe from '@eyeo/webext-ad-filtering-solution';

import ServerMessages from './servermessages';
import { createFilterMetaData } from './utilities/background/bg-functions';

const authorizedKeys = [
  `MIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEAuePfbm865kumeftXjlbt
J68DTXLTn0VeOgdSTqOcpADVqH0Kxz5hfLMaoKC/QhO3SmAu1yZwJZ1WP9Uyu3I5
EvJwEt7OHjJv54GhyYCtylMDCqSZgIIkUtB9PSXqFe3qyKAXACzwnLHmYIMMC1rx
bViqMD06+S4NKtzEh602/JsOOTHkXDJFQi5gGpd7Yn/r1YFG20JzU5lr0pf3dOEK
gNXiEwSRCuVSZ2+MHMtkFdP83/k59rTOfz5+ZThYmxECytD0JyY+bpDbso/XxQeL
fThNEEnSpbbeJRZQM5Lwf4D/f1wzSvyRrQiQz6Bo6TrA9DpL/BHqgUBv4O+DwhAu
8tFaaI+YWUmA1M6DRCL1aPQlFf3RB+aAf/TXFRU6enm8y/DFKWnwZja1YlApxTYT
MGnZ5hrsXZZImjcKBKwXi3JCtLkfV+osAHYrMAJPPAfECkch/ovrEUcdBEu4WsJ+
gKlL2C1/ZL+fTZc+H9qt38qba8my5XlQmhXmzXFKKyp+1pqNkQuYzzT0M8PUqtlh
z5aNu4gc/sOrQayusssUkkwISWm9yKc9pwOE+2Ax45iq2xNhjx0+rl9nc/chV21T
ZLfyePid/4N3Q7obmQ9a6trOBIF5ONyg16CK61RjacnG76AMKrVOoq9lzF2UufL8
Myzw9X8Wsw3VrjJyYbWhUtkCAwEAAQ==`,
  `MIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEAwWP4dO4iYcHpcO6lVmjC
gg/jfLM4fP+wWNaoDvMke0gQ7m9smXVtgbYXb6qzEd0aDaCRX3em+eo6bWp6ps5U
+8USRxuNH4cs6ZLjGynmZnm2TXrJScixUEw4ULq8Rdexr4ZmtT1WfUjJSFQpWWwp
e69kVR0iwwiCFRq90I/7MfJWnwgHX2tkUkVBttmXt9o0wP8th/UOIdx+0VbrqhgY
wMyo3xCUvqcSpcKsHXoLkKGlpcplE96rKg2vOqhSSQzoHMr8ZrGIn7hsPI7enVsP
D/nMiJptavVowfNZjM/rd6Iv/TYfI1JOJWUeIM+aPyhZKrvWHGdC8VO2jneNkNXj
1B6tnZy6owPt4Lgdimr0u/146WvjAL+ZK1dc4CNecOLeRINn26POCIeOpYPHGhbi
N6K1UrHpC1Oon2NW5ms9dciE242O1BrQF5j/GvNzGoV74GvnbVFZ9eyBJm9MlIOU
Sd5O2iTqWPmJ03wVSXLx+6g0fgaGHEDtKtbfhuHvDG2dIoAB7q+oKBHQJ7CIFEbI
lBnPV1v+dxDLb3DdK0Ip9wM74S2+Nf9359TCjAaWgNjiTnhBw6xpwTGn/8vzNL3p
fcEVJJt8DUfuCYV9mtKPHbj06RHnLsaXQ72x6I+ocXi8TygTjldZFx13ttJqVvju
UaTE0E4KN9Mzb/2zEYTgCzcCAwEAAQ==`,
];

/**
 * Function to be called when a valid allowlisting request was received
 *
 * @param domain - Domain to allowlist
 */
async function onAllowlisting(domain) {
  if (License.isActiveLicense()) {
    return;
  }

  await ewe.filters.add([`@@||${domain}^$document`], createFilterMetaData('web'));
}

/**
 * Remove all web based allowlisting filters
 */
async function removeWebAllowlistingFilters() {
  const allowlistingFilters = (await ewe.filters.getUserFilters())
    .filter(filter => filter.type === 'allowing');

  const allowlistingFiltersWithMetadata = await Promise.all(
    allowlistingFilters.map(async (filter) => {
      const metadata = await ewe.filters.getMetadata(filter.text);
      return { filter, metadata };
    }),
  );
  const webAllowlistingFilters = allowlistingFiltersWithMetadata
    .filter(({ metadata }) => (metadata && metadata.origin === 'web'))
    .map(({ filter }) => filter);
  return ewe.filters.remove(webAllowlistingFilters.map(filter => filter.text));
}


/**
 * Initializes module
 */
async function start() {
  ewe.allowlisting.setAuthorizedKeys(authorizedKeys);
  ewe.allowlisting.setAllowlistingCallback(onAllowlisting);

  await License.ready();
  if (License.isActiveLicense()) {
    removeWebAllowlistingFilters();
  }

  License.licenseNotifier.on('license.status.changed', () => {
    if (License.isActiveLicense()) {
      ewe.allowlisting.setAuthorizedKeys([]);
      removeWebAllowlistingFilters();
    } else {
      ewe.allowlisting.setAuthorizedKeys(authorizedKeys);
    }
  });

  ewe.allowlisting.onUnauthorized.addListener((error) => {
    ServerMessages.recordErrorMessage('one_click_allowlisting_error ', undefined, { errorMessage: error.toString() });
    // eslint-disable-next-line no-console
    console.error(error);
  });
}

start();
