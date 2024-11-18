/*
 * This file is part of AdBlock  <https://getadblock.com/>,
 * Copyright (C) 2024-present  Adblock, Inc.
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

export const languageFilterLists = [
  {
    name: "easylist_plus_arabic_plus_french",
    text: "Arabic + French + EasyList",
    inputId: "languageFilterList_0",
  },
  {
    name: "easylist_plus_bulgarian",
    text: "Bulgarian + EasyList",
    inputId: "languageFilterList_1",
  },
  {
    name: "chinese",
    text: "Chinese + EasyList",
    inputId: "languageFilterList_2",
  },
  {
    name: "czech",
    text: "Czech & Slovak + EasyList",
    inputId: "languageFilterList_3",
  },
  {
    name: "dutch",
    text: "Dutch + EasyList",
    inputId: "languageFilterList_4",
  },
  {
    name: "easylist_plus_french",
    text: "French + EasyList",
    inputId: "languageFilterList_5",
  },
  {
    name: "easylist_plus_german",
    text: "German + EasyList",
    inputId: "languageFilterList_6",
  },
  {
    name: "easylist_plus_global",
    text: "Global + EasyList",
    inputId: "languageFilterList_7",
  },
  {
    name: "israeli",
    text: "Hebrew + EasyList",
    inputId: "languageFilterList_8",
  },
  {
    name: "easylist_plus_hungarian",
    text: "Hungarian + EasyList",
    inputId: "languageFilterList_9",
  },
  {
    name: "easylist_plus_indian",
    text: "IndianList + EasyList",
    inputId: "languageFilterList_10",
  },
  {
    name: "easylist_plus_indonesian",
    text: "Indonesian + EasyList",
    inputId: "languageFilterList_11",
  },
  {
    name: "italian",
    text: "Italian + EasyList",
    inputId: "languageFilterList_12",
  },
  {
    name: "japanese",
    text: "Japanese",
    inputId: "languageFilterList_13",
  },
  {
    name: "easylist_plun_korean",
    text: "Korean",
    inputId: "languageFilterList_14",
  },
  {
    name: "latvian",
    text: "Latvian + EasyList",
    inputId: "languageFilterList_15",
  },
  {
    name: "easylist_plus_lithuania",
    text: "Lithuanian + EasyList",
    inputId: "languageFilterList_16",
  },
  {
    name: "nordic",
    text: "Nordic Filters + EasyList",
    inputId: "languageFilterList_17",
  },
  {
    name: "easylist_plus_polish",
    text: "Polish",
    inputId: "languageFilterList_18",
  },
  {
    name: "easylist_plus_portuguese",
    text: "Portuguese + EasyList",
    inputId: "languageFilterList_19",
  },
  {
    name: "easylist_plus_romanian",
    text: "Romanian + EasyList",
    inputId: "languageFilterList_20",
  },
  {
    name: "russian",
    text: "Russian & Ukrainian + EasyList",
    inputId: "languageFilterList_21",
  },
  {
    name: "easylist_plus_spanish",
    text: "Spanish",
    inputId: "languageFilterList_22",
  },
  {
    name: "turkish",
    text: "Turkish",
    inputId: "languageFilterList_23",
  },
  {
    name: "easylist_plus_vietnamese",
    text: "Vietnamese + EasyList",
    inputId: "languageFilterList_24",
  },
];

export function getDefaultFilterLists() {
  const aaEnabled = browserDetails.browserName !== "firefox";

  return [
    {
      name: "acceptable_ads",
      inputId: "adblockFilterList_0",
      text: "Acceptable Ads",
      enabled: aaEnabled,
    },
    {
      name: "acceptable_ads_privacy",
      inputId: "adblockFilterList_1",
      text: "Only allow ads without third-party tracking",
      enabled: false,
    },
    {
      name: "anticircumvent",
      inputId: "adblockFilterList_2",
      text: "Anti-Circumvention filters",
      enabled: true,
    },
    { name: "easylist", inputId: "adblockFilterList_3", text: "EasyList", enabled: true },
    {
      name: "warning_removal",
      inputId: "otherFilterList_0",
      text: "Adblock Warning Removal list",
      enabled: false,
    },
    {
      name: "antisocial",
      inputId: "otherFilterList_1",
      text: "Antisocial filter list",
      enabled: false,
    },
    {
      name: "bitcoin_mining_protection",
      inputId: "otherFilterList_2",
      text: "Cryptocurrency (Bitcoin) Mining Protection List",
      enabled: false,
    },
    {
      name: "easyprivacy",
      inputId: "otherFilterList_3",
      text: "EasyPrivacy (privacy protection)",
      enabled: false,
    },
    {
      name: "annoyances",
      inputId: "otherFilterList_4",
      text: "Fanboy's Annoyances",
      enabled: false,
    },
    {
      name: "fb_notifications",
      inputId: "otherFilterList_5",
      text: "Fanboy's Notifications (blocks in-page pop-ups, social media and related widgets, and other annoyances)",
      enabled: false,
    },
    {
      name: "idcac",
      inputId: "otherFilterList_6",
      text: "I Don't Care About Cookies",
      enabled: false,
    },
  ];
}

export const premiumFilterLists = [
  { inputId: "distraction-control", text: "Distraction Control" },
  { inputId: "cookies-premium", text: "Cookie Consent Cutter" },
];
