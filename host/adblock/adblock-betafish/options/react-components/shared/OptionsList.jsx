import { Checkbox, Icon, Link, ToggleSwitch } from "@eyeo/ext-ui-components";
import { translate } from "./utils";

const OptionItem = ({
  name,
  onChange,
  textKey,
  extraInfo,
  helpLink,
  additionalInfoLink,
  subOptions,
  isChecked,
  isSubOption = false,
  selector: Selector = Checkbox,
}) => {
  const subOptionLiClasses = isSubOption ? "pl-6" : "first-of-type:border-none";
  const itemClasses = ["text-lg  border-t border-theme-accent-light", subOptionLiClasses].join(" ");

  const alignementClasses = isSubOption ? "items-baseline" : "items-center";
  const outerDivClasses = ["flex justify-between py-2", alignementClasses].join(" ");
  const innerDivClasses = ["flex", alignementClasses].join(" ");

  return (
    <li key={name} className={itemClasses}>
      <div className={outerDivClasses}>
        <div className={innerDivClasses}>
          {/* The Toggle and Checkbox APIs need to be aligned */}
          <Selector id={name} name={name} onChange={onChange} checked={isChecked(name)} />
          <label className="ml-4" for={name}>
            {translate(textKey)}
          </label>
        </div>
        <div className="flex items-center">
          {additionalInfoLink && (
            <Link href={additionalInfoLink.href}>{translate(additionalInfoLink.textKey)}</Link>
          )}
          {helpLink && (
            <span className="inline-block ml-2">
              <Link href={helpLink}>
                <Icon
                  name="live-help"
                  ariaLabel="learn_more_without_period"
                  className="fill-theme-accent-dark hover:fill-theme-link-color"
                  size="sm"
                />
              </Link>
            </span>
          )}
        </div>
      </div>
      <div className="mb-2 -mt-2.5">
        {extraInfo && <span className="text-base italic pl-8">{translate(extraInfo)}</span>}
      </div>
      <div>
        {subOptions && (
          <ul>
            {subOptions.map((option) => (
              <OptionItem isSubOption selector={ToggleSwitch} {...option} isChecked={isChecked} />
            ))}
          </ul>
        )}
      </div>
    </li>
  );
};

export const OptionsList = ({ items, isChecked }) => {
  return (
    <>
      <ul>
        {items.map((item) => (
          <OptionItem {...item} isChecked={isChecked} />
        ))}
      </ul>
    </>
  );
};