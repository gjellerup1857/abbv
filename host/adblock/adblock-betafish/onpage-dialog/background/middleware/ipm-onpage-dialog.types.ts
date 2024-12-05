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

import { type Command } from "../../../ipm/background";
import { type Timing } from "../timing.types";

/**
 * The default priority for dialog commands.
 */
export const defaultPriority = 1;

/**
 * On-page dialog command parameters
 */
export interface DialogParams {
  timing: Timing;
  display_duration?: number;
  sub_title: string;
  upper_body: string;
  lower_body?: string;
  button_label: string;
  button_target: string;
  domain_list?: string;
  license_state_list?: string;
  priority?: number;
}

/**
 * A valid IPM command for an on page dialog command.
 */
export type DialogCommand = Command & DialogParams;
