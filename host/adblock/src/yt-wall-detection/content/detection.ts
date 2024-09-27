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

import * as browser from "webextension-polyfill";
import { youTubeWallDetected, youTubeNavigation } from "../shared/index";

/**
 * CSS selector identifying YouTube ad wall element
 */
const adWallSelector = "ytd-enforcement-message-view-model";

/**
 * CSS selector identifying YouTube Avatar element
 */
const userAvatarSelector = "button#avatar-btn";

/**
 * Checks whether given candidate is a DOM element
 *
 * @param candidate - Candidate
 *
 * @returns whether given candidate is a DOM element
 */
function isElement(candidate: unknown): candidate is Element {
  return candidate instanceof Element;
}

/**
 * Handles DOM modifications to check whether a matching element got added
 * to the DOM
 *
 * @param mutations - DOM modifications
 */
function handleMutations(mutations: MutationRecord[]): void {
  const matchingElementFound = mutations.some(({ addedNodes }) => {
    const addedArrayNodes = Array.from(addedNodes);
    return addedArrayNodes.some((node) => isElement(node) && node.matches(adWallSelector));
  });

  if (matchingElementFound) {
    const userLoggedIn = document.querySelectorAll(userAvatarSelector).length > 0;
    void browser.runtime.sendMessage({ type: youTubeWallDetected, userLoggedIn });
  }
}

/**
 * Initializes YouTube ad wall detection feature
 */
function initializeObserver(): void {
  /**
   * Mutation observer to detect when a matching element gets added to the DOM
   */
  const observer = new MutationObserver(handleMutations);
  observer.observe(document, {
    attributes: false,
    childList: true,
    characterData: false,
    subtree: true,
  });
}

/**
 * Send the initial navigation message to background page
 */
function logInitialEvent(): void {
  const userLoggedIn = document.querySelectorAll(userAvatarSelector).length > 0;
  void browser.runtime.sendMessage({ type: youTubeNavigation, userLoggedIn });
}

/**
 * Handle the load event
 */
function handleLoadEvent(event: any): void {
  window.onload = null;
  setTimeout(() => {
    logInitialEvent();
  }, 5000);
}

/**
 * Check if the content script is in the top most document
 * if not, stop
 */
function checkWindow(): void {
  if (window.parent !== window) {
    return;
  }
  window.onload = handleLoadEvent;
}

/**
 * Initializes YouTube ad wall detection feature
 */
function start(): void {
  initializeObserver();
  checkWindow();
}

start();
