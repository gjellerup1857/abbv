import browser from "webextension-polyfill";
import {
  allowlistingResponseEvent,
  allowlistingTriggerEvent,
  apiFrameUrl,
  statusResponseEvent,
  statusTriggerEvent,
} from "../shared/constants.js";
import { mainExtensionApi } from "../content/main-extension-api.js";
import { mainPublicApi } from "../content/main-public-api.js";

const { short_name: extName } = browser.runtime.getManifest();

/**
 * Returns an MV2 script to inject into the page.
 *
 * @param {Function} injectedFunction The function to be injected into the page.
 * @param {any[]} params The parameters for the function.
 * @returns {string} The code to be injected into the main world context.
 */
function getMV2ScriptToInject(injectedFunction, ...params) {
  const args = JSON.stringify([...params]);
  // stringify injectedLib to escape backticks
  let code = JSON.stringify(injectedFunction.toString());
  code = `"(${code.slice(1, -1)}).apply(null,${JSON.stringify(args).slice(1, -1)});"`;
  let executable = `function injectScriptInMainContext(executable) {
      // injecting phases
      let script = document.createElement("script");
      script.type = "application/javascript";
      script.async = false;

      // Firefox 58 only bypasses site CSPs when assigning to 'src',
      // while Chrome 67 and Microsoft Edge (tested on 44.17763.1.0)
      // only bypass site CSPs when using 'textContent'.
      if (typeof netscape != "undefined" && typeof browser != "undefined") {
        let url = URL.createObjectURL(new Blob([executable]));
        script.src = url;
        document.documentElement.appendChild(script);
        URL.revokeObjectURL(url);
      } else {
        script.textContent = executable;
        document.documentElement.appendChild(script);
      }

      document.documentElement.removeChild(script);
    };
    {
      const executable = ${code};
      injectScriptInMainContext(executable);
    }`;
  return executable;
}

/**
 * Injects a script into the main world context of a frame
 *
 * @param {object} details The details for the
 * @param {number} details.tabId The id of the tab
 * @param {number} details.frameId The id of the frame
 * @param {Function} details.func The function to be inserted into main world
 * @param {any[]} details.args The parameters for the funtion.
 */
function injectScriptInFrame({ tabId, frameId, func, args }) {
  if (browser.scripting && browser.scripting.executeScript) {
    if (Object.values(browser.scripting.ExecutionWorld).includes("MAIN")) {
      console.log("injecting the script into main world MV3");
      browser.scripting.executeScript({
        target: { tabId, frameIds: [frameId] },
        world: "MAIN",
        injectImmediately: true,
        func,
        args,
      });

      return;
    }
  }

  const executable = getMV2ScriptToInject(func, ...args);
  console.log("injecting the script into main world MV2");
  browser.tabs.executeScript(tabId, {
    frameId,
    code: executable,
    matchAboutBlank: true,
    runAt: "document_start",
  });
}

/**
 * Starts the injection of the API into the main world context
 */
export function start() {
  browser.webNavigation.onCommitted.addListener(
    async (details) => {
      // Only inject in iframes
      // if (details.frameId !== 0) {
      // }
      const { tabId, frameId } = details;
      injectScriptInFrame({
        tabId,
        frameId,
        func: mainExtensionApi,
        args: [
          {
            allowlistingTriggerEvent,
            allowlistingResponseEvent,
            statusTriggerEvent,
            statusResponseEvent,
            extName,
          },
        ],
      });

      injectScriptInFrame({
        tabId,
        frameId,
        func: mainPublicApi,
      });
    },
    { url: [{ urlMatches: apiFrameUrl }] },
  );
}
