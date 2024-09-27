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
  { id: "easylist_plus_arabic_plus_french", text: "Arabic + French + EasyList" },
  { id: "easylist_plus_bulgarian", text: "Bulgarian + EasyList" },
  { id: "chinese", text: "Chinese + EasyList" },
  { id: "czech", text: "Czech & Slovak + EasyList" },
  { id: "dutch", text: "Dutch + EasyList" },
  { id: "easylist_plus_french", text: "French + EasyList" },
  { id: "easylist_plus_german", text: "German + EasyList" },
  { id: "easylist_plus_global", text: "Global + EasyList" },
  { id: "israeli", text: "Hebrew + EasyList" },
  { id: "easylist_plus_hungarian", text: "Hungarian + EasyList" },
  { id: "easylist_plus_indian", text: "IndianList + EasyList" },
  { id: "easylist_plus_indonesian", text: "Indonesian + EasyList" },
  { id: "italian", text: "Italian + EasyList" },
  { id: "japanese", text: "Japanese" },
  { id: "easylist_plun_korean", text: "Korean" },
  { id: "latvian", text: "Latvian + EasyList" },
  { id: "easylist_plus_lithuania", text: "Lithuanian + EasyList" },
  { id: "nordic", text: "Nordic Filters + EasyList" },
  { id: "easylist_plus_polish", text: "Polish" },
  { id: "easylist_plus_portuguese", text: "Portuguese + EasyList" },
  { id: "easylist_plus_romanian", text: "Romanian + EasyList" },
  { id: "russian", text: "Russian & Ukrainian + EasyList" },
  { id: "easylist_plus_spanish", text: "Spanish" },
  { id: "turkish", text: "Turkish" },
  { id: "easylist_plus_vietnamese", text: "Vietnamese + EasyList" },
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