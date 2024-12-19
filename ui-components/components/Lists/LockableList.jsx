import { Checkbox, Icon, Link, ToggleSwitch } from "../";

const IconSelector = [Icon, {
  className: "text-theme-accent-light",
  name: "premium-lock",
  size: "md",
  ariaLabel: "locked",
}];

const NewIcon = ({ translate }) => (
  <span className="bg-theme-button-primary font-bold text-white text-xs px-1 py-0.5 mx-1 rounded">
    {translate("options_new_label")}
  </span>
);

const OptionItem = ({
  name,
  onChangeFn,
  textKey,
  extraInfo,
  helpLink,
  additionalInfoLink,
  subOptions,
  isChecked,
  translate,
  isLocked = false,
  isNew = false,
  isSubOption = false,
  selector = [Checkbox],
  styles = {}
}) => {

  const {
    descriptions = [],
    items = [],
    labels = [],
  } = styles;

  const subOptionLiClasses = isSubOption ? ["pl-6"] : ["first-of-type:border-none"];
  const itemClasses = [...subOptionLiClasses, ...items].join(" ");
  const labelClasses = [...labels].join(" ");
  const descriptionClasses = ["pl-8", ...descriptions].join(" ");

  const alignementClasses = isSubOption ? "items-baseline" : "items-center";
  const outerDivClasses = ["flex justify-between py-2", alignementClasses].join(" ");
  const innerDivClasses = ["flex", alignementClasses].join(" ");

  const [Selector, selectorOptions = {}] = isLocked ? IconSelector : selector;
  const optionChecked = isChecked(name);
  const onItemChange = (evt) => onChangeFn(name, evt);

  return (
    <li key={name} className={itemClasses}>
      <div className={outerDivClasses}>
        <div className={innerDivClasses}>
          <Selector
            id={name}
            onChange={onItemChange}
            checked={optionChecked}
            {...selectorOptions}
          />
          <label className={labelClasses} htmlFor={name}>
            {translate(textKey)}
          </label>
          {isNew && <NewIcon translate={translate}/>}
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
        {extraInfo && <p className={descriptionClasses}>{translate(extraInfo)}</p>}
      </div>
      <div>
        {subOptions && optionChecked && (
          <ul>
            {subOptions.map((option) => (
              <OptionItem
                key={option.name}
                {...option}
                isSubOption
                selector={[ToggleSwitch, { kind: "inline" }]}
                onChangeFn={onChangeFn}
                isChecked={isChecked}
                styles={styles}
                translate={translate}
              />
            ))}
          </ul>
        )}
      </div>
    </li>
  );
};

// Add translate fn as argument
export const LockableList = ({ items, isChecked, onItemChange, styles, translate }) => {
  return (
    <>
      <ul>
        {items.map((item) => (
          <OptionItem
            key={item.name}
            {...item}
            isChecked={isChecked}
            onChangeFn={onItemChange}
            styles={styles}
            translate={translate} />
        ))}
      </ul>
    </>
  );
};
