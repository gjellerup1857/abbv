import React from 'react';
import { Story } from '@storybook/blocks';
import PropTypes from 'prop-types';

/**
 * Renders the first story in all available themes for each extension.
 * @param {Array<{ extension: string, name: string }>} themes - List of theme objects.
 * @returns {JSX.Element}
 * @constructor
 */
export default function StoryAllThemes({ themes }) {
  return (
    <div>
      <h3 id="preview-all-themes">
        All Themes
      </h3>
      <p>
        Showcases the first story in all available themes for each extension.
      </p>
      {
        themes.map(({extension, name}) => (
          <div key={`${extension}-${name}`}>
            <h5 className="font-bold">
              {extension} {name}
            </h5>
            <div
              data-extension={extension.toLowerCase()}
              data-theme={name.toLowerCase()}
              className="flex items-center justify-center gap-2 px-10 py-5 bg-theme-secondary rounded"
            >
              <Story/>
            </div>
          </div>
        ))
      }
    </div>
  );
}

StoryAllThemes.propTypes = {
  themes: PropTypes.arrayOf(PropTypes.shape({
    extension: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
  })).isRequired,
};
