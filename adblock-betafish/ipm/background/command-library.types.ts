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
 * The version of the Command Library built into this extension.
 */
export const commandLibraryVersion = 1;

/**
 * Command behavior
 */
export interface Behavior { }

/**
 * Handler that gets called when command gets executed
 */
export type CommandHandler = (ipmId: string) => void;

/**
 * An enum containing all known command names.
 */
export enum CommandName {
    createOnPageDialog = 'create_on_page_dialog',
    createTab = 'create_tab'
}

/**
 * The required IPM command meta data.
 */
export interface CommandMetaData {
    /**
     * The command library version.
     */
    version: number;
    /**
     * The name of the command.
     */
    command_name: CommandName;
    /**
     * The IPM id.
     */
    ipm_id: string;
}

/**
 * The interface describing a valid IPM command.
 */
export type Command = CommandMetaData & Record<string, unknown>;

/**
 * Command content
 */
export interface Content { }

/**
 * Command actor
 */
export interface CommandActor {
    /**
     * Retrieves the actor-specific command behavior
     *
     * @param command - Command
     */
    getBehavior: (command: Command) => Behavior | null;
    /**
     * Retrieves the actor-specific command content
     *
     * @param command - Command
     */
    getContent: (command: Command) => Content | null;
    /**
     * Handles given command
     */
    handleCommand: CommandHandler;
    /**
     * Checks whether the given command is valid for the actor
     *
     * @returns whether the given command is valid for the actor
     */
    isValidCommand: (command: Command) => boolean;
}