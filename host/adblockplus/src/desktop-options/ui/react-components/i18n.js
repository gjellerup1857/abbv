import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import HttpBackend from 'i18next-http-backend';

// Language to be used for the UI
const uiLanguage = browser.i18n.getUILanguage();
const baseLanguage = 'en-US';

/**
 *
 * @param {object} data
 * @returns {{}}
 */
const preprocessChromeMessages = (data) => {
  const processed = {};
  Object.keys(data).forEach((key) => {
    processed[key] = data[key].message; // Extract the 'message' field from the Chrome extension format
  });
  return processed;
};

i18n
  .use(HttpBackend)
  .use(initReactI18next)
  .init({
    lng: 'en', //uiLanguage,
    fallbackLng: baseLanguage,
    supportedLngs: [
      "af", "am", "ar", "as", "ast", "az", "be", "bg", "bn", "br", "bs", "ca", "cs",
      "cy", "da", "de", "dsb", "el", "en-GB", "en-US", "eo", "es", "es-AR", "es-CL",
      "es-MX", "et", "eu", "fa", "fi", "fil", "fr", "fy", "gl", "gu", "he", "hi", "hr",
      "hsb", "hu", "hy", "id", "is", "it", "ja", "ka", "kab", "kk", "kn", "ko", "lt",
      "lv", "mg", "mk", "ml", "mr", "ms", "nb", "nl", "nn", "pl", "pt-BR", "pt-PT",
      "rm", "ro", "ru", "si", "sk", "sl", "sq", "sr", "sv", "sw", "ta", "te", "th",
      "tr", "uk", "ur", "uz", "vi", "zh-CN", "zh-TW"
    ],
    // maxRetries: 0,
    debug: true,
    backend: {
      loadPath: (languages) => {
        // The language code is in the format 'en-US', but the folder is 'en_US'
        const lng = languages[0].replace('-', '_');
        return `/_locales/${lng}/messages.json`;
      },
      parse: (data) => preprocessChromeMessages(JSON.parse(data)),
    },

    // detection: {
    //   // Note: navigator is missing, because I want users to choose the language from the dropdown
    //   order: ['querystring', 'localStorage', 'htmlTag'],
    // },
  });

export default i18n;
