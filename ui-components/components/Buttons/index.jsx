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
    - Additional classes
*/

export const Button = ({
  colorOverrides,
  icon,
  onClick,
  text,
  kind = 'filled',
  ariaLabel = text,
}) => {
  const defaultButtonStyles = ['px-4 py-2', 'rounded-md']; // add hover
  const kindStyles = {
    filled: ['bg-theme-button-primary', 'text-theme-button-secondary'],
    outline: ['text-theme-button-primary', 'border', 'border-theme-button-primary'],
    text: ['text-theme-button-primary'],
    link: ['text-theme-link-color', 'inline'],
    punched: ['bg-theme-accent-dark', 'text-theme-secondary'],
  };

  const customStyles = colorOverrides ?? kindStyles[kind];
  const buttonStyles = [...defaultButtonStyles, ...customStyles].join(' ');

  return (
    <div className="flex justify-center">
      <button aria-label={ ariaLabel } className={ buttonStyles } onClick={ onClick }>
        <span>{ icon } { text }</span>
      </button>
    </div>
  );
};
