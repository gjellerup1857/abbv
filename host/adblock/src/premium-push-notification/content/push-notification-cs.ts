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

/**
 * Add the deny-notifications module to the web page so it can run in the world context
 */
const addDenyPushNotificationScript = function (): void {
  try {
    const scriptElem = document.createElement("script");
    scriptElem.type = "module";
    scriptElem.src = browser.runtime.getURL("adblock-deny-push-notifications-requests.js");
    (document.head || document.documentElement).appendChild(scriptElem);
  } catch (err) {
    /* eslint-disable-next-line no-console */
    console.error(err);
  }
};

addDenyPushNotificationScript();
