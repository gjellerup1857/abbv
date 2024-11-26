import { Context } from "./context.types";

const prefs: { [key: string]: any } = {};

export const context: Context = {
  // Prefs
  untilPreferencesLoaded: async () => { },
  getPreference: (key) => { return prefs[key]; },
  setPreference: async (key, value) => { prefs[key] = value; },
  onPreferenceChanged: (_key, _f) => { },

  // Logger
  logDebug: (...args: any[]) => { console.debug(args); },
  logError: (...args: any[]) => { console.error(args); },

  // Licenses and Premium
  isLicenseValid: () => { return false; },

  // User or Installation Id
  getId: async (): Promise<string> => { return "42"; },

  // Host information
  getAppName: () => { return "info.baseName"; },
  getBrowserName: () => { return "info.application"; },
  getAppVersion: () => { return "info.addonVersion"; },

  // Event Emitter
  setListener: async (_scheduleName, _f) => { },
  setRepeatedSchedule: async (_scheduleName, _interval) => { },
  hasSchedule: (_scheduleName) => { return false; }
}
