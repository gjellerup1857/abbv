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
 * Options for retrieving filters
 */
interface FiltersGetAllowingFiltersOptions {
    /**
     * ID of the frame to look up
     */
    frameId?: number = 0;
    /**
     * Types of filters to consider
     */
    types?: string[] = ["document"];
}

declare module "@eyeo/webext-sdk" {
    declare namespace filters {
        /**
         * Returns the allowing filters that will be effective when the given
         * document will be reloaded
         */
        const getAllowingFilters: (
            /**
             * ID of tab to look up
             */
            tabId: number,
            /**
             * Options for retrieving filters
             */
            options?: FiltersGetAllowingFiltersOptions
        ) => Promise<string[]>;

        /**
         * Returns an extra data associated with a filter
         *
         * @param text - Filter text
         *
         * @returns filter metadata
         */
        const getMetadata: (text: string) => Promise<?object>;
    }

    declare namespace notifications {
        /**
         * Returns the list of ignored notification categories
         */
        const getIgnoredCategories: () => string[];
    }
}
