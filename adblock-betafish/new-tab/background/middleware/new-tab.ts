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

import {
  Command,
  CommandHandler,
  CommandName,
  defaultLicenseState,
  ParamDefinitionList,
  isSafeUrl,
  isValidLicenseStates,
  setCommandActor,
  validateParams,
} from '../../../ipm/background';
import * as logger from '~/utilities/background';
import {
  NewTabBehavior,
  NewTabCommand,
  NewTabParams,
} from './new-tab.types';
import { determineUserLanguage } from '../../../utilities/background/bg-functions';

/**
 * List of new tab parameter definitions
 */
const paramDefinitionList: ParamDefinitionList<NewTabParams> = [
  {
    name: 'url',
    validate: isSafeUrl,
  },
  {
    name: 'license_state_list',
    validate: isValidLicenseStates,
  },
];

/**
 * Determines if this installation should ignore the
 * 'create_tab' command by checking the user's language
 *
 * @returns Whether the command should be processed
 */
function shouldIgnoreCommand(): boolean {
  const languagesToIgnore = ['en', 'fr', 'de', 'es', 'nl'];
  const userLanguage = determineUserLanguage().substring(0, 2);
  return languagesToIgnore.includes(userLanguage);
}

/**
 * Runs parameter validation on the given command to check whether it can be
 * worked with. Will log validation errors.
 *
 * @param command The command to check
 * @returns Whether the command is a valid NewTabCommand and can be worked with
 */
function isNewTabCommand(command: Command): command is NewTabCommand {
  if (shouldIgnoreCommand()) {
    logger.error('[new-tab]: create-tab commands are currently disabled for this locale');
    return false;
  }
  const validationErrors = validateParams(command, paramDefinitionList);
  if (validationErrors.length === 0) {
    return true;
  }

  logger.error(
    '[new-tab]: Invalid parameters received:',
    validationErrors.join(' '),
  );
  return false;
}

/**
 * Checks whether given candidate is new tab behavior
 *
 * @param candidate - Candidate
 *
 * @returns whether given candidate is new-tab behavior
 */
export function isNewTabBehavior(
  candidate: unknown,
): candidate is NewTabBehavior {
  return (
    candidate !== null
    && typeof candidate === 'object'
    && 'target' in candidate
  );
}

/**
 * Extracts new tab behavior from command
 *
 * @param command - Command
 *
 * @returns null
 */
function getBehavior(command: Command): NewTabBehavior | null {
  if (!isNewTabCommand(command)) {
    return null;
  }

  return {
    target: command.url,
    license_state_list: command.license_state_list || defaultLicenseState,
  };
}

/**
 * Extracts new tab content from command
 * Currently there is no content in the IPM Command
 * so it returns null
 *
 * @param command - Command
 *
 * @returns null
 */
function getContent(): null {
  return null;
}

/**
 * Sets new tab command handler
 *
 * @param handler - Command handler
 */
export function setNewTabCommandHandler(handler: CommandHandler): void {
  setCommandActor(CommandName.createTab, {
    getBehavior,
    getContent,
    handleCommand: handler,
    isValidCommand: isNewTabCommand,
  });
}
