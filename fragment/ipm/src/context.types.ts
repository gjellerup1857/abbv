export interface Context {

  // Preferences
  untilPreferencesLoaded: () => Promise<void>;
  getPreference: (key: string) => any;
  setPreference: (key: string, value: any) => Promise<void>;
  onPreferenceChanged: (key: string, f: () => Promise<void>) => void;

  // Logger
  logDebug: (...args: any[]) => void;
  logError: (...args: any[]) => void;

  // Licenses and Premium
  isLicenseValid: () => boolean;

  // User or Installation Id
  getId: () => Promise<string>;

  // Host information
  getAppName: () => string;
  getBrowserName: () => string;
  getAppVersion: () => string;

  // Event Emitter
  setListener: (scheduleName: string, f: () => void) => Promise<void>,
  setRepeatedSchedule: (scheduleName: string, interval: number) => Promise<void>,
  hasSchedule: (scheduleName: string) => boolean
}
