import { globalPrefs as Prefs, globalSend as send } from "../shared/globals";

/* eslint-disable-next-line no-console */
export const changeHandler = (evt) => console.log("change is possible", evt, evt.target.checked);

export const toggleShowContextMenus = (evt) => {
  send("updateButtonUIAndContextMenus");
  Prefs["shouldShowBlockElementMenu"] = evt.target.checked;
};
