import {
  globalDataCollectionV2 as DataCollectionV2,
  globalPrefs as Prefs,
  globalSend as send,
  globalSettings as settings,
} from "../shared/globals";

const toggleDataCollectionOptPref = function (value) {
  settings.data_collection_v2 = false;
  DataCollectionV2.end();
  togglePrefs("send_ad_wall_messages", { target: { checked: !value } });
  settings.onpageMessages = !value;
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

export const toggleShowContextMenus = (evt) => {
  send("updateButtonUIAndContextMenus");
  togglePrefs("shouldShowBlockElementMenu", evt);
};
