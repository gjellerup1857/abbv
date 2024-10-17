import { Checkbox, Icon, Link, ToggleSwitch } from "@eyeo/ext-ui-components";

const translate = function (messageName, substitutions) {
  if (!messageName || typeof messageName !== "string") {
    // eslint-disable-next-line no-console
    console.trace("missing messageName");
    return "";
  }

  let parts = substitutions;
  if (Array.isArray(parts)) {
    for (let i = 0; i < parts.length; i++) {
      if (typeof parts[i] !== "string") {
        parts[i] = parts[i].toString();
      }
    }
  } else if (parts && typeof parts !== "string") {
    parts = parts.toString();
  }

  // if VERBOSE_DEBUG is set to true, duplicate (double the length) of the translated strings
  // used for testing purposes only
  if (VERBOSE_DEBUG) {
    return `${browser.i18n.getMessage(messageName, parts)}
            ${browser.i18n.getMessage(messageName, parts)}`;
  }
  return browser.i18n.getMessage(messageName, parts);
};

const changeHandler = () => console.log('change is possible');

const OptionItem = ({
  name,
  text,
  extraInfo,
  helpLink,
  additionalInfoLink,
  subOptions,
  selector: Selector = Checkbox
}) => {
  return (
    <li key={ name }>
      <div>
        <div>
          {/* The Toggle and Checkbox APIs need to be aligned */}
          <Selector id={ name } name={ name } onChange={ changeHandler } />
          <label for={ name }>{translate(text)}</label>
        </div>
        <div>
          { additionalInfoLink && <Link href={ additionalInfoLink.href }>{translate(additionalInfoLink.text)}</Link>}
          { helpLink && <Link href={ helpLink }><Icon name='live-help' ariaLabel='learn_more_without_period' /></Link> }
        </div>
      </div>
      <div>
        { extraInfo && <span>{translate(extraInfo)}</span> }
      </div>
      { subOptions &&  subOptions.map((option) => <OptionItem selector={ ToggleSwitch } { ...option } />) }
    </li>
  )
}

export const GeneralOptionsList = ({ items }) => {
  return (
    <>
      <h1>{ translate('generaloptions2') }</h1>
      <ul>
        {
          items.map((item) => <OptionItem {...item} />)
        }
      </ul>
    </>
  )
}
