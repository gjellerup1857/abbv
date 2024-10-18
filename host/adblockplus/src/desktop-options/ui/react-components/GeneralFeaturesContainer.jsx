import browser from 'webextension-polyfill';
import { Checkbox, Icon } from "@eyeo/ext-ui-components";
import * as messaging from "~/core/messaging/front/index.ts";
import { useTranslation } from 'react-i18next';

/**
 * Return the localized string for the given key.
 *
 * @param {string} i18nKey - The key to look up in the i18n messages.
 * @returns {string}
 */
const t = (i18nKey) => browser.i18n.getMessage(i18nKey);

const freeFeatures = [
  {
    title: t("common_feature_privacy_title"),
    description: t("options_recommended_privacy_description"),
  },
  {
    title: t("common_feature_notifications_title"),
    description: t("options_recommended_notifications_description"),
  },
  {
    title: t("common_feature_social_title"),
    description: t("options_recommended_social_description"),
  },
];

const premiumFeatures = [
  {
    title: t("common_feature_cookies_premium_title"),
    description: t("options_recommended_cookies_premium_description"),
  },
  {
    title: t("common_feature_annoyances_title"),
    description: t("options_recommended_annoyances_description"),
  }
];

const FeatureItem = ({ title, description, isLocked = false, isNew = false }) => (
  <div className="flex gap-2 my-3">
    {
      isLocked ? (
        <Icon name="premium-lock" size="md" ariaLabel={title} />
      ) : (
        <Checkbox onChange={() => {}} />
      )
    }
    <div>
      <span className="font-bold">
        {title}
        {
          isNew && (
            <span className="bg-theme-button-primary text-white text-xs px-1 py-0.5 mx-1 rounded">
              New
            </span>
          )
        }
      </span>
      <p className="text-sm">
        {description}
      </p>
    </div>
  </div>
);

export default function GeneralFeaturesContainer({ user }) {
  const { t: i18nTrans, i18n } = useTranslation();
  const handleUpgrade = async () => {
    const upgradeUrl = await messaging.ctalinks.get("premium-upgrade", {
      source: "general-tab",
    });
    window.open(upgradeUrl, '_blank');
  };

  return (
    <section className="flex gap-4 mx-8 py-3 border-t">
      <div className="w-1/2">
        <div className="flex items-center gap-5 h-14">
          <h2 className="uppercase font-bold">
            Premium { t('ajksdjasas_asdasdasd_asdasdasdsaaa_xxxxx') }
          </h2>
          {
            !user.hasPremium && (
              <button
                className="bg-orange-300 text-white font-bold px-5 py-1.5 rounded"
                onClick={handleUpgrade}
              >
                { i18nTrans("options_upgrade_button") }
              </button>
            )
          }
        </div>
        {
          premiumFeatures.map((feature, index) => (
            <FeatureItem
              key={index}
              title={feature.title}
              description={feature.description}
              isLocked={!user.hasPremium}
              isNew={index === 0}
            />
          ))
        }
      </div>
      <div className="w-1/2">
        <div className="flex items-center gap-5 h-14">
          <h2 className="uppercase font-bold">
            Free features
          </h2>
        </div>
        {
          freeFeatures.map((feature, index) => (
            <FeatureItem
              key={index}
              title={feature.title}
              description={feature.description}
            />
          ))
        }
      </div>
    </section>
  );
}
