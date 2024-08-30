/*
 * This file is part of Adblock Plus <https://adblockplus.org/>,
 * Copyright (C) 2006-present eyeo GmbH
 *
 * Adblock Plus is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 3 as
 * published by the Free Software Foundation.
 *
 * Adblock Plus is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Adblock Plus.  If not, see <http://www.gnu.org/licenses/>.
 */

import { type Info } from "../../../info/shared";
import { type InjectionInfo } from "../../../info-injector/shared";
import { send } from "./utils";

/**
 * Retrieves extension information
 *
 * @returns extension information
 */
export async function get(): Promise<Info> {
  return await send("info.get");
}

/**
 * Retrieves information to be injected on extension's own websites
 *
 * @returns information to be injected on extension's own websites
 */
export async function getInjectionInfo(): Promise<InjectionInfo> {
  return await send("info.getInjectionInfo");
}
