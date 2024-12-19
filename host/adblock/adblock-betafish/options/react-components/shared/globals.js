/*
  This file re-exports global references so they can be
  explicity imported in the React components. Eventually,
  we should make these truly scoped values, but at least this
  gives us a list of the one we use
*/

/* For ESLint: List any global identifiers used in this file below */
/* global abpPrefPropertyNames, Prefs, send, settings */

export const globalAbpPrefPropertyNames = abpPrefPropertyNames;
export const globalDataCollectionV2 = DataCollectionV2;
export const globalSend = send;
export const globalSettings = settings;
export const globalPrefs = Prefs;
