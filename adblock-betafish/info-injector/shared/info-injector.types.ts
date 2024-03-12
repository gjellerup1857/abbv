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

/**
 * A list of origins where we want to inject the info.
 */
export const injectionOrigins = [
  'https://adblockplus.org',
  'https://accounts.adblockplus.org',
  'https://new.adblockplus.org',
  'https://welcome.adblockplus.org',
  'https://getadblock.com',
  'https://vpn.getadblock.com',
];

/**
 * The name of the command we send in a message to the background page.
 */
export const getInfoCommand = 'getInjectionInfo';

/**
 * The info we inject.
 */
export interface InjectionInfo {
  /**
   * Whether the user is a premium user
   */
  isPremium: boolean;
  /**
   * The version of the extension
   */
  version: string;
  /**
   * The user id
   */
  id: string;
}
