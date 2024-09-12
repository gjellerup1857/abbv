/*
  Required inputs
    - onClick

  Kinds of Toggles (optional)
    - TBD

  Other Optional inputs
    - Color override
    - Aria label
    - Additional classes
*/
import PropTypes from 'prop-types';
import React, { useState } from "react";

/**
 * Toggle Switches/Buttons allow users to enable or disable a setting, subscribe to a filter list.
 *
 * @param {Object} props - The props for the Toggle Switch component.
 * @param {string[]} [props.colorOverrides] - Classes to override the default theme
 *    colors of a Toggle Switch. Use only if switching to a defined kind absolutely
 *    will not work.
 * @param {JSX.Element} [props.icon] - An Icon component. Either text or an icon
 *    is required.
 * @param {Function} props.onClick - The function to call when the Toggle Switch is clicked.
 * @param {string} props.text - Text for the Toggle Switch. Either text or an icon
 *    is required.
 * @param {'filled'|'outline'|'text'|'link'|'punched'} [props.kind='filled'] -
 *    Type of Toggle Switch to display.
 * @param {string} [props.ariaLabel] - Aria label for the Toggle Switch. By default,
 *    uses the same text shown on the Toggle Switch.
 * @returns {JSX.Element} The Toggle Switch component.
 */

export const ToggleSwitch = ({
  name,
  i18nPrefixMessage,
  i18nPostfixMessage,
  checked = false,
  onClick,
  ariaLabel,
  classOverrides = [],
  isLargeSlider = true,
}) => {
  const [isChecked, setIsChecked] = useState(checked);
  const defaultClassName = '';
  const checkedClassName = '';
  let inputTag = '';

  const slideSize = isLargeSlider ? 'large' : 'small';
  const sliderDimension = {
    large: 'h-6 w-10',
    small: 'h-3 w-10',
  };
  const sliderCheckedBackgroundColor = {
    large: 'bg-theme-link-color',
    small: 'bg-theme-secondary',
  };
  const sliderUncheckedBackgroundColor = {
    large: 'bg-theme-text-secondary',
    small: 'bg-theme-secondary',
  };
  const buttonCheckedBackgroundColor = {
    large: 'bg-theme-secondary',
    small: 'bg-theme-link-color',
  };
  const buttonUncheckedBackgroundColor = {
    large: 'bg-theme-secondary',
    small: 'bg-theme-text-secondary',
  };
  const checkedTranslate = {
    large: 'translate-x-4',
    small: 'translate-x-5',
  };
  const uncheckedTranslate = {
    large: 'translate-x-0',
    small: '-translate-x-1',
  };

  const onChangeHandler = (evt) => {
    setIsChecked(prevState => !prevState);
    onClick(evt);
  };

  if (onClick) {
    inputTag = <input type="checkbox" id={ name } onChange={ onChangeHandler }  defaultChecked={ isChecked } className="hidden" />;
  }

  return (
    <label htmlFor={ name } className="cursor-pointer flex items-center">
      <span i18n={ i18nPrefixMessage }></span>
      <div className={`${ sliderDimension[slideSize] } flex items-center rounded-full p-1 ${isChecked ? sliderCheckedBackgroundColor[slideSize] : sliderUncheckedBackgroundColor[slideSize]}  ${isChecked ? checkedClassName : defaultClassName} `} >
        {inputTag}
        <div className={`h-4 w-4 rounded-full shadow-sm duration-300 ${isChecked ? buttonCheckedBackgroundColor[slideSize] : buttonUncheckedBackgroundColor[slideSize]} ${isChecked ? checkedTranslate[slideSize] : uncheckedTranslate[slideSize]  }`} />
      </div>
      <span i18n={ i18nPostfixMessage }></span>
    </label>
  );
};

ToggleSwitch.propTypes = {
  name: PropTypes.string,
  checked: PropTypes.bool,
  onClick: PropTypes.func,
  ariaLabel: PropTypes.string,
};
