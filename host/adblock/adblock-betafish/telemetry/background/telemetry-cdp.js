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

import * as ewe from "@eyeo/webext-ad-filtering-solution";

import { Prefs } from "~/alias/prefs";

async function updateCdpOptout() {
  await ewe.cdp.setOptOut(Prefs.get("data_collection_opt_out"));
}

export async function startCdpOptOutListener() {
  await Prefs.untilLoaded;

  await updateCdpOptout();
  Prefs.on("data_collection_opt_out", updateCdpOptout);
}
