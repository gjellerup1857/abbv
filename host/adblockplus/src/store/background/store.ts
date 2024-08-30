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

import { BehaviorSubject } from "rxjs";

export const store = {
  /**
   * Address on adblockplus.org to be opened for documentation links.
   *
   * @see https://adblockplus.org/en/preferences#documentation_link
   */
  documentationLink: new BehaviorSubject(
    "https://adblockplus.org/redirect?link=%LINK%&lang=%LANG%"
  ),

  /**
   * The interval in which to ping the IPM server, in ms. Defaults to 24 hours.
   */
  ipmPingInterval: new BehaviorSubject(24 * 60 * 60 * 1000)
};
