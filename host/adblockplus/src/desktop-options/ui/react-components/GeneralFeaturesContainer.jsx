import { useEffect, useState } from "react";
import { Link, LockableList } from "@eyeo/ext-ui-components";
import * as messaging from "~/core/messaging/front/index.ts";
import { translate } from "./shared/utils";
import GeneralFeatureItem from "./GeneralFeatureItem";

const freeFeatures = [
  {
    titleI18nKey: "common_feature_privacy_title",
    textKey: "common_feature_privacy_title",
    extraInfo: "options_recommended_privacy_description",
    descriptionI18nKey: "options_recommended_privacy_description",
  },
  {
    titleI18nKey: "common_feature_notifications_title",
    textKey: "common_feature_notifications_title",
    extraInfo: "options_recommended_notifications_description",
    descriptionI18nKey: "options_recommended_notifications_description",
  },
  {
    titleI18nKey: "common_feature_social_title",
    textKey: "common_feature_social_title",
    extraInfo: "options_recommended_social_description",
    descriptionI18nKey: "options_recommended_social_description",
  }
];

const premiumFeatures = [
  {
    titleI18nKey: "common_feature_cookies_premium_title",
    textKey: "common_feature_cookies_premium_title",
    extraInfo: "options_recommended_cookies_premium_description",
    descriptionI18nKey: "options_recommended_cookies_premium_description",
    isNew: true
  },
  {
    titleI18nKey: "common_feature_annoyances_title",
    textKey: "common_feature_annoyances_title",
    extraInfo: "options_recommended_annoyances_description",
    descriptionI18nKey: "options_recommended_annoyances_description",
  }
];

const listStyles = {
  labels: ['font-bold', 'ml-2'],
  descriptions: ['text-sm'],
};

export default function GeneralFeaturesContainer({ user }) {
  const [upgradeUrl, setUpgradeUrl] = useState("");

  const premiumFeaturesWithLocks = premiumFeatures.map((item) => ({
    ...item,
    isLocked: !user.hasPremium
  }));

  useEffect(() => {
    (async () => {
      const newUpgradeUrl = await messaging.ctalinks.get("premium-upgrade", {
        source: "general-tab"
      });
      setUpgradeUrl(newUpgradeUrl);
    })();
  }, []);

  return (
    <section className="flex gap-4 mx-8 py-3 border-t">
      <div className="w-1/2">
        <div className="flex items-center gap-5 h-14">
          <h2 className="uppercase font-bold">Premium</h2>
          {!user.hasPremium && (
            <Link
              href={upgradeUrl}
              kind="filled"
              colorOverrides={[
                "bg-theme-accent-dark",
                "!text-white",
                "font-bold",
                "hover:opacity-90"
              ]}
            >
              {translate("options_upgrade_button")}
            </Link>
          )}
        </div>
        <LockableList
        	items={premiumFeaturesWithLocks}
        	translate={translate}
        	isChecked={() => true}
        	onItemChange={() => console.log("🦁")}
          styles={listStyles}
        />
        {premiumFeatures.map((featureProps, index) => (
          <GeneralFeatureItem
            key={featureProps.titleI18nKey}
            isLocked={!user.hasPremium}
            {...featureProps}
          />
        ))}
      </div>
      <div className="w-1/2">
        <div className="flex items-center gap-5 h-14">
          <h2 className="uppercase font-bold">
            {translate("options_free_filters_header")}
          </h2>
        </div>
        <LockableList
        	items={freeFeatures}
        	translate={translate}
        	isChecked={() => true}
        	onItemChange={() => console.log("🦁🦁")}
          styles={listStyles}
        />
        {freeFeatures.map((featureProps, index) => (
          <GeneralFeatureItem
            key={featureProps.titleI18nKey}
            {...featureProps}
          />
        ))}
      </div>
    </section>
  );
}
