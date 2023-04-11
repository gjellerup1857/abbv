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
/* global browser, channels, replacedCounts, getSettings
   recordAnonymousErrorMessage, BigInt, LocalCDN,  */

import { Prefs } from 'prefs';
import * as ewe from '../../../vendor/webext-sdk/dist/ewe-api';
import CtaABManager from '../../ctaabmanager';
import ServerMessages from '../../servermessages';
import SURVEY from '../../survey';
import SubscriptionAdapter from '../../subscriptionadapter';

import {
  chromeStorageSetHelper,
  determineUserLanguage,
  storageSet,
} from '../../utilities/background/bg-functions';

const userIdStorageKey = 'userid';
const FiftyFiveMinutes = 3300000;

class TelemetryBase {
  constructor(totalRequestsStorageKeyArg, nextRequestTimeStorageKeyArg, alarmNameArg, hostURLArg) {
    this.totalRequestsStorageKey = totalRequestsStorageKeyArg;
    this.nextRequestTimeStorageKey = nextRequestTimeStorageKeyArg;
    this.alarmName = alarmNameArg;
    this.hostURL = hostURLArg;
    this.dataCorrupt = false;
    // Get some information about the version, os, and browser
    this.version = browser.runtime.getManifest().version;
    let match = navigator.userAgent.match(/(CrOS \w+|Windows NT|Mac OS X|Linux) ([\d._]+)?/);
    this.os = (match || [])[1] || 'Unknown';
    this.osVersion = (match || [])[2] || 'Unknown';
    this.flavor = 'E'; // Chrome
    match = navigator.userAgent.match(/(?:Chrome|Version)\/([\d.]+)/);
    const edgeMatch = navigator.userAgent.match(/(?:Edg|Version)\/([\d.]+)/);
    const firefoxMatch = navigator.userAgent.match(/(?:Firefox)\/([\d.]+)/);
    if (edgeMatch) {
      this.flavor = 'CM'; // MS - Chromium Edge
      match = edgeMatch;
    } else if (firefoxMatch) {
      this.flavor = 'F'; // Firefox
      match = firefoxMatch;
    }
    this.browserVersion = (match || [])[1] || 'Unknown';
    this.firstRun = false;
    this.userId = '';
    // added calls to these two methods because the need to be
    // called in the first turn of the event loop
    this.addAlarmListener();
    this.checkIdleState();
  }

  // Check if the computer was woken up, and if there was a pending alarm
  // that should fired during the sleep, then
  // remove it, and fire the update ourselves.
  // see - https://bugs.chromium.org/p/chromium/issues/detail?id=471524
  checkIdleState() {
    browser.idle.onStateChanged.addListener(async (newState) => {
      if (newState === 'active') {
        const alarm = await browser.alarms.get(this.alarmName);
        if (alarm && Date.now() > alarm.scheduledTime) {
          await browser.alarms.clear(this.alarmName);
          await this.pingNow();
          await this.scheduleNextPing();
          await this.sleepThenPing();
        } else if (alarm) {
          // if the alarm should fire in the future,
          // re-add the alarm so it fires at the correct time
          const originalTime = alarm.scheduledTime;
          const wasCleared = await browser.alarms.clear(this.alarmName);
          if (wasCleared) {
            browser.alarms.create(this.alarmName, { when: originalTime });
          }
        }
      }
    });
  }

  addAlarmListener = () => {
    browser.alarms.onAlarm.addListener(async (alarm) => {
      if (alarm && alarm.name === this.alarmName) {
        await this.pingNow();
        await this.scheduleNextPing();
        await this.sleepThenPing();
      }
    });
  };

  // Give the user a userid if they don't have one yet.
  async loadUserID() {
    const response = await browser.storage.local.get(userIdStorageKey);
    if (!response[userIdStorageKey]) {
      this.firstRun = true;
      const timeSuffix = (Date.now()) % 1e8; // 8 digits from end of
      // timestamp
      const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789';
      const result = [];
      for (let i = 0; i < 8; i++) {
        const choice = Math.floor(Math.random() * alphabet.length);
        result.push(alphabet[choice]);
      }
      this.userId = result.join('') + timeSuffix;
      chromeStorageSetHelper(userIdStorageKey, this.userId);
    } else {
      this.userId = response[userIdStorageKey];
    }
    return this.userId;
  }

  // Clean up / remove old, unused data in localStorage
  cleanUpLocalStorage() {
    storageSet(userIdStorageKey);
    storageSet(this.totalRequestsStorageKey);
    storageSet(this.nextRequestTimeStorageKey);
  }

  async getTelemetryData() {
    const response = await browser.storage.local.get(this.totalRequestsStorageKey);
    let data = {};
    const settingsObj = getSettings();
    const totalPings = response[this.totalRequestsStorageKey] || 0;
    const themeOptionsPage = settingsObj.color_themes.options_page.replace('_theme', '');
    const themePopupMenu = settingsObj.color_themes.popup_menu.replace('_theme', '');
    let subsStr = '-1';
    if (typeof BigInt === 'function') {
      subsStr = BigInt(`0b${await SubscriptionAdapter.getSubscriptionsChecksum()}`).toString();
    }

    data = {
      u: this.userId,
      v: this.version,
      f: this.flavor,
      o: this.os,
      bv: this.browserVersion,
      ov: this.osVersion,
      ad: settingsObj.show_advanced_options ? '1' : '0',
      yt: settingsObj.youtube_channel_whitelist ? '1' : '0',
      l: determineUserLanguage(),
      pc: totalPings,
      dcv2: settingsObj.data_collection_v2 ? '1' : '0',
      ldc: settingsObj.local_data_collection ? '1' : '0',
      cdn: settingsObj.local_cdn ? '1' : '0',
      rc: await replacedCounts.getTotalAdsReplaced(),
      to: themeOptionsPage,
      tm: themePopupMenu,
      sy: settingsObj.sync_settings ? '1' : '0',
      ir: channels.isAnyEnabled() ? '1' : '0',
      cir: channels.channelGuide[channels.getIdByName('CustomChannel')].enabled ? '1' : '0',
      tca: settingsObj.twitch_channel_allowlist ? '1' : '0',
      sup: settingsObj.suppress_update_page ? '1' : '0',
      ss: settingsObj.suppress_surveys ? '1' : '0',
      sfrp: settingsObj.suppress_first_run_page ? '1' : '0',
      opm: settingsObj.onpageMessages ? '1' : '0',
      subs: subsStr,
    };

    if (typeof LocalCDN !== 'undefined') {
      data.cdnr = await LocalCDN.getRedirectCount();
      data.cdnd = await LocalCDN.getDataCount();
    } else {
      data.cdnr = 0;
      data.cdnd = 0;
    }

    // only on Chrome, Edge, or Firefox
    if ((this.flavor === 'E' || this.flavor === 'CM' || this.flavor === 'F') && Prefs.blocked_total) {
      data.b = Prefs.blocked_total;
    }
    if (browser.runtime.id) {
      data.extid = browser.runtime.id;
    }
    const subs = await SubscriptionAdapter.getAllSubscriptionsMinusText();
    if (subs) {
      const aa = subs.acceptable_ads;
      const aaPrivacy = subs.acceptable_ads_privacy;

      if (!aa && !aaPrivacy) {
        data.aa = 'u'; // Both filter lists unavailable
      } else if (aa.subscribed) {
        data.aa = '1';
      } else if (aaPrivacy.subscribed) {
        data.aa = '2';
      } else if (!aa.subscribed && !aaPrivacy.subscribed) {
        data.aa = '0'; // Both filter lists unsubscribed
      }
    }

    data.crctotal = 0;
    data.crcsnippet = 0;
    data.crcelemhideemulation = 0;
    data.crcelemhideexception = 0;
    data.crcelemhide = 0;
    data.crcallowing = 0;
    data.crcblocking = 0;
    data.crccomment = 0;
    data.crcinvalid = 0;

    const userFilters = await ewe.filters.getUserFilters();
    for (let j = 0; j < userFilters.length; j++) {
      const filter = userFilters[j];
      data[`crc${filter.type}`] += 1;
      data.crctotal += 1;
    }

    data.dc = this.dataCorrupt ? '1' : '0';
    data.st = SURVEY.types() + CtaABManager.types();
    if (browser.permissions && browser.permissions.getAll) {
      const allPermissions = await browser.permissions.getAll();
      data.dhp = allPermissions.origins && allPermissions.origins.includes('<all_urls>') ? '1' : '0';
    } else {
      data.dhp = '1';
    }
    return data;
  }

  // Return the number of milliseconds until the next scheduled ping.
  async millisTillNextPing() {
    // If we've detected data corruption issues,
    // then default to a 55 minute ping interval
    if (this.dataCorrupt) {
      return FiftyFiveMinutes;
    }
    const response = await browser.storage.local.get(this.nextRequestTimeStorageKey);
    let nextPingTime = response[this.nextRequestTimeStorageKey];
    if (typeof nextPingTime !== 'number' || Number.isNaN(nextPingTime)) {
      nextPingTime = 0;
    }
    if (nextPingTime === 0 && this.firstRun) {
      return (1000 * 60);
    }
    // if we don't have a 'next ping time', or it's not a valid number,
    // default to 55 minute ping interval
    if (
      typeof nextPingTime !== 'number'
      || nextPingTime === 0
      || Number.isNaN(nextPingTime)
    ) {
      return FiftyFiveMinutes;
    }
    return (nextPingTime - Date.now());
  }

  async sleepThenPing() {
    const delay = await this.millisTillNextPing();
    browser.alarms.create(this.alarmName, { delayInMinutes: (delay / 1000 / 60) });
  }


  async start() {
    await this.loadUserID();
    // Do 'stuff' when we're first installed...
    // - send a message
    const response = await browser.storage.local.get(this.totalRequestsStorageKey);
    if (!response[this.totalRequestsStorageKey]) {
      if (browser.management && browser.management.getSelf) {
        const info = await browser.management.getSelf();
        if (info) {
          ServerMessages.recordGeneralMessage(`new_install_${info.installType}`);
        } else {
          ServerMessages.recordGeneralMessage('new_install');
        }
      } else {
        ServerMessages.recordGeneralMessage('new_install');
      }
    }
    // This will sleep, then ping, then schedule a new ping, then
    // call itself to start the process over again.
    await this.sleepThenPing();
    this.cleanUpLocalStorage();
  }

  async untilLoaded() {
    await this.loadUserID();
    return this.userId;
  }

  get browser() {
    return ({
      E: 'Chrome',
      CM: 'Edge',
      F: 'Firefox',
    })[this.flavor];
  }
}

export default TelemetryBase;
