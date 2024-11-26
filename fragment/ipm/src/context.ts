import { Context } from "./context.types";

const prefs: { [key: string]: any } = {};

export const context: Context = {
  // Prefs
  untilPreferencesLoaded: async function(): Promise<void> { },
  getPreference: function(key: string): any { return prefs[key]; },
  setPreference: async function(key: string, value: any): Promise<void> { prefs[key] = value; },
  onPreferenceChanged: function(_key: string, _f: () => Promise<void>): void { },

  // Logger
  logDebug: (...args: any[]) => { console.debug(args); },
  logError: (...args: any[]) => { console.error(args); },

  // Licenses and Premium
  isLicenseValid: () => { return false; },

  // User or Installation Id
  getId: async function(): Promise<string> { return "42"; },

  // Host information
  getAppName: () => { return "info.baseName"; },
  getBrowserName: () => { return "info.application"; },
  getAppVersion: () => { return "info.addonVersion"; }
}
