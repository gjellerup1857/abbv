import {
  globalDataCollectionV2 as DataCollectionV2,
  globalPrefs as Prefs,
  globalSend as send,
  globalSettings as settings,
} from "../shared/globals";

const evtObjWrapper = (checkedVal) => ({
  target: { checked: checkedVal }
});

const toggleDataCollectionOptPref = function (value) {
  toggleSettings("data_collection_v2", evtObjWrapper(false));
  DataCollectionV2.end();
  togglePrefs("send_ad_wall_messages", evtObjWrapper(!value));
  toggleSettings("onpageMessages",  evtObjWrapper(!value));
};

/* eslint-disable-next-line no-console */
export const changeHandler = (evt) => console.log("change is possible", evt, evt.target.checked);

export const toggleDataCollectionOptOut = async (evt) => {
  const isEnabled = evt.target.checked;

  if (isEnabled) {
    await send("dataCollectionOptOut");
  }

  toggleDataCollectionOptPref(isEnabled);
  togglePrefs("dataCollectionOptOut", evt);
};

export const togglePrefs = (name, evt) => {
  Prefs[name] = evt.target.checked;
};

export const toggleSettings = (name, evt) => {
  settings[name] = evt.target.checked;
};

export const toggleShowContextMenus = (evt) => {
  send("updateButtonUIAndContextMenus");
  togglePrefs("shouldShowBlockElementMenu", evt);
};
