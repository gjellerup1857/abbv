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

import { LicenseStateBehavior, Command } from '../../../ipm/background';

/**
 * New tab event names
 */
export enum NewTabEventType {
  created = 'tab_created',
  loaded = 'tab_loaded',
  received = 'received',
  has_content = 'has_content',
}

/**
 * New tab error event names
 */
export enum NewTabErrorEventType {
  noBehaviorFound = 'error_no_behavior',
  licenseStateNoMatch = 'license_state_no_match',
  noUrlFound = 'error_no_url',
  tabCreationError = 'tab_creation_error'
}

/**
 * New tab exit event names
 */
export enum NewTabExitEventType {
  admin = 'newtab_admin',
  disabled = 'newtab_disabled',
}

/**
 * New tab behavior
 */
export interface NewTabBehavior extends LicenseStateBehavior {
  /**
   * Target page to open
   */
  target: string;
}

/**
 * New tab command parameters
 */
export interface NewTabParams {
  url: string;
  license_state_list?: string;
}

/**
 * A valid IPM command for an new tab command.
 */
export type NewTabCommand = Command & NewTabParams;
