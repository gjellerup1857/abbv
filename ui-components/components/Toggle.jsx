import PropTypes from 'prop-types';
import { useState } from "react";

/**
 * Toggle Switches/Buttons allow users to enable or disable a setting, subscribe to a filter list.
 *
 * @param {Object} props - The props for the Toggle Switch component
 * @param {Boolean} [props.checked=false] - The initial state of the checked box
 * @param {string} props.id - ID of checkbox underlying Toggle Switch
 * @param {Function} props.onChange - The function to call when the Toggle Switch is clicked
 * @returns {JSX.Element} The Toggle Switch component
 */

export const ToggleSwitch = ({
  id,
  onChange,
  checked = false,
}) => {
  const [isChecked, setIsChecked] = useState(checked);

  const onChangeHandler = (evt) => {
    setIsChecked(evt.target.checked);
    onChange(evt);
  };

  const defaultWrapperStyles = ['h-6 w-10', 'flex', 'items-center', 'rounded-full', 'p-1'];
  const focusWrapperStyles = ['focus-within:outline-offset-2','focus-within:outline-4', 'focus-within:outline-[Highlight]', 'focus-within:outline-auto'];
  const isCheckedWrapperStyles = [`${isChecked ? 'bg-theme-link-color' : 'bg-theme-accent-dark'}`];
  const wrapperStyles = [...defaultWrapperStyles, ...focusWrapperStyles, ...isCheckedWrapperStyles].join(' ');

  const defaultToggleButtonStyles = ['h-4 w-4', 'rounded-full', 'shadow-sm', 'duration-300', 'bg-theme-secondary'];
  const isCheckedToggleButtonStyles = [ `${isChecked ? 'translate-x-4' : 'translate-x-0'}`];
  const toggleButtonStyles = [...defaultToggleButtonStyles, ...isCheckedToggleButtonStyles].join(' ');

  const hiddenButSelectable = 'opacity-0 absolute';

  return (
    <label htmlFor={ id } className="cursor-pointer flex items-center">
      <div className={wrapperStyles} >
        <input type="checkbox" id={ id } onChange={ onChangeHandler }  defaultChecked={ isChecked } className={ hiddenButSelectable } />
        <div className={toggleButtonStyles} />
      </div>
    </label>
  );
};

ToggleSwitch.propTypes = {
  checked: PropTypes.bool,
  id: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
};
