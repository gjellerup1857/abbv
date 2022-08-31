// Allows interaction with the server to track install rate
// and log messages.


/* For ESLint: List any global identifiers used in this file below */
/* global browser, require, log, determineUserLanguage, channels,
   replacedCounts, chromeStorageSetHelper, recordAnonymousErrorMessage,
   BigInt, LocalCDN, storageSet */

import { Prefs } from 'prefs';
import * as ewe from '../vendor/webext-sdk/dist/ewe-api';

import { EventEmitter } from '../vendor/adblockplusui/adblockpluschrome/lib/events';
import CtaABManager from './ctaabmanager';
import SubscriptionAdapter from './subscriptionadapter';
import { getSettings } from './settings';
import ServerMessages from './servermessages';
import postData from './fetch-util';
import SURVEY from './survey';


export const telemetryNotifier = new EventEmitter();

export const TELEMETRY = (function exportStats() {
  const userIDStorageKey = 'userid';
  const totalPingStorageKey = 'total_pings';
  const nextPingTimeStorageKey = 'next_ping_time';
  const statsUrl = 'https://ping.getadblock.com/stats/';
  const FiftyFiveMinutes = 3300000;
  let dataCorrupt = false;

  // Get some information about the version, os, and browser
  const { version } = browser.runtime.getManifest();
  let match = navigator.userAgent.match(/(CrOS \w+|Windows NT|Mac OS X|Linux) ([\d._]+)?/);
  const os = (match || [])[1] || 'Unknown';
  const osVersion = (match || [])[2] || 'Unknown';
  let flavor = 'E'; // Chrome
  match = navigator.userAgent.match(/(?:Chrome|Version)\/([\d.]+)/);
  const edgeMatch = navigator.userAgent.match(/(?:Edg|Version)\/([\d.]+)/);
  const firefoxMatch = navigator.userAgent.match(/(?:Firefox)\/([\d.]+)/);
  if (edgeMatch) {
    flavor = 'CM'; // MS - Chromium Edge
    match = edgeMatch;
  } else if (firefoxMatch) {
    flavor = 'F'; // Firefox
    match = firefoxMatch;
  }
  const browserVersion = (match || [])[1] || 'Unknown';

  const firstRun = false;

  let userID;

  // Give the user a userid if they don't have one yet.
  function readUserIDPromisified() {
    return new Promise(
      ((resolve) => {
        browser.storage.local.get(TELEMETRY.userIDStorageKey).then((response) => {
          if (!response[TELEMETRY.userIDStorageKey]) {
            TELEMETRY.firstRun = true;
            const timeSuffix = (Date.now()) % 1e8; // 8 digits from end of
            // timestamp
            const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789';
            const result = [];
            for (let i = 0; i < 8; i++) {
              const choice = Math.floor(Math.random() * alphabet.length);
              result.push(alphabet[choice]);
            }
            userID = result.join('') + timeSuffix;
            chromeStorageSetHelper(TELEMETRY.userIDStorageKey, userID);
          } else {
            userID = response[TELEMETRY.userIDStorageKey];
          }
          resolve(userID);
        });
      }),
    );
  }

  // Clean up / remove old, unused data in localStorage
  function cleanUpLocalStorage() {
    storageSet(TELEMETRY.userIDStorageKey);
    storageSet(TELEMETRY.totalPingStorageKey);
    storageSet(TELEMETRY.nextPingTimeStorageKey);
  }

  const getPingData = function (callbackFN) {
    if (!callbackFN && (typeof callbackFN !== 'function')) {
      return;
    }
    browser.storage.local.get(TELEMETRY.totalPingStorageKey).then(async (response) => {
      let data = {};
      // The following try/catch block is a temporary (hopefully)
      // so that we can research why there's been a drop in users sending
      // ping data.
      try {
        const settingsObj = getSettings();
        const totalPings = response[TELEMETRY.totalPingStorageKey] || 0;
        const themeOptionsPage = settingsObj.color_themes.options_page.replace('_theme', '');
        const themePopupMenu = settingsObj.color_themes.popup_menu.replace('_theme', '');
        let subsStr = '-1';
        if (typeof BigInt === 'function') {
          subsStr = BigInt(`0b${SubscriptionAdapter.getSubscriptionsChecksum()}`).toString();
        }

        data = {
          u: userID,
          v: version,
          f: flavor,
          o: os,
          bv: browserVersion,
          ov: osVersion,
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
        if ((flavor === 'E' || flavor === 'CM' || flavor === 'F') && Prefs.blocked_total) {
          data.b = Prefs.blocked_total;
        }
        if (browser.runtime.id) {
          data.extid = browser.runtime.id;
        }
        const subs = SubscriptionAdapter.getAllSubscriptionsMinusText();
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
          data.dcv = subs['distraction-control-video'].subscribed ? '1' : '0';
          data.dcs = subs['distraction-control-survey'].subscribed ? '1' : '0';
          data.dcn = subs['distraction-control-newsletter'].subscribed ? '1' : '0';
          data.dcp = subs['distraction-control-push'].subscribed ? '1' : '0';
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

        data.dc = dataCorrupt ? '1' : '0';
      } catch (err) {
        recordAnonymousErrorMessage('ping_error', null, { error: JSON.stringify(err, Object.getOwnPropertyNames(err)) });
      }
      SURVEY.types((res) => {
        data.st = res + CtaABManager.types();
        if (browser.permissions && browser.permissions.getAll) {
          browser.permissions.getAll().then((allPermissions) => {
            data.dhp = allPermissions.origins && allPermissions.origins.includes('<all_urls>') ? '1' : '0';
            callbackFN(data);
          });
        } else {
          data.dhp = '1';
          callbackFN(data);
        }
      });
    });
  };

  // Tell the server we exist.
  const pingNow = function () {
    let pingData = {};
    return new Promise((resolve) => {
      const handlePingResponse = function (responseData) {
        SURVEY.maybeSurvey(responseData);
        CtaABManager.maybeCtaAB(responseData);
        resolve(pingData);
      };

      getPingData((data) => {
        pingData = data;

        if (!pingData.u) {
          return;
        }
        // attempt to stop users that are pinging us 'alot'
        // by checking the current ping count,
        // if the ping count is above a theshold,
        // then only ping 'occasionally'
        if (pingData.pc > 5000) {
          if (pingData.pc > 5000 && pingData.pc < 100000 && ((pingData.pc % 5000) !== 0)) {
            return;
          }
          if (pingData.pc >= 100000 && ((pingData.pc % 50000) !== 0)) {
            return;
          }
        }
        pingData.cmd = 'ping';
        const sendPingData = function () {
          postData(statsUrl, pingData).then(async (response) => {
            if (response.ok) {
              telemetryNotifier.emit('ping.complete');
              const text = await response.text();
              handlePingResponse(text);
            } else {
              ServerMessages.sendMessageToBackupLogServer('fetch_error',  response.statusText);
              log('ping server returned error: ', response.statusText);
            }
          })
          // Send any network errors during the ping fetch to a dedicated log server
          // to help us determine why there's been a drop in ping requests
          // See https://gitlab.com/adblockinc/ext/adblock/adblock/-/issues/136
            .catch((error) => {
              ServerMessages.sendMessageToBackupLogServer('fetch_error', error.toString());
              log('ping server returned error: ', error);
            });
        };
        if (browser.management && browser.management.getSelf) {
          browser.management.getSelf().then((info) => {
            pingData.it = info.installType.charAt(0);
            sendPingData();
            telemetryNotifier.emit('ping.complete');
          });
        } else {
          sendPingData();
          telemetryNotifier.emit('ping.complete');
        }


        if (typeof LocalCDN !== 'undefined') {
          LocalCDN.getMissedVersions().then((missedVersions) => {
            if (missedVersions) {
              ServerMessages.recordGeneralMessage('cdn_miss_stats', undefined, { cdnm: missedVersions });
            }
          });
        }
      });
    });
  };

  // Called just after we ping the server, to schedule our next ping.
  const scheduleNextPing = function () {
    browser.storage.local.get(TELEMETRY.totalPingStorageKey).then((response) => {
      let totalPings = response[TELEMETRY.totalPingStorageKey];
      if (typeof totalPings !== 'number' || Number.isNaN(totalPings)) {
        totalPings = 0;
      }
      totalPings += 1;
      // store in redundant locations
      chromeStorageSetHelper(TELEMETRY.totalPingStorageKey, totalPings);

      let delayHours;
      if (totalPings === 1) { // Ping one hour after install
        delayHours = 1;
      } else if (totalPings < 9) { // Then every day for a week
        delayHours = 24;
      } else { // Then weekly forever
        delayHours = 24 * 7;
      }

      const millis = 1000 * 60 * 60 * delayHours;
      const nextPingTime = Date.now() + millis;
      chromeStorageSetHelper(TELEMETRY.nextPingTimeStorageKey, nextPingTime, (error) => {
        if (error) {
          dataCorrupt = true;
        } else {
          dataCorrupt = false;
        }
      });
    });
  };

  // Return the number of milliseconds until the next scheduled ping.
  const millisTillNextPing = function (callbackFN) {
    if (!callbackFN || (typeof callbackFN !== 'function')) {
      return;
    }
    // If we've detected data corruption issues,
    // then default to a 55 minute ping interval
    if (dataCorrupt) {
      callbackFN(FiftyFiveMinutes);
      return;
    }
    // Wait 10 seconds to allow the previous 'set' to finish
    window.setTimeout(() => {
      browser.storage.local.get(TELEMETRY.nextPingTimeStorageKey).then((response) => {
        let nextPingTime = response[TELEMETRY.nextPingTimeStorageKey];
        if (typeof nextPingTime !== 'number' || Number.isNaN(nextPingTime)) {
          nextPingTime = 0;
        }
        // if this is the first time we've run (just installed), millisTillNextPing is 0
        if (nextPingTime === 0 && TELEMETRY.firstRun) {
          callbackFN(0);
          return;
        }
        // if we don't have a 'next ping time', or it's not a valid number,
        // default to 55 minute ping interval
        if (
          typeof nextPingTime !== 'number'
          || nextPingTime === 0
          || Number.isNaN(nextPingTime)
        ) {
          callbackFN(FiftyFiveMinutes);
          return;
        }
        callbackFN(nextPingTime - Date.now());
      }); // end of get
    }, 10000);
  };

  return {
    userIDStorageKey,
    totalPingStorageKey,
    nextPingTimeStorageKey,
    firstRun, // True if AdBlock was just installed.
    userId() {
      return userID;
    },
    version,
    flavor,
    browser: ({
      E: 'Chrome',
      CM: 'Edge',
      F: 'Firefox',
    })[flavor],
    browserVersion,
    os,
    osVersion,
    pingNow,
    statsUrl,
    untilLoaded(callback) {
      readUserIDPromisified().then((resUserId) => {
        if (typeof callback === 'function') {
          callback(resUserId);
        }
      });
    },
    // Ping the server when necessary.
    startPinging() {
      function sleepThenPing() {
        millisTillNextPing((delay) => {
          window.setTimeout(() => {
            pingNow();
            scheduleNextPing();
            sleepThenPing();
          }, delay);
        });
      }

      readUserIDPromisified().then(() => {
        // Do 'stuff' when we're first installed...
        // - send a message
        browser.storage.local.get(TELEMETRY.totalPingStorageKey).then((response) => {
          if (!response[TELEMETRY.totalPingStorageKey]) {
            if (browser.management && browser.management.getSelf) {
              browser.management.getSelf().then((info) => {
                if (info) {
                  ServerMessages.recordGeneralMessage(`new_install_${info.installType}`);
                } else {
                  ServerMessages.recordGeneralMessage('new_install');
                }
              });
            } else {
              ServerMessages.recordGeneralMessage('new_install');
            }
          }
        });
      });
      // This will sleep, then ping, then schedule a new ping, then
      // call itself to start the process over again.
      sleepThenPing();
    },
  };
}());
