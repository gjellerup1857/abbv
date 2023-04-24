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


import { telemetryNotifier } from './telemetry-ping';
import CtaABManager from '../../ctaabmanager';
import TelemetryBase from './telemetry-base';
import postData from '../../fetch-util';
import SURVEY from '../../survey';
import { log, chromeStorageSetHelper } from '../../utilities/background/bg-functions';

class IPMTelemetry extends TelemetryBase {
  // Called just after we ping the server, to schedule our next ping.
  scheduleNextPing() {
    return new Promise(async (resolve) => {
      const response = await browser.storage.local.get(this.totalRequestsStorageKey);
      let totalPings = response[this.totalRequestsStorageKey];
      if (typeof totalPings !== 'number' || Number.isNaN(totalPings)) {
        totalPings = 0;
      }
      totalPings += 1;
      chromeStorageSetHelper(this.totalRequestsStorageKey, totalPings);

      let delayHours;
      if (totalPings === 1) { // Ping one hour after install
        delayHours = 1;
      } else { // Then every day
        delayHours = 24;
      }
      const millis = 1000 * 60 * 60 * delayHours;
      const nextPingTime = Date.now() + millis;
      chromeStorageSetHelper(this.nextRequestTimeStorageKey, nextPingTime, (error) => {
        this.dataCorrupt = !!error;
        resolve();
      });
    });
  }

  sendPingData(pingData) {
    return new Promise(async (resolve) => {
      const response = await postData(this.hostURL, pingData).catch((error) => {
        log('ipm ping error', error);
        resolve(pingData);
      });
      if (response && response.ok) {
        telemetryNotifier.emit('ipm.ping.complete');
        const text = await response.text();
        SURVEY.maybeSurvey(text);
        CtaABManager.maybeCtaAB(text);
      } else {
        log('IPM server returned error: ', (response && response.statusText));
      }
      resolve(pingData);
    });
  }

  async pingNow() {
    const pingData = await this.getTelemetryData();
    if (!pingData.u) {
      return pingData;
    }
    // attempt to stop users that are pinging us 'a lot'
    // by checking the current ping count,
    // if the ping count is above a theshold,
    // then only ping 'occasionally'
    if (pingData.pc > 5000) {
      if (pingData.pc > 5000 && pingData.pc < 100000 && ((pingData.pc % 5000) !== 0)) {
        return pingData;
      }
      if (pingData.pc >= 100000 && ((pingData.pc % 50000) !== 0)) {
        return pingData;
      }
    }
    pingData.cmd = 'ping';
    if (browser.management && browser.management.getSelf) {
      const info = await browser.management.getSelf();
      pingData.it = info.installType.charAt(0);
    }
    return this.sendPingData(pingData);
  }
}

export default IPMTelemetry;
