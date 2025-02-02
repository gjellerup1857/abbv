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

/** @module prefs */

import * as ewe from "@eyeo/webext-ad-filtering-solution";

import { installHandler, port } from "~/core/messaging/background";
import { EventEmitter } from "./events.js";
import { info } from "../../src/info/background";

const keyPrefix = "pref:";

let eventEmitter = new EventEmitter();
let overrides = Object.create(null);

/** @lends module:prefs.Prefs */
let defaults = Object.create(null);

/**
 * Public keys used to verify authenticity of partners that are authorized to
 * use the allowlisting API.
 *
 * @type {string[]}
 */
defaults.allowlisting_authorizedKeys = [
  // Readership Link public key
  // https://gitlab.com/adblockinc/ext/adblockplus/adblockplus/-/issues/1370
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
UaTE0E4KN9Mzb/2zEYTgCzcCAwEAAQ==`
];

/**
 * Public keys used to verify authenticity of entities that are authorized to
 * use the bypass API.
 *
 * @type {string[]}
 */
defaults.bypass_authorizedKeys = [
  // Readership Link public key
  // https://eyeo.atlassian.net/browse/EXT-29
  `MIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEAt7CNJC8ntgHa4GviCdeV
f1sSIJMI73rDvUcGPS0u/SlJCoE0v71q76b6pEJd7Znztxiyfx9SePM+uaCZKpfm
2sXx/vOfOXDsSDGyUq0a3vj/kNtIaLEhoaZ+uYYBQV995BfQ/qOUgkFNimyfwzYg
+chyXqEvwjjqRQ5cWOUmK4lQoAr+OJXmoq9KHSK6TnW7gHZrm5CUhN9TR2DRv9io
DiVTDIcbBh7KpvN4o/gp+x+oCbh3sWtucweu9fhUwKvlqoO24xuMfLQJ+iSShy5z
gKfWCEcQoOYARsV5pTsOKo8u3e2bbc/D5rCKTOqG3vSkafaxLLyskUz9zEm+gkOO
PMF/M0BZIZ8gPzz+YlOr9qGvLfV9XiagIpF/sPxi86f7TPlMGnOi4N4PT5eMaFtK
tfy2y3PJZN9cxAOitFjtXlllPsDbu9VAERfSCCZgHM7QY+GqQKrMcaHC3tNGhcve
GhL5A8p+PLLu8msHcc11DmmDgNVVamRggk3h5STbJP+TkgoZ1BoAYPStjF+xzvCj
UnIc1wA9sRfRNPcW+fVjOFkAF99sqew6zqL3gwmMdHdd9iVUHx7yyLkJOwJhzM5n
I51tXMpSOPPNheNGfAY7b8xGGv8M3SgoLg+dtKAV1mjyFftZ/9KP2+82Hgu+QNAX
9OLtuZ8eT/2idUzy2F+u17cCAwEAAQ==`
];

/**
 * A unique id for this extension installation.
 *
 * @type {string}
 */
defaults.installation_id = "";
/**
 * The application version as set during initialization. Used to detect updates.
 *
 * @type {string}
 */
defaults.currentVersion = "";
/**
 * @see https://adblockplus.org/en/preferences#documentation_link
 * @type {string}
 */
defaults.documentation_link =
  "https://adblockplus.org/redirect?link=%LINK%&lang=%LANG%";
/**
 * The total number of requests blocked by the extension.
 *
 * @type {number}
 */
defaults.blocked_total = 0;

/**
 * Whether to show a badge in the toolbar icon indicating the number
 * of blocked ads.
 *
 * @type {boolean}
 */
defaults.show_statsinicon = true;
/**
 * Whether to show the "Block element" context menu entry.
 *
 * @type {boolean}
 */
defaults.shouldShowBlockElementMenu = true;

/**
 * Whether to show tracking warning in options page when both
 * Acceptable Ads and subscription of type "Privacy" are enabled.
 *
 * @type {boolean}
 */
defaults.ui_warn_tracking = true;

/**
 * Whether to show the developer tools panel.
 *
 * @type {boolean}
 */
defaults.show_devtools_panel = true;

/**
 * Prevents unsolicited UI elements from showing up after installation. This
 * preference isn't set by the extension but can be pre-configured externally.
 *
 * @see https://adblockplus.org/development-builds/suppressing-the-first-run-page-on-chrome
 * @type {boolean}
 */
defaults.suppress_first_run_page = false;

/**
 * Additonal subscriptions to be automatically added when the extension is
 * loaded. This preference isn't set by the extension but can be pre-configured
 * externally.
 *
 * @type {string[]}
 */
defaults.additional_subscriptions = [];

/**
 * The version of major updates that the user is aware of. If it's too low,
 * the updates page will be shown to inform the user about intermediate changes.
 *
 * @type {number}
 */
defaults.last_updates_page_displayed = 0;

/**
 * Causes elements targeted by element hiding (and element hiding emulation)
 * to be highlighted instead of hidden.
 *
 * @type {boolean}
 */
defaults.elemhide_debug = false;

/**
 * Address of page to open on first run.
 *
 * @type {string}
 */
defaults.remote_first_run_page_url =
  "https://welcome.adblockplus.org/%LANG%/installed?an=%ADDON_NAME%&av=%ADDON_VERSION%&ap=%APPLICATION_NAME%&apv=%APPLICATION_VERSION%&p=%PLATFORM_NAME%&pv=%PLATFORM_VERSION%";

/**
 * Whether to recommend language filter lists to user.
 *
 * @type {boolean}
 */
defaults.recommend_language_subscriptions = false;

/**
 * Premium license
 *
 * @type {object}
 */
defaults.premium_license = {
  lv: 1,
  code: "",
  status: "expired"
};

/**
 * Origins that are trusted to open the options page
 */
defaults.options_backlink_trusted_origins = [
  "https://welcome.adblockplus.org",
  "https://adblockplus.org"
];

/**
 * Origin of page to activate Premium license.
 *
 * @type {string}
 */
defaults.premium_license_activation_origin = "https://accounts.adblockplus.org";

/**
 * Timestamp indicating when to attempt the next Premium license check.
 *
 * @type {number}
 */
defaults.premium_license_nextcheck = 0;

/**
 * Premium license check API endpoint
 *
 * @type {string}
 */
defaults.premium_license_check_url =
  "https://myadblock.licensing.adblockplus.dev/license";

/**
 * Address of page to manage Premium account.
 *
 * @type {string}
 */
defaults.premium_manage_page_url =
  "https://accounts.adblockplus.org/%LANG%/manage?lic=%LICENSE_CODE%&s=%SOURCE%";

/**
 * Origin of page to trigger Premium onboarding
 *
 * @type {string}
 */
defaults.premium_onboarding_trigger_origin = "https://accounts.adblockplus.org";

/**
 * Address of page to upgrade to Premium.
 *
 * @type {string}
 */
defaults.premium_upgrade_page_url =
  "https://accounts.adblockplus.org/%LANG%/premium?an=%ADDON_NAME%&av=%ADDON_VERSION%&ap=%APPLICATION_NAME%&apv=%APPLICATION_VERSION%&p=%PLATFORM_NAME%&pv=%PLATFORM_VERSION%&s=%SOURCE%";

/**
 * Premium user ID
 *
 * @type {string}
 */
defaults.premium_user_id = "";

/**
 * Sentry user ID
 *
 * @type {string}
 */
defaults.sentry_user_id = "";

/**
 * The URL of the IPM server.
 *
 * @type {string}
 */
defaults.ipm_server_url = "https://ipm.adblockplus.dev/api/stats";

/**
 * The interval in which to ping the IPM server, in ms. Defaults to 24 hours.
 *
 * @type {number}
 */
defaults.ipm_ping_interval = 24 * 60 * 60 * 1000;

/**
 * List of user events
 *
 * @type {array}
 */
defaults.ipm_events = [];

/**
 * Map of commands
 *
 * @type {Object}
 */
defaults.ipm_commands = {};

/**
 * Default trusted origin for URLs used in IPMs. This is the base URL used when
 * a relative URL is passed.
 *
 * @type {string}
 */
defaults.ipm_default_origin = "https://adblockplus.org";

/**
 * Trusted origins for URLs used in IPMs
 *
 * @type {string}
 */
defaults.ipm_safe_origins = [
  defaults.ipm_default_origin,
  "https://accounts.adblockplus.org",
  "https://blog.adblockplus.org",
  "https://help.adblockplus.org",
  "https://new.adblockplus.org",
  "https://welcome.adblockplus.org"
];

/**
 * Minimum log level
 *
 * @type {number}
 */
defaults.logger_log_level = 3;

/**
 * Map of command stats
 *
 * @type {Object}
 */
defaults.onpage_dialog_command_stats = {};

/**
 * The timestamp of the last time we showed a dialog.
 */
defaults.onpage_dialog_last_shown = 0;

/**
 * The minimum amount of time between two dialogs being shown.
 */
defaults.onpage_dialog_cool_down = 24 * 60 * 60 * 1000;

/**
 * The URL for the campaign that automatically opens on extension update
 *
 * @type {string}
 */
defaults.update_campaign_url =
  "https://adblockplus.org/%LANG%/update?an=%ADDON_NAME%&av=%ADDON_VERSION%&ap=%APPLICATION_NAME%&apv=%APPLICATION_VERSION%&p=%PLATFORM_NAME%&pv=%PLATFORM_VERSION%";

/**
 * Whether user has interacted with YouTube wall detection dialog
 *
 * @type {boolean}
 */
defaults.ytWallDetection_dialog_interacted = false;

/**
 * Where the dialog for the YouTube wall should link users to
 *
 * @type {string}
 */
defaults.ytWallDetection_dialog_url = "https://adblockplus.org/youtube";

/**
 * Map of on-page dialog timing configurations
 *
 * @see src/onpage-dialog/background/middleware/ipm-onpage-dialog.types.ts
 * @see src/onpage-dialog/background/timing.types.ts
 *
 * @type {Object}
 */
defaults.onpage_dialog_timing_configurations = {
  after_web_allowlisting: {
    cooldownDuration: 24,
    maxAllowlistingDelay: 2,
    maxDisplayCount: 3
  },
  immediate: {
    cooldownDuration: 0,
    maxDisplayCount: 0
  },
  revisit_web_allowlisted_site: {
    cooldownDuration: 48,
    maxDisplayCount: 3,
    minAllowlistingDelay: 48 * 60
  },
  after_navigation: {
    cooldownDuration: 1,
    maxDisplayCount: 1
  }
};

/**
 * Whether to send user data as part of telemetry
 * Setting this to true will disable all IPMs
 *
 * @type {boolean}
 */
defaults.data_collection_opt_out = false;

/**
 * The number of milliseconds to extend the allowlisting filter's expiry when
 * the user navigated to a URL that matches the filter.
 *
 * @type {number}
 */
defaults.allowlisting_auto_extend_ms = 1000 * 60 * 60 * 24 * 7; // 7 days

/**
 * Whether all historic allowlisting filters were transitioned to smart allowlisting
 *
 * @type {boolean}
 */
defaults.migration_popup_to_smart_allowlist_complete = false;

/**
 * @namespace
 * @static
 */
export let Prefs = {
  /**
   * Retrieves the given preference.
   *
   * @param {string} preference
   * @return {any}
   */
  get(preference) {
    // We need to temporarily force-disable data collection in Firefox, while
    // we're working on improving our data collection opt-out mechanism based
    // on Mozilla's requirements
    // https://gitlab.com/adblockinc/ext/adblockplus/adblockplus/-/issues/1621
    if (
      preference === "data_collection_opt_out" &&
      info.application === "firefox"
    )
      return true;

    let result = (preference in overrides ? overrides : defaults)[preference];

    // Object preferences are mutable, so we need to clone them to avoid
    // accidentally modifying the preference when modifying the object
    if (typeof result === "object") result = JSON.parse(JSON.stringify(result));

    return result;
  },

  /**
   * Resets the given preference to its default value.
   *
   * @param {string} preference
   * @return {Promise} A promise that resolves when the underlying
                       browser.storage.local.set/remove() operation completes
   */
  reset(preference) {
    return Prefs.set(preference, defaults[preference]);
  },

  /**
   * Sets the given preference.
   *
   * @param {string} preference
   * @param {any}    value
   * @return {Promise} A promise that resolves when the underlying
                       browser.storage.local.set/remove() operation completes
   */
  set(preference, value) {
    let defaultValue = defaults[preference];

    if (typeof value != typeof defaultValue)
      throw new Error("Attempt to change preference type");

    if (value == defaultValue) {
      let oldValue = overrides[preference];
      delete overrides[preference];

      // Firefox 66 fails to emit storage.local.onChanged events for falsey
      // values. https://bugzilla.mozilla.org/show_bug.cgi?id=1541449
      if (
        !oldValue &&
        info.platform == "gecko" &&
        parseInt(info.platformVersion, 10) == 66
      )
        onStorageChanged({ [prefToKey(preference)]: { oldValue } }, "local");

      return browser.storage.local.remove(prefToKey(preference));
    }

    overrides[preference] = value;
    return (customSave.get(preference) || savePref)(preference);
  },

  /**
   * Adds a callback that is called when the
   * value of a specified preference changed.
   *
   * @param {string}   preference
   * @param {function} callback
   */
  on(preference, callback) {
    eventEmitter.on(preference, callback);
  },

  /**
   * Removes a callback for the specified preference.
   *
   * @param {string}   preference
   * @param {function} callback
   */
  off(preference, callback) {
    eventEmitter.off(preference, callback);
  },

  /**
   * Reads the documentation_link preference and substitutes placeholders.
   *
   * @param {string} linkID
   * @return {string}
   */
  getDocLink(linkID) {
    return this.documentation_link
      .replace(/%LINK%/g, linkID)
      .replace(/%LANG%/g, browser.i18n.getUILanguage());
  },

  /**
   * A promise that is fullfilled when all preferences have been loaded.
   * Wait for this promise to be fulfilled before using preferences during
   * extension initialization.
   *
   * @type {Promise}
   */
  untilLoaded: null
};

function keyToPref(key) {
  if (key.indexOf(keyPrefix) != 0) return null;

  return key.substr(keyPrefix.length);
}

function prefToKey(pref) {
  return keyPrefix + pref;
}

function savePref(pref) {
  return browser.storage.local.set({ [prefToKey(pref)]: overrides[pref] });
}

let customSave = new Map();
if (info.platform == "gecko" && parseInt(info.platformVersion, 10) < 66) {
  // Saving one storage value causes all others to be saved as well for
  // Firefox versions <66. Make sure that updating ad counter doesn't cause
  // the filters data to be saved frequently as a side-effect.
  let promise = null;
  customSave.set("blocked_total", (pref) => {
    if (!promise) {
      promise = new Promise((resolve, reject) => {
        setTimeout(() => {
          promise = null;
          savePref(pref).then(resolve, reject);
        }, 60 * 1000);
      });
    }
    return promise;
  });
}

function addPreference(pref) {
  Object.defineProperty(Prefs, pref, {
    get() {
      return Prefs.get(pref);
    },
    set(value) {
      Prefs.set(pref, value);
    },
    enumerable: true
  });
}

function onStorageChanged(changes) {
  for (let key in changes) {
    let pref = keyToPref(key);
    if (pref && pref in defaults) {
      let change = changes[key];
      if ("newValue" in change && change.newValue != defaults[pref])
        overrides[pref] = change.newValue;
      else delete overrides[pref];

      eventEmitter.emit(pref);
    }
  }
}

async function init() {
  let prefs = Object.keys(defaults);
  prefs.forEach(addPreference);

  let isEdgeChromium =
    info.application == "edge" && info.platform == "chromium";

  // When upgrading from EdgeHTML to Edge Chromium (v79) data stored in
  // browser.storage.local gets corrupted.
  // To fix it, we have to call JSON.parse twice.
  // See: https://gitlab.com/eyeo/adblockplus/adblockpluschrome/issues/152
  if (isEdgeChromium) {
    let items = await browser.storage.local.get(null);

    let fixedItems = {};
    for (let key in items) {
      if (typeof items[key] == "string") {
        try {
          fixedItems[key] = JSON.parse(JSON.parse(items[key]));
        } catch (e) {}
      }
    }

    await browser.storage.local.set(fixedItems);
  }

  {
    let items = await browser.storage.local.get(prefs.map(prefToKey));
    for (let key in items) overrides[keyToPref(key)] = items[key];
  }

  if ("managed" in browser.storage) {
    try {
      let items = await browser.storage.managed.get(null);
      for (let key in items) defaults[key] = items[key];
    } catch (e) {
      // Opera doesn't support browser.storage.managed, but instead of simply
      // removing the API, it gives an asynchronous error which we ignore here.
    }
  }

  browser.storage.onChanged.addListener(onStorageChanged);

  // EWE 0.8.0 made the notifications API asynchronous, so we need to
  // cache ignored notification categories to continue to be able to
  // get/set the notifications_ignoredcategories preference synchronously
  let ignoredCategories = await ewe.notifications.getIgnoredCategories();

  // Initialize notifications_ignoredcategories pseudo preference
  Object.defineProperty(Prefs, "notifications_ignoredcategories", {
    get() {
      return ignoredCategories;
    },
    set(value) {
      const categories = new Set(ignoredCategories);
      if (value) categories.add("*");
      else categories.delete("*");
      ignoredCategories = categories;

      void ewe.notifications.toggleIgnoreCategory("*", !!value);
    },
    enumerable: true
  });

  ewe.notifications.on("ignored-category-added", async () => {
    ignoredCategories = await ewe.notifications.getIgnoredCategories();
    eventEmitter.emit("notifications_ignoredcategories");
  });
  ewe.notifications.on("ignored-category-removed", async () => {
    ignoredCategories = await ewe.notifications.getIgnoredCategories();
    eventEmitter.emit("notifications_ignoredcategories");
  });
}

Prefs.untilLoaded = init();

/**
 * Returns the value of the given preference key.
 *
 * @event "prefs.get"
 * @property {string} key - The preference key.
 * @returns {string|string[]|number|boolean}
 */
port.on("prefs.get", (message, sender) => Prefs[message.key]);

/**
 * Sets the value of the given preference key to the given value.
 *
 * @event "prefs.set"
 * @property {string} key - The preference key.
 * @property {string} value - The value to set.
 * @returns {string|string[]|number|boolean|undefined}
 */
port.on(
  "prefs.set",
  async (message, sender) => (Prefs[message.key] = message.value)
);

/**
 * Toggles the value of the given preference key.
 *
 * @event "prefs.toggle"
 * @property {string} key - The preference key
 * @returns {?boolean}
 */
port.on("prefs.toggle", async (message, sender) => {
  if (message.key == "notifications_ignoredcategories")
    return ewe.notifications.toggleIgnoreCategory("*");

  return (Prefs[message.key] = !Prefs[message.key]);
});

/**
 * Returns a link to a page on our website, in the user's locale if possible.
 *
 * @event "prefs.getDocLink"
 * @property {string} link
 *   The link ID to generate the doc link for.
 * @returns {string}
 */
port.on("prefs.getDocLink", (message, sender) => {
  let { application, platform } = info;
  if (platform == "chromium" && application != "opera" && application != "edge")
    application = "chrome";
  else if (platform == "gecko") application = "firefox";

  return Prefs.getDocLink(message.link.replace("{browser}", application));
});

installHandler("prefs", null, (emit, action) => {
  const onChanged = () => emit(Prefs[action]);
  Prefs.on(action, onChanged);
  return () => Prefs.off(action, onChanged);
});
