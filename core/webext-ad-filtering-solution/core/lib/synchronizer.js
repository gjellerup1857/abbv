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

/** @module */

"use strict";

/**
 * @file Manages synchronization of filter subscriptions.
 */

const {Prefs} = require("prefs");

const {MILLIS_IN_SECOND, MILLIS_IN_MINUTE, MILLIS_IN_HOUR,
       MILLIS_IN_DAY} = require("./time");
const {Downloader, Downloadable} = require("./downloader");
const {Filter} = require("./filterClasses");
const {filterNotifier} = require("./filterNotifier");
const {Subscription,
       CountableSubscription} = require("./subscriptionClasses");
const {analytics} = require("./analytics");
const {parseFilterList} = require("./filters/lists.js");
const {recommendations} = require("./recommendations");

const INITIAL_DELAY = 1 * MILLIS_IN_MINUTE;
const CHECK_INTERVAL = 1 * MILLIS_IN_HOUR;
const DEFAULT_EXPIRATION_INTERVAL = 5 * MILLIS_IN_DAY;

let getPreferredMillis = (field, fallback) =>
                          field in Prefs ? Prefs[field] : fallback;

/**
 * Downloads filter subscriptions whenever necessary.
 */
class Synchronizer {
  /**
   * Construct a new synchronizer.
   * @param {FilterStorage} [filterStorage] The associated filter storage.
   */
  constructor(filterStorage) {
    if (filterStorage == null || typeof filterStorage != "object") {
      throw Error("filterStorage must be a valid object");
    }

    /**
     * Whether the downloading of subscriptions has been started.
     * @private
     */
    this._started = false;

    /**
     * The object providing actual downloading functionality.
     * @type {module:downloader.Downloader}
     */
    this._downloader = new Downloader(this._getDownloadables.bind(this));

    this._downloader.onExpirationChange = this._onExpirationChange.bind(this);
    this._downloader.onDownloadStarted = this._onDownloadStarted.bind(this);
    this._downloader.onDownloadSuccess = this._onDownloadSuccess.bind(this);
    this._downloader.onDownloadError = this._onDownloadError.bind(this);

    this._filterStorage = filterStorage;

    // allow subscription to update themselves once re-enabled if needed.
    CountableSubscription.useSynchronizer(this);
  }

  /**
   * Starts downloading subscriptions.
   *
   * No subscriptions are downloaded until this function has been called at
   * least once.
   */
  start() {
    if (this._started) {
      return;
    }

    this._downloader.scheduleChecks(
      getPreferredMillis("subscriptions_check_interval", CHECK_INTERVAL),
      getPreferredMillis("subscriptions_initial_delay", INITIAL_DELAY)
    );
    this._started = true;
  }

  /**
   * Clear any further downloader scheduled check and set its internal state
   * as not started.
   */
  stop() {
    this._started = false;
    this._downloader.unscheduleChecks();
  }

  /**
   * Checks whether a subscription is currently being downloaded.
   * @param {string} url  URL of the subscription
   * @returns {boolean}
   */
  isExecuting(url) {
    return this._downloader.isDownloading(url);
  }

  /**
   * Starts the download of a subscription if it is downloadable.
   *
   * @param {module:subscriptionClasses.CountableSubscription} subscription
   *   Subscription to be downloaded
   * @param {boolean} manual
   *   `true` for a manually started download (should not trigger fallback
   *   requests)
   */
  execute(subscription, manual) {
    this._downloader.download(this._getDownloadable(subscription, manual));
  }

  /**
   * Yields `{@link module:downloader.Downloadable Downloadable}` instances for
   * all subscriptions that can be downloaded.
   * @yields {module:downloader.Downloadable}
   */
  *_getDownloadables() {
    if (!Prefs.subscriptions_autoupdate) {
      return;
    }

    for (let subscription of this._filterStorage.subscriptions()) {
      if (subscription instanceof CountableSubscription) {
        yield this._getDownloadable(subscription, false);
      }
    }
  }

  /**
   * Creates a `{@link module:downloader.Downloadable Downloadable}` instance
   * for a subscription.
   * @param {module:subscriptionClasses.Subscription} subscription
   * @param {boolean} manual
   * @returns {module:downloader.Downloadable}
   */
  _getDownloadable(subscription, manual) {
    let {url, lastDownload, lastSuccess, lastCheck, version, softExpiration,
         expires, downloadCount, disabled, downloadable,
         countable, diffURL, lastModified} = subscription;

    let result;

    // If this is a DiffUpdatable subscription, use the diff URL and set the
    // original URL. We need to set this original URL or it will not be
    // available in the download success callback.
    if (diffURL) {
      result = new Downloadable(diffURL);
      result.originalUrl = url;
    }
    else {
      result = new Downloadable(url);
    }

    if (analytics.isTrusted(url)) {
      result.firstVersion = analytics.getFirstVersion();
    }

    if (lastDownload != lastSuccess) {
      result.lastError = lastDownload * MILLIS_IN_SECOND;
    }

    result.lastCheck = lastCheck * MILLIS_IN_SECOND;
    result.lastVersion = version;
    result.softExpiration = softExpiration * MILLIS_IN_SECOND;
    result.hardExpiration = expires * MILLIS_IN_SECOND;
    result.manual = manual;
    result.downloadCount = downloadCount;
    result.disabled = disabled;
    result.lastModified = lastModified;
    if (!diffURL && (disabled || (countable && !downloadable))) {
      result.method = "HEAD";
    }

    return result;
  }

  _onExpirationChange(downloadable) {
    let subscription = Subscription.fromURL(
      downloadable.originalUrl || downloadable.url);
    subscription.lastCheck = Math.round(
      downloadable.lastCheck / MILLIS_IN_SECOND
    );
    subscription.softExpiration = Math.round(
      downloadable.softExpiration / MILLIS_IN_SECOND
    );
    subscription.expires = Math.round(
      downloadable.hardExpiration / MILLIS_IN_SECOND
    );
  }

  _onDownloadStarted(downloadable) {
    let subscription = Subscription.fromURL(
      downloadable.originalUrl || downloadable.url);
    filterNotifier.emit("subscription.downloading", subscription);
  }

  _onDownloadSuccess(downloadable, responseText, errorCallback,
                     redirectCallback) {
    // if it has originalUrl, it means that it's a diffUpdatable subscription
    let isDiffUpdatable = (downloadable.originalUrl != null);

    let subscription = Subscription.fromURL(downloadable.redirectURL ||
      (isDiffUpdatable ? downloadable.originalUrl : downloadable.url));
    filterNotifier.emit("subscription.downloading", subscription);

    let isHEAD = downloadable.method === "HEAD";

    let {error, lines, params,
         minVersion} = isHEAD || isDiffUpdatable ?
           {params: {}} : parseFilterList(responseText);

    if (error) {
      return errorCallback(error);
    }

    if (params.redirect) {
      return redirectCallback(params.redirect);
    }

    // Handle redirects
    if (downloadable.redirectURL &&
        downloadable.redirectURL != downloadable.url) {
      let oldSubscription = Subscription.fromURL(
        downloadable.originalUrl || downloadable.url);
      subscription.title = oldSubscription.title;
      subscription.disabled = oldSubscription.disabled;
      subscription.lastCheck = oldSubscription.lastCheck;

      let listed = this._filterStorage.hasSubscription(oldSubscription);
      if (listed) {
        this._filterStorage.removeSubscription(oldSubscription);
      }

      Subscription.knownSubscriptions.delete(oldSubscription.url);

      if (listed) {
        this._filterStorage.addSubscription(subscription);
      }
    }

    // The download actually succeeded
    subscription.lastSuccess = subscription.lastDownload = Math.round(
      Date.now() / MILLIS_IN_SECOND
    );
    subscription.downloadStatus = "synchronize_ok";
    subscription.downloadCount = downloadable.downloadCount;
    subscription.errors = 0;

    // Process parameters
    if (params.homepage) {
      let url;
      try {
        url = new URL(params.homepage);
      }
      catch (e) {
        url = null;
      }

      if (url && (url.protocol == "http:" || url.protocol == "https:")) {
        subscription.homepage = url.href;
      }
    }

    if (params.title) {
      subscription.title = params.title;
      subscription.fixedTitle = true;
    }
    else {
      subscription.fixedTitle = false;
    }

    if (params.version) {
      subscription.version = parseInt(params.version, 10);
    }
    else {
      subscription.version = isHEAD || isDiffUpdatable ?
        downloadable.lastVersion : 0;
    }

    if ((params.version || isDiffUpdatable) &&
        analytics.isTrusted(downloadable.redirectURL || downloadable.url)) {
      analytics.recordVersion(subscription.version.toString());
    }

    if (subscription.type) {
      subscription.abtest = params.abtest;
    }

    let headExpInterval = getPreferredMillis(
      "subscriptions_head_expiration_interval",
      MILLIS_IN_DAY
    );

    let defaultExpInterval = getPreferredMillis(
      "subscriptions_default_expiration_interval",
      DEFAULT_EXPIRATION_INTERVAL
    );

    let expirationInterval = isHEAD ? headExpInterval : defaultExpInterval;

    if (isDiffUpdatable) {
      params.expires =
        [...recommendations()].find(
          recommendation => recommendation.url === downloadable.originalUrl
        ).expires;
    }
    if (params.expires) {
      let match = /^(\d+)\s*(h)?/.exec(params.expires);
      if (match) {
        let interval = parseInt(match[1], 10);
        if (match[2]) {
          expirationInterval = interval * MILLIS_IN_HOUR;
        }
        else {
          expirationInterval = interval * MILLIS_IN_DAY;
        }
      }
    }

    let [
      softExpiration,
      hardExpiration
    ] = this._downloader.processExpirationInterval(expirationInterval);
    subscription.softExpiration = Math.round(softExpiration / MILLIS_IN_SECOND);
    subscription.expires = Math.round(hardExpiration / MILLIS_IN_SECOND);

    if (minVersion) {
      subscription.requiredVersion = minVersion;
    }
    else {
      delete subscription.requiredVersion;
    }

    // In case of HEAD request (disabled subscription) notify an update so that
    // the last version of the subscription will be stored for the next time.
    if (isHEAD) {
      filterNotifier.emit("subscription.updated", subscription);
    }
    else if (isDiffUpdatable) {
      const responseObject = JSON.parse(responseText);
      const added = responseObject.filters.add;
      const removed = responseObject.filters.remove;

      filterNotifier.emit("subscription.diffReceived", subscription, {added, removed});
    }
    else if (Subscription.dnr) {
      filterNotifier.emit("subscription.fullUpdateReceived", subscription, lines);
    }
    else {
      this._processFilters(subscription, lines);
    }
  }

  _onDownloadError(downloadable, downloadURL, error, responseStatus,
                   redirectCallback) {
    let subscription = Subscription.fromURL(
      downloadable.originalUrl || downloadable.url);
    subscription.lastDownload = Math.round(Date.now() / MILLIS_IN_SECOND);
    subscription.downloadStatus = error;
    filterNotifier.emit("subscription.downloading", subscription);

    // Request fallback URL if necessary - for automatic updates only
    if (!downloadable.manual) {
      subscription.errors++;

      if (redirectCallback &&
          subscription.errors >= Prefs.subscriptions_fallbackerrors &&
          /^https?:\/\//i.test(subscription.url)) {
        subscription.errors = 0;

        let fallbackURL = Prefs.subscriptions_fallbackurl;
        const {addonVersion} = require("info");
        fallbackURL = fallbackURL.replace(/%VERSION%/g,
                                          encodeURIComponent(addonVersion));
        fallbackURL = fallbackURL.replace(/%SUBSCRIPTION%/g,
                                          encodeURIComponent(subscription.url));
        fallbackURL = fallbackURL.replace(/%URL%/g,
                                          encodeURIComponent(downloadURL));
        fallbackURL = fallbackURL.replace(/%ERROR%/g,
                                          encodeURIComponent(error));
        fallbackURL = fallbackURL.replace(/%RESPONSESTATUS%/g,
                                          encodeURIComponent(responseStatus));

        let initObj = {
          cache: "no-store",
          credentials: "omit",
          referrer: "no-referrer",
          method: downloadable.method
        };

        fetch(fallbackURL, initObj).then(response => response.text())
          .then(responseText => {
            if (!this._filterStorage.hasSubscription(subscription)) {
              return;
            }

            let match = /^(\d+)(?:\s+(\S+))?$/.exec(responseText);
            if (match && match[1] == "301" &&    // Moved permanently
              match[2] && /^https?:\/\//i.test(match[2])) {
              redirectCallback(match[2]);
            }
            // Gone
            else if (match && match[1] == "410") {
              let data = "[Adblock]\n" +
              [...subscription.filterText()].join("\n");
              redirectCallback("data:text/plain," + encodeURIComponent(data));
            }
          });
      }
    }
  }

  /**
   * Given a valid subscription and some text, it parses all filters and add
   * these in bulk to the specified subscription.
   * @param {module:subscriptionClasses.Subscription} subscription The
   *  Subscription to use as reference for manually added filters.
   * @param {string} filters The filters file/text to add.
   * @param {function} errorCallback A callback invoked if errors occur.
   */
  addSubscriptionFilters(
    subscription, filters, errorCallback
  ) {
    let {error, lines} = parseFilterList(filters);
    if (error) {
      errorCallback(error);
    }
    else {
      this._processFilters(subscription, lines);
    }
  }

  /**
   * Given a list of parsed filters, normalize each line and update the
   * subscription.
   * @private
   * @param {module:subscriptionClasses.Subscription} subscription The
   *  Subscription to use as reference for manually added filters.
   * @param {string[]} lines The parsed filters lines. The first line
   will be skipped over as it is supposed to contain the header.
  */
  _processFilters(subscription, lines) {
    lines.shift();
    let filterText = [];
    for (let line of lines) {
      line = Filter.normalize(line);
      if (line) {
        filterText.push(line);
      }
    }

    this._filterStorage.updateSubscriptionFilters(subscription, filterText);
  }
}

exports.Synchronizer = Synchronizer;