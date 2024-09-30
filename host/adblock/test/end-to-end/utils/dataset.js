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
  { name: "easylist_plus_arabic_plus_french", text: "Arabic + French + EasyList" },
  { name: "easylist_plus_bulgarian", text: "Bulgarian + EasyList" },
  { name: "chinese", text: "Chinese + EasyList" },
  { name: "czech", text: "Czech & Slovak + EasyList" },
  { name: "dutch", text: "Dutch + EasyList" },
  { name: "easylist_plus_french", text: "French + EasyList" },
  { name: "easylist_plus_german", text: "German + EasyList" },
  { name: "easylist_plus_global", text: "Global + EasyList" },
  { name: "israeli", text: "Hebrew + EasyList" },
  { name: "easylist_plus_hungarian", text: "Hungarian + EasyList" },
  { name: "easylist_plus_indian", text: "IndianList + EasyList" },
  { name: "easylist_plus_indonesian", text: "Indonesian + EasyList" },
  { name: "italian", text: "Italian + EasyList" },
  { name: "japanese", text: "Japanese" },
  { name: "easylist_plun_korean", text: "Korean" },
  { name: "latvian", text: "Latvian + EasyList" },
  { name: "easylist_plus_lithuania", text: "Lithuanian + EasyList" },
  { name: "nordic", text: "Nordic Filters + EasyList" },
  { name: "easylist_plus_polish", text: "Polish" },
  { name: "easylist_plus_portuguese", text: "Portuguese + EasyList" },
  { name: "easylist_plus_romanian", text: "Romanian + EasyList" },
  { name: "russian", text: "Russian & Ukrainian + EasyList" },
  { name: "easylist_plus_spanish", text: "Spanish" },
  { name: "turkish", text: "Turkish" },
  { name: "easylist_plus_vietnamese", text: "Vietnamese + EasyList" },
];

export function getDefaultFilterLists(browserName) {
  const aaEnabled = browserName !== "firefox";

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
