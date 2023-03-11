/*
 * This file is part of AdBlock  <https://getadblock.com/>,
 * Copyright (C) 2013-present  Adblock, Inc.
 *
 * AdBlock is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 3 as
 * published by the Free Software Foundation.
 *
 * AdBlock is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with AdBlock.  If not, see <http://www.gnu.org/licenses/>.
 */

/* For ESLint: List any global identifiers used in this file below */
/* global browser,
 */

import { getSettings } from '../prefs/background';
import { log } from '../utilities/background/bg-functions';

const OnPageIconManager = (function initialize() {
  const MAX_MSG_TEXT_LENGTH = 280;

  const isIconDataValid = function (iconData) {
    if (!iconData) {
      return false;
    }
    if (!iconData.msgText || !iconData.titleText || !iconData.titlePrefixText) {
      return false;
    }
    if (!iconData.buttonText && iconData.buttonURL) {
      return false;
    }
    if (iconData.buttonText && !iconData.buttonURL) {
      return false;
    }
    if (typeof iconData.buttonText !== 'string') {
      return false;
    }
    if (typeof iconData.msgText !== 'string') {
      return false;
    }
    if (typeof iconData.titlePrefixText !== 'string') {
      return false;
    }
    if (typeof iconData.titleText !== 'string') {
      return false;
    }
    if (iconData.buttonURL && typeof iconData.buttonURL !== 'string') {
      return false;
    }
    if (iconData.buttonURL && !iconData.buttonURL.startsWith('/')) {
      return false;
    }
    if (iconData.ctaIconURL && typeof iconData.ctaIconURL !== 'string') {
      return false;
    }
    return true;
  };

  const injectScript = async (tabId) => {
    try {
      if (browser.scripting) {
        await browser.scripting.executeScript({
          target: { tabId },
          files: ['purify.min.js'],
        });
      } else {
        await browser.tabs.executeScript({
          file: 'purify.min.js',
          allFrames: false,
        });
      }
    } catch (error) {
      log('Injection of DOM Purify failed', error);
    }
  };

  const injectStyle = async (tabId) => {
    try {
      if (browser.scripting) {
        await browser.scripting.insertCSS({
          target: { tabId },
          files: ['adblock-onpage-icon-user.css'],
        });
      } else {
        await browser.tabs.insertCSS({
          file: 'adblock-onpage-icon-user.css',
          allFrames: false,
          runAt: 'document_start',
        });
      }
    } catch (error) {
      log('Injection of on-page icon style failed', error);
    }
  };


  return {
    // shows / display the AdBlock annimated icon on the specified tab
    // Inputs: tabId : integer - the id of the tab
    //         tabUrl : string - the top level URL of the tab, used for confirmation purposes
    //         iconData : object - with the following:
    //             surveyId: string - unique survey id from ping server
    //             msgText : string - The text of the message (will truncate after 280 characters)
    //             titlePrefixText : string - The prefix title text in the speech bubble
    //             titleText : string - The title text in the speech bubble
    //             ctaIconURL : string (optional) - The hero image in SVG format
    //             buttonText : string (optional) - The text in the button
    //             buttonURL : string (optional) - only the path part of the URL,
    //                         required to start with a '/' character
    //                         the '/' indicates that a new tab should be opened on gab.com
    //                         (the extension will add the 'gab.com' prefix for security reasons)
    async showOnPageIcon(tabId, tabUrl, iconData) {
      if (!getSettings().onpageMessages) {
        log('OnPageIconManager:: settings.onpageMessages is false');
        return;
      }
      if (!isIconDataValid(iconData)) {
        log('OnPageIconManager:showOnPageIcon::isIconDataValid: false', iconData);
        return;
      }
      let { msgText } = iconData;
      if (msgText && msgText.length > MAX_MSG_TEXT_LENGTH) {
        msgText = msgText.slice(0, MAX_MSG_TEXT_LENGTH);
      }
      log('showOnPageIcon::iconData:', iconData);
      await injectStyle(tabId);
      await injectScript(tabId);
      const data = {
        command: 'showonpageicon',
        tabURL: tabUrl,
        titleText: iconData.titleText,
        titlePrefixText: iconData.titlePrefixText,
        msgText,
        surveyId: iconData.surveyId,
        buttonText: iconData.buttonText,
        buttonURL: iconData.buttonURL,
        ctaIconURL: iconData.ctaIconURL,
      };
      browser.tabs.sendMessage(tabId, data).catch((error) => {
        log('error', error);
      });
    }, // end of showOnPageIcon
  };
}());

export default OnPageIconManager;
