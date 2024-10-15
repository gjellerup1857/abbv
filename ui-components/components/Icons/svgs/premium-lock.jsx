import PropTypes from 'prop-types';

export const PremiumLock = ({ label = "", size }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="fill-inherit"
      width={size}
      height={size}
      viewBox="0 0 20 20"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M15 7.083h-.833V5.417c0-2.3-1.866-4.167-4.166-4.167a4.168 4.168 0 00-4.167 4.167v1.666h-.833c-.917 0-1.667.75-1.667 1.667v8.333c0 .917.75 1.667 1.667 1.667h10c.916 0 1.666-.75 1.666-1.667V8.75c0-.917-.75-1.667-1.666-1.667zm-5 7.5c-.916 0-1.666-.75-1.666-1.666 0-.917.75-1.667 1.667-1.667.916 0 1.666.75 1.666 1.667 0 .916-.75 1.666-1.666 1.666zM7.5 5.417v1.666h5V5.417c0-1.384-1.116-2.5-2.5-2.5a2.497 2.497 0 00-2.5 2.5z"
        fill="#EDA51E"
      />
      {label && <title>{label}</title>}
    </svg>
  )
};

PremiumLock.propTypes = {
  label: PropTypes.string,
  size: PropTypes.string,
};

export default PremiumLock;
