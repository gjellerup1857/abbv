import PropTypes from 'prop-types';

/**
 * Link component for html anchors.
 * 
 * @param {Object} props - The props for the Link component.
 * @param {JSX.Element} [props.children] - Children components.
 * @param {string} [props.href] - The URL that the link points to with different schemes supported by the browsers
 * https://developer.mozilla.org/en-US/docs/Web/HTML/Element/a#href
 * @param {string} [props.target='_blank'] - Indicates where the href URL will be displayed.
 * Accepts the same values as the <a> element https://developer.mozilla.org/en-US/docs/Web/HTML/Element/a#target,
 * '_blank' will open the url in a new tab.
 * '_self' will open the url in the current browsing context,
 * @param {string} props.text - Text for the link.
 * 
 * @returns The Link component.
 */
export const Link = ({
  children,
  href,
  target = '_blank',
}) => {
  return (
    <a 
      className={`text-theme-link-color hover:text-theme-text-accent`}
      target={ target } 
      href={ href } 
      rel='noreferrer'referrerPolicy='no-referrer'
    >
      { children }
    </a>
  );
}   

Link.propTypes = {
  children: PropTypes.node,
  href: PropTypes.string.isRequired,
  target: PropTypes.string,
}
