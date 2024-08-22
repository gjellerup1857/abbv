import React from 'react';

/**
 * @typedef {object} ButtonProps
 * @property {React.ReactNode} children - The content of the button.
 * @property {(event: React.MouseEvent<HTMLButtonElement>) => void} onClick - The function to call when the button is clicked.
 */

/**
 * Button component
 * @param {ButtonProps} props - The props for the button.
 * @returns {JSX.Element} A styled button.
 */
export const Button = ({ children, onClick }) => {
  return (
    <button style={{ borderStyle: "dotted", borderWidth: "1px" }} onClick={onClick}>
      {children}
    </button>
  );
};