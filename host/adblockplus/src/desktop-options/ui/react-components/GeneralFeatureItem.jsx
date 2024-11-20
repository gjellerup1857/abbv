import { Checkbox, Icon } from "@eyeo/ext-ui-components";
import { translate } from "./shared/utils";

/**
 * General feature item component, contains a checkbox or a lock icon, title and description
 * @param {string} titleI18nKey - The i18n key of the title
 * @param {string} descriptionI18nKey - The i18n key of the description
 * @param {boolean} [isLocked=false] - Whether the feature is locked, aka premium
 * @param {boolean} [isNew=false] - Whether the feature is new and should be marked as such
 * @returns {JSX.Element}
 */
const GeneralFeatureItem = ({
  titleI18nKey,
  descriptionI18nKey,
  isLocked = false,
  isNew = false
}) => (
  <div className="flex gap-2 my-3">
    {isLocked ? (
      <Icon
        className="text-theme-accent-light"
        name="premium-lock"
        size="md"
        ariaLabel={translate(titleI18nKey)}
      />
    ) : (
      <Checkbox onChange={() => {}} />
    )}
    <div>
      <span className="font-bold">
        {translate(titleI18nKey)}
        {isNew && (
          <span className="bg-theme-button-primary text-white text-xs px-1 py-0.5 mx-1 rounded">
            {translate("options_new_label")}
          </span>
        )}
      </span>
      <p className="text-sm">{translate(descriptionI18nKey)}</p>
    </div>
  </div>
);

export default GeneralFeatureItem;
