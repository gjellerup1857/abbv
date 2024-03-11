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
import { injectionOrigins, type InjectionInfo, getInfoCommand } from "../shared";
import { nodeId } from "./info-injector.types";

/**
 * Gets a reference to the document of the page to inject the element into.
 *
 * @returns A reference to the document
 */
function getDocumentReference(): Document {
  return window.document;
}

/**
 * Fetches the info that we want to inject.
 *
 * @returns The info that we want to inject
 */
async function getInfo(): Promise<InjectionInfo> {
  return browser.runtime.sendMessage({ command: getInfoCommand });
}

/**
 * Creates the info element that we want to inject into the page.
 *
 * @param document The document reference to create the element with
 * @param info The info to add to the element
 * @returns The element containing the info
 */
function createInfoElement(document: Document, info: InjectionInfo): HTMLDivElement {
  const element = document.createElement("div");
  element.id = nodeId;
  element.style.display = "none";
  element.textContent = JSON.stringify(info);
  return element;
}

/**
 * Checks if the given origin is relevant for us, and if we want to inject
 * the info element here.
 *
 * @param origin The origin to check
 * @returns Whether the given origin is relevant for us
 */
function isRelevantOrigin(origin: string): boolean {
  return injectionOrigins.includes(origin);
}

/**
 * Injects an element containing info about the extension.
 */
async function injectInfoElement(): Promise<void> {
  const document = getDocumentReference();

  if (!isRelevantOrigin(document.location.origin)) {
    return;
  }

  const info = await getInfo();
  const element = createInfoElement(document, info);

  document.addEventListener("DOMContentLoaded", () => {
    document.body.appendChild(element);
  });
}

/**
 * Starts the info-injector feature.
 */
function start(): void {
  void injectInfoElement();
}

start();
