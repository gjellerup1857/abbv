/*
  Required inputs
    - onClick

  Kinds of button (optional)
    - Filled (primary color)
    - Outline (secondary color)
    - Text-only (secondary color, block display)
    - Link button (same as text-only but inline)
    - Punched (secondary color, text bg color)

  Other Optional inputs
    - Icon
    - Color override
    - Aria label
    - Disabled
*/
import PropTypes from 'prop-types';


/**
 * Buttons allow users to take actions, and you can use them to direct a
 * user's attention or warn them of outcomes.
 *
 * @param {Object} props - The props for the Button component.
 * @param {string[]} [props.colorOverrides] - Classes to override the default theme
 *    colors of a button. Use only if switching to a defined kind absolutely
 *    will not work.
 * @param {JSX.Element} [props.icon] - An Icon component. Either text or an icon
 *    is required.
 * @param {Function} props.onClick - The function to call when the button is clicked.
 * @param {string} props.text - Text for the button. Either text or an icon
 *    is required.
 * @param {'filled'|'outline'|'text'|'link'|'punched'} [props.kind='filled'] -
 *    Type of button to display.
 * @param {string} [props.ariaLabel] - Aria label for the button. By default,
 *    uses the same text shown on the button.
 * @returns {JSX.Element} The button component.
 */
export const Button = ({
  colorOverrides,
  icon,
  onClick,
  text,
  ariaLabel = text,
  disabled = false,
  kind = 'filled',
}) => {
  const defaultButtonStyles = ['flex justify-center', 'px-4 py-2', 'rounded-md'];
  const defaultWrapperStyles = ['flex justify-center'];

  const disabledStyles = disabled ? ['opacity-50', 'pointer-events-none'] : [];
  const disabledWrapperStyles = disabled ? ['cursor-not-allowed'] : [];

  const kindStyles = {
    filled: ['bg-theme-button-primary', 'text-theme-button-secondary', 'border', 'border-theme-button-primary', 'hover:drop-shadow-md', 'hover:bg-theme-link-color', 'hover:border-theme-link-color',],
    outline: ['text-theme-button-primary', 'border', 'border-theme-button-primary', 'hover:bg-theme-button-primary', 'hover:text-theme-button-secondary'],
    text: ['text-theme-accent-dark', 'hover:text-theme-link-color'],
    link: ['text-theme-link-color', 'inline', 'hover:text-theme-text-accent'],
    punched: ['bg-theme-accent-dark', 'text-theme-secondary', 'hover:bg-theme-link-color'],
  };

  const customStyles = colorOverrides ?? kindStyles[kind];
  const buttonStyles = [...defaultButtonStyles, ...customStyles, ...disabledStyles].join(' ');
  const wrapperStyles = [...defaultWrapperStyles, ...disabledWrapperStyles].join(' ');

  return (
    <div className={ wrapperStyles }>
      <button type="button" aria-label={ ariaLabel } className={ buttonStyles } disabled={ disabled } onClick={ onClick }>
        <span className="flex justify-center gap-x-2">{ icon } <span>{ text }</span></span>
      </button>
    </div>
  );
};

Button.propTypes = {
  colorOverrides: PropTypes.arrayOf(PropTypes.string),
  icon: PropTypes.element,
  onClick: PropTypes.func.isRequired,
  text: PropTypes.string.isRequired,
  kind: PropTypes.oneOf(['filled', 'outline', 'text', 'link', 'punched']),
  ariaLabel: PropTypes.string,
};
