import { useState } from "react";
import { translate } from "../shared/utils";
import { globalPrefs as Prefs } from "../shared/globals";
import { OptionsList } from "../shared/OptionsList";
import { optionsData, eventsList } from "./data";

const getCheckedFn = (data) => (name) => {
  const dataOptOutKey = "data_collection_opt_out";
  const dataCollectionSubKeys = ["data_collection_v2", "send_ad_wall_messages", "onpageMessages"];

  if (dataOptOutKey && dataCollectionSubKeys.includes(name)) {
    return false;
  }

  return data[name];
};

export function GeneralOptionsTab({ subs, settings, prefs }) {
  const acceptableAdsData = {
    // If subscribed to acceptable_ads_privacy, then acceptable_ads is not present in subs,
    // but we still need to check the box
    acceptable_ads: subs.acceptable_ads?.subscribed || subs.acceptable_ads_privacy?.subscribed,
    acceptable_ads_privacy: subs.acceptable_ads_privacy?.subscribed,
  };
  // Change from array to object to match format of settings
  const prefsIntoObject = Object.fromEntries(prefs.map((el) => [el, Prefs[el]]));
  const unifiedSettingsData = { ...acceptableAdsData, ...settings, ...prefsIntoObject };

  const [checkedItems, setCheckedItems] = useState(unifiedSettingsData);
  const isChecked = getCheckedFn(checkedItems);

  const updateItem = (name, evt) => {
    eventsList[name]({ name, evt }, setCheckedItems);
  };

  return (
    <div className="option-page-content">
      <h1>{translate("generaloptions2")}</h1>
      <OptionsList
        className="option-page-content"
        items={optionsData}
        isChecked={isChecked}
        onItemChange={updateItem}
      />
    </div>
  );
}
