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
  frameId?: number;
  /**
   * Types of filters to consider
   */
  types?: string[];
}

declare module "@eyeo/webext-ad-filtering-solution" {
  /**
   * Extra data associated with a filter.
   *
   * The SDK doesn't specify the type allowed for metadata entries.
   */
  type FilterMetadata = Record<string, any>;

  /**
   * Represents a single filter rule and its state.
   */
  interface Filter {
    /**
     * A {@link https://help.eyeo.com/adblockplus/how-to-write-filters|filter}
     * rule that specifies what content to block or to allow.
     * Used to identify a filter.
     */
    text: string;
    /**
     * Indicates whether this filter would be applied. Filters are enabled by
     * default. For comment filters returned value is null.
     */
    enabled: boolean | null;
    /**
     * For element hiding emulation filters, true if the filter will remove elements from the DOM rather hiding them.
     */
    remove?: boolean;
    /**
     * Indicates that this filter is not subject to an internal optimization.
     * Filters that are considered slow should be avoided.
     * Only URLFilters can be slow.
     */
    slow: boolean;
    /**
     * The filter {@link https://gitlab.com/eyeo/adblockplus/abc/adblockpluscore/-/jobs/artifacts/0.6.0/file/build/docs/module-filterClasses.Filter.html?job=docs#type|type}
     */
    type: string;
    /**
     * True when the filter applies to third-party, false to first-party,
     * null otherwise.
     */
    thirdParty: boolean | null;
    /**
     * CSS selector for the HTML elements that will be hidden.
     */
    selector: string | null;
    /**
     * Content Security Policy to be injected.
     */
    csp: string | null;
  }
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
      options?: FiltersGetAllowingFiltersOptions,
    ) => Promise<string[]>;

    /**
     * Returns an extra data associated with a filter
     *
     * @param text - Filter text
     *
     * @returns filter metadata
     */
    const getMetadata: (text: string) => Promise<?FilterMetadata>;

    /**
     * Returns an array of user filter objects.
     *
     * @returns user filter objects
     */
    const getUserFilters: () => Promise<Filter[]>;

    /**
     * Sets metadata for a filter
     *
     * @param text - Filter text
     * @param metadata - Metadata to set
     */
    const setMetadata: (text: string, metadata: FilterMetadata) => Promise<void>;

    /**
     * Adds filter(s)
     *
     * @param text - Filter text
     * @param metadata - Metadata to set
     */
    const add: (text: string|[string], metadata?: FilterMetadata) => Promise<void>;

    /**
     * remove filter(s)
     *
     * @param text - Filter text
     */
    const remove: (text: string|[string]) => Promise<void>;
  }

  declare namespace experiments {
    /**
     * Returns the assignments for the user
     */
    const getAssignments: () => Promise<Record<string, string>>;

    /**
     * Returns the value of the flag
     */
    const getFlag: (flag: string) => Promise<boolean | string | number | strings[] | null>;
  }

  declare namespace notifications {
    /**
     * Returns the list of ignored notification categories
     */
    const getIgnoredCategories: () => string[];
  }
}
