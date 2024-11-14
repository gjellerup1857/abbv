/**
 * This file is part of eyeo's Public API fragment,
 * Copyright (C) 2024-present eyeo GmbH

 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.

 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.

 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

/**
 * Returns an MV2 script to inject into the page.
 *
 * @param {callback} injectedFunction The function to be injected into the page.
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
export function injectScriptInFrame({ tabId, frameId, func, args }) {
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
