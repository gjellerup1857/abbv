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

/**
 * This script will be injected into the main world of a the top-level frame
 * of a website.
 *
 * It will use the TCF API to detect cookie banner. For more on the TCF API,
 * please see https://github.com/InteractiveAdvertisingBureau/GDPR-Transparency-and-Consent-Framework/blob/master/TCFv2/IAB%20Tech%20Lab%20-%20CMP%20API%20v2.md
 */
export function setupDetection() {
  /**
   * The name of the key where the TCF API is going to be found at.
   */
  const tcfKeyName = "__tcfapi";

  /**
   * The points in time after this script is executed when we check for the
   * TCF API. Values are in ms.
   */
  const detectionPoints = [500, 1000, 2000];

  /**
   * Whether we are done with looking for the TCF API and setting up listeners.
   */
  let isSetupComplete = false;

  /**
   * Checks whether the TCF API is available.
   *
   * @returns Whether the TFC API is available
   */
  function hasTCF() {
    return typeof window[tcfKeyName] !== "undefined";
  }

  /**
   * Sets up the TCF API listener
   */
  function setupListener() {
    try {
      window[tcfKeyName]?.("addEventListener", 2, handleTCFEvent);
      isSetupComplete = true;
    } catch (_) {}
  }

  /**
   * Takes an TCF event and checks if it is an event that means that a cookie
   * consent banner has just been shown.
   *
   * @param tcData The TCData passed from the API
   * @param success Whether the API could process our request
   */
  function handleTCFEvent(tcData, success) {
    if (!success || tcData.eventStatus !== "cmpuishown") {
      return;
    }

    // trigger custom event
    window[tcfKeyName]?.("removeEventListener", 2, () => {}, tcData.listenerId);
  }

  /**
   * Checks if the TCF API is present, and if so, sets up a listener for TCF
   * events.
   */
  function detectCookieBanners() {
    if (!hasTCF()) {
      return;
    }

    setupListener();
  }

  /**
   * Starts the cookie banner detection feature
   */
  function start() {
    detectionPoints.forEach((delay) => {
      const timerId = setTimeout(() => {
        if (isSetupComplete) {
          return;
        }
        detectCookieBanners();
        clearTimeout(timerId);
      }, delay);
    });
  }

  start();
}
