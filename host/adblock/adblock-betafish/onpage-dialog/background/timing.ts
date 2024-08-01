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

import { Tabs } from "webextension-polyfill";
import { domainSuffixes, parseDomains } from "adblockpluscore/lib/url";
import * as ewe from "@eyeo/webext-ad-filtering-solution";

import { Prefs } from "../../alias/prefs";

import * as logger from "../../utilities/background";
import { isFilterMetadata } from "../../polyfills/background";
import { DialogBehavior, Timing, isTiming } from "./middleware";
import { Stats } from "./stats.types";
import { configsStorageKey, TimingConfiguration } from "./timing.types";

/**
 * Timing configurations
 */
const knownConfigs = new Map<Timing, TimingConfiguration>();

/**
 * Retrieves time at which given tab was web-allowlisted. If more than one
 * web-allowlisting filters apply to the tab, only one will be considered.
 *
 * @param tabId - Tab ID
 *
 * @returns time at which given tab was web-allowlisted, or `null` if tab
 *   is not web-allowlisted
 */
async function getAllowlistingTime(tabId: number): Promise<number | null> {
  const allowlistingFilterTexts = await ewe.filters.getAllowingFilters(tabId);
  if (allowlistingFilterTexts.length === 0) {
    return null;
  }

  /* eslint-disable no-await-in-loop */
  for (const filterText of allowlistingFilterTexts) {
    const metadata = await ewe.filters.getMetadata(filterText);
    if (!isFilterMetadata(metadata)) {
      continue;
    }

    if (metadata.origin !== "web") {
      continue;
    }

    return metadata.created;
  }

  return null;
}

/**
 * Checks whether given candidate is on-page UI timing configuration
 *
 * @param candidate - Candidate
 *
 * @returns whether given candidate is on-page UI timing configuration
 */
function isTimingConfiguration(candidate: unknown): candidate is TimingConfiguration {
  return (
    candidate !== null &&
    typeof candidate === "object" &&
    "cooldownDuration" in candidate &&
    "maxDisplayCount" in candidate
  );
}

/**
 * Checks whether the given timestamp is within the given number of minutes
 * in the past
 *
 * @param timestamp - Timestamp
 * @param minutes - Number of minutes in the past
 *
 * @returns whether the given timestamp is old enough
 */
function isWithin(timestamp: number, minutes: number): boolean {
  return timestamp < Date.now() - minutes * 60 * 1000;
}

/**
 * Initializes timing configurations from preferences
 */
function initializeConfigs(): void {
  const configs = Prefs.get(configsStorageKey);
  for (const [timing, config] of Object.entries(configs)) {
    if (!isTiming(timing) || !isTimingConfiguration(config)) {
      logger.warn("[onpage-dialog] Unknown timing configuration", timing);
      continue;
    }

    knownConfigs.set(timing, config);
  }
  logger.debug("[onpage-dialog]: Known timing configurations", knownConfigs);
}

/**
 * Determines whether command should be dismissed
 *
 * @param timing - Timing name
 * @param stats - On-page stats
 *
 * @returns whether command should be dismissed
 */
export function shouldBeDismissed(timing: Timing, stats: Stats): boolean {
  const config = knownConfigs.get(timing);
  if (!config) {
    logger.debug("[onpage-dialog]: Unknown timing");
    return true;
  }

  logger.debug("[onpage-dialog]: Display count", `${stats.displayCount}/${config.maxDisplayCount}`);
  return stats.displayCount >= config.maxDisplayCount;
}

/**
 * Checks whether the tab URL is a match to the domain(s) on the command
 * @param tabDomain - the domain of the tab
 * @param domains - the domains
 * @return true if the tab URL is a match to the domain(s) on the command
 */
const isActiveOnDomain = function (tabDomain: string, domains: Map<string, boolean>): boolean {
  // If no domains are set the rule matches everywhere
  if (!domains) {
    return true;
  }
  let docDomain = tabDomain;
  if (docDomain === null) {
    docDomain = "";
  } else if (docDomain[docDomain.length - 1] === ".") {
    docDomain = docDomain.substring(0, docDomain.length - 1);
  }
  // If the document has no host name, match only if the command
  // isn't restricted to specific domains
  if (!docDomain) {
    return !!domains.get("");
  }

  for (docDomain of domainSuffixes(docDomain)) {
    const isDomainIncluded = domains.get(docDomain);
    if (typeof isDomainIncluded !== "undefined") {
      return isDomainIncluded;
    }
  }

  return !!domains.get("");
};

/**
 * Determines whether afterNavigation command should be shown
 *
 * @param behavior - Behavior for the command
 * @param tab - Tab
 * @param stats - On-page stats
 *
 * @returns whether command should be shown
 */
function shouldBeShownForAfterNavigation(
  behavior: DialogBehavior,
  tab: Tabs.Tab,
  stats: Stats,
): boolean {
  const { timing } = behavior;
  // Ignore commands that should have already been dismissed
  if (shouldBeDismissed(timing, stats)) {
    logger.debug("[onpage-dialog]: No more dialogs to show for command");
    return false;
  }
  // if there are no domains, then it should be shown
  if (!behavior.domain_list) {
    return true;
  }
  const parsedDomains = parseDomains(behavior.domain_list, ",");
  if (!parsedDomains) {
    return true;
  }
  const tabURL = new URL(tab.url || "");
  return isActiveOnDomain(tabURL.hostname, parsedDomains);
}

/**
 * Determines whether afterWebAllowlisting or the
 * revisitWebAllowlisted command should be shown
 *
 * @param behavior - Behavior for the command
 * @param tab - Tab
 * @param stats - On-page stats
 *
 * @returns whether command should be shown
 */
async function shouldBeShownForAfterWebAllowlisting(
  behavior: DialogBehavior,
  tab: Tabs.Tab,
  stats: Stats,
): Promise<boolean> {
  const { timing } = behavior;
  const tabId = tab.id || 0;
  const config = knownConfigs.get(timing);
  if (!config) {
    logger.debug("[onpage-dialog]: Unknown timing");
    return false;
  }
  const allowlistingTime = await getAllowlistingTime(tabId);
  if (allowlistingTime === null) {
    logger.debug("[onpage-dialog]: Not allowlisted");
    return false;
  }

  // Ignore if allowlisting happened too long ago
  if (
    typeof config.maxAllowlistingDelay === "number" &&
    isWithin(allowlistingTime, config.maxAllowlistingDelay)
  ) {
    logger.debug("[onpage-dialog]: Allowlisted too long ago");
    return false;
  }

  // Ignore if allowlisting happened too recently
  if (
    typeof config.minAllowlistingDelay === "number" &&
    !isWithin(allowlistingTime, config.minAllowlistingDelay)
  ) {
    logger.debug("[onpage-dialog]: Allowlisted too recently");
    return false;
  }

  // Wait a bit before triggering command again
  if (!isWithin(stats.lastDisplayTime, config.cooldownDuration * 60)) {
    logger.debug("[onpage-dialog]: Dialog shown too recently");
    return false;
  }

  // Ignore commands that should have already been dismissed
  if (shouldBeDismissed(timing, stats)) {
    logger.debug("[onpage-dialog]: No more dialogs to show for command");
    return false;
  }

  // Check if there are domains for the command
  if (behavior.domain_list) {
    const parsedDomains = parseDomains(behavior.domain_list, ",");
    if (!parsedDomains) {
      return true;
    }
    const tabURL = new URL(tab.url || "");
    return isActiveOnDomain(tabURL.hostname, parsedDomains);
  }
  return true;
}
/**
 * Determines whether command should be shown
 *
 * @param timing - Timing
 * @param tab - Tab
 * @param stats - On-page stats
 *
 * @returns whether command should be shown
 */
export async function shouldBeShown(
  behavior: DialogBehavior,
  tab: Tabs.Tab,
  stats: Stats,
): Promise<boolean> {
  const { timing } = behavior;

  if (Timing.afterNavigation === timing) {
    return shouldBeShownForAfterNavigation(behavior, tab, stats);
  }
  if (Timing.afterWebAllowlisting === timing || Timing.revisitWebAllowlisted === timing) {
    return shouldBeShownForAfterWebAllowlisting(behavior, tab, stats);
  }
  return false;
}

/**
 * Initializes timing module
 */
export async function start(): Promise<void> {
  await Prefs.untilLoaded;

  initializeConfigs();

  Prefs.on(configsStorageKey, () => {
    initializeConfigs();
  });
}
