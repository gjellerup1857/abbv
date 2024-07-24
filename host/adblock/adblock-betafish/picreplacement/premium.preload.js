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
/* global browser, cloneInto */

/**
 * List of events that are waiting to be processed
 */
const eventQueue = [];
/**
 * Maximum number of failed requests after which events stop being handled
 */
const maxErrorThreshold = 30;
/**
 * Maximum number of events that can be queued up
 */
const maxQueuedEvents = 20;
/**
 * Interval period in milliseconds at which events are processed
 */
const processingDelay = 100;

/**
 * Number of failed requests
 */
let errorCount = 0;
/**
 * Interval identifier for processing events
 */
let processingIntervalId = null;

/**
 * Checks whether event contains authentication data
 *
 * @param {Event} event - Event
 *
 * @returns {boolean} whether event contains authentication data
 */
function isAuthRequestEvent(event) {
  return (
    event.detail
    && typeof event.detail.signature === 'string'
    && typeof event.detail.timestamp === 'number'
  );
}

/**
 * Check whether incoming event hasn't been tampered with
 *
 * @param {Event} event - DOM event
 *
 * @returns {boolean} whether the event can be trusted
 */
function isTrustedEvent(event) {
  return Object.getPrototypeOf(event) === CustomEvent.prototype
    && !Object.hasOwnProperty.call(event, 'detail');
}

/**
 * Checks whether event contains website ID
 *
 * @param {Event} event - Event
 *
 * @returns {boolean} whether event contains website ID
 */
function isSignatureRequestEvent(event) {
  return event.detail != null && typeof event.detail.website_id === 'string';
}

/**
 * Retrieves requested payload from background page
 *
 * @param {Event} event - "flattr-request-payload" DOM event
 *
 * @returns {Promise<string|null>} payload - Encoded signed Premium license data
 */
async function getPayload(event) {
  return browser.runtime.sendMessage({
    command: 'users.isPaying',
    timestamp: event.detail.timestamp,
    signature: event.detail.signature,
  });
}

/**
 * Retrieves additional data to be sent along with the payload
 *
 * @param {Event} event - Event containing signature request data
 * @returns {Promise<Object|null>} extensionInfo - Additional data or null if conditions are not met
 */
async function getExtensionInfo(event) {
  if (!isSignatureRequestEvent(event)) {
    return null;
  }

  try {
    const [
      dataCollectionOptOut,
      manifest,
      signature,
      acceptableAds,
      allowlist,
    ] = await Promise.all([
      browser.runtime.sendMessage({ type: 'prefs.get', key: 'data_collection_opt_out' }),
      browser.runtime.getManifest(),
      browser.runtime.sendMessage({
        command: 'premium.signature',
        signature: event.detail.signature,
        timestamp: event.detail.timestamp,
        w: event.detail.website_id,
      }),
      isAcceptableAdsActive(),
      allowlistState(),
    ]);

    if (dataCollectionOptOut === true || signature === null) {
      return null;
    }

    return {
      name: manifest.short_name,
      version: manifest.version,
      acceptableAds,
      allowlistState: allowlist,
      ...signature,
    };
  } catch (error) {
    return null;
  }
}

/**
 * Queues up incoming requests
 *
 * @param {Event} event - "flattr-request-payload" DOM event
 */
function handleFlattrRequestPayloadEvent(event) {
  if (eventQueue.length >= maxQueuedEvents) {
    return;
  }

  eventQueue.push(event);
  startProcessingInterval();
}

/**
 * Checks whether Acceptable Ads are active
 *
 * @returns {Promise<boolean>} Whether Acceptable Ads are active
 */
const isAcceptableAdsActive = async () => {
  const [
    acceptableAdsUrl,
    subscriptions,
  ] = await Promise.all([
    browser.runtime.sendMessage({ type: 'app.get', what: 'acceptableAdsUrl' }),
    browser.runtime.sendMessage({ type: 'subscriptions.get' }),
  ]);
  const activeSubscriptionUrls = subscriptions.map(
    ({ disabled, url }) => !disabled && url,
  ).filter(Boolean);

  return activeSubscriptionUrls.includes(acceptableAdsUrl);
};

/**
 * Checks whether current tab is allowlisted
 *
 * @returns {Promise<Object>} Allowlist state object containing status, source, and oneCA
 */
const allowlistState = async () => {
  const allowlistResponse = await browser.runtime.sendMessage({ command: 'filters.isTabAllowlisted' });
  const [status, source, oneCA] = allowlistResponse || [false, null, false];
  return { status, source, oneCA };
};

/**
 * Processes incoming requests
 *
 * @returns {Promise<void>}
 */
async function processNextEvent() {
  const event = eventQueue.shift();
  if (event) {
    if (!isTrustedEvent(event)) {
      return;
    }
    if (!isAuthRequestEvent(event)) {
      return;
    }

    try {
      const [payload, extensionInfo] = await Promise.all([
        getPayload(event),
        getExtensionInfo(event),
      ]);

      let detail = { detail: { payload, extras: extensionInfo } };
      if (typeof cloneInto === 'function') {
        // Firefox requires content scripts to clone objects
        // that are passed to the document
        detail = cloneInto(detail, document.defaultView);
      }
      document.dispatchEvent(
        new CustomEvent('flattr-payload', detail),
      );
      stop();
    } catch (e) {
      errorCount += 1;
      if (errorCount >= maxErrorThreshold) {
        stop();
      }
    }
  }

  if (!eventQueue.length) {
    stopProcessingInterval();
  }
}

/**
 * Starts interval for processing incoming requests
 */
function startProcessingInterval() {
  if (processingIntervalId) {
    return;
  }

  processNextEvent();
  processingIntervalId = setInterval(processNextEvent, processingDelay);
}

/**
 * Stops interval for processing incoming requests
 */
function stopProcessingInterval() {
  clearInterval(processingIntervalId);
  processingIntervalId = null;
}

/**
 * Initializes module
 */
function start() {
  document.addEventListener('flattr-request-payload',
    handleFlattrRequestPayloadEvent, true);
}

/**
 * Uninitializes module
 */
function stop() {
  document.removeEventListener('flattr-request-payload',
    handleFlattrRequestPayloadEvent, true);
  eventQueue.length = 0;
  stopProcessingInterval();
}

start();
