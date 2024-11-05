/**
 * This file is part of eyeo's YouTube ad wall detection fragment,
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

import { chrome } from "vitest-chrome/lib/index.esm";

// The following code will initialize the 'chrome' proxy correctly
// so that the webextension-polyfill throw an error when loaded below
Object.assign(global, { chrome });
chrome.runtime.id = "test id";

const invokeAndResetMock = (...args) => {
  const callback = args[args.length - 1]; // the last argument is always the callback
  callback(); // call the callback with your expected callback args
};

chrome.runtime.sendMessage.mockImplementation((...args) => {
  invokeAndResetMock(args);
});

chrome.tabs.sendMessage.mockImplementation((...args) => {
  invokeAndResetMock(args);
});

chrome.tabs.reload.mockImplementation((...args) => {
  invokeAndResetMock(args);
});

chrome.tabs.update.mockImplementation((...args) => {
  invokeAndResetMock(args);
});

// We need to require this after we setup vitest-chrome
const browser = require("webextension-polyfill");
Object.assign(global, { browser });
