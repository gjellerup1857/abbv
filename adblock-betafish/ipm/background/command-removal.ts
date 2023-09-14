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

import * as browser from 'webextension-polyfill';
import * as logger from '../../utilities/background';
import { removeAllCommands, commandLibraryStarted } from './command-library';
import { CommandName } from './command-library.types';

async function start() {
  browser.runtime.onInstalled.addListener(async (details) => {
    const currentVersion = browser.runtime.getManifest().version;
    if (details.reason === 'update' && currentVersion === '5.10.1') {
      await commandLibraryStarted;
      void removeAllCommands(CommandName.createTab);
    }
  });
}

void start().catch(logger.error);
