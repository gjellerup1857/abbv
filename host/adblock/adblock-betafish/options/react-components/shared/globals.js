/*
  This file re-exports global references so they can be
  explicity imported in the React components. Eventually,
  we should make these truly scoped values, but at least this
  gives us a list of the one we use
*/

/* For ESLint: List any global identifiers used in this file below */
/* global send */

const globalSend = send;
const globalPrefs = Prefs;

export { globalPrefs, globalSend };
