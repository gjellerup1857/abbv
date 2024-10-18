import React, { useState } from "react";
import { GeneralOptionsList } from "./Options";

const optionsData = [
  {
    name: 'acceptable_ads',
    text: 'acceptableadsoption',
    helpLink: 'https://helpcenter.getadblock.com/hc/en-us/articles/9738480686483-About-the-Acceptable-Ads-program-and-non-intrusive-ads',
    subOptions: [
      {
        name: 'acceptable_ads_privacy',
        text: 'acceptable_ads_privacy',
        helpLink: 'https://helpcenter.getadblock.com/hc/en-us/articles/9738459986707-About-Acceptable-Ads-and-Third-Party-Tracking',
      }
    ],
  },
  {
    name: 'enable_youtube_channel_whitelist',
    text: 'allow_whitelisting_youtube_channels2',
    extraInfo: 'require_restart_browser',
    subOptions: [
      {
        name: 'enable_youtube_manage_subscribed',
        text: 'youtube_manage_subscribed',
        helpLink: 'https://helpcenter.getadblock.com/hc/en-us/articles/9738459986707-About-Acceptable-Ads-and-Third-Party-Tracking',
      }
    ],
    helpLink: 'https://helpcenter.getadblock.com/hc/en-us/articles/9738502154131-Can-I-use-AdBlock-and-still-allow-ads-on-my-favorite-YouTube-channels',
    // TODO (options): Currently calls browser.tabs.create({ url: "https://www.youtube.com/feed/channels" }); Follow up on difference, since example works fine.
    additionalInfoLink: {
      text: 'settings',
      href: 'https://www.youtube.com/feed/channels'
    }
  },
  {
    name: 'enable_twitch_channel_allowlist',
    text: 'allowlisting_twitch_channels',
    extraInfo: 'require_restart_browser',
    helpLink: 'https://helpcenter.getadblock.com/hc/en-us/articles/9738502507283-Does-AdBlock-block-ads-on-Twitch',
  },
  {
    name: 'prefs__shouldShowBlockElementMenu',
    text: 'showcontextmenus2',
  },
  {
    name: 'prefs__show_statsinicon',
    text: 'show_on_adblock_button',
  },
  {
    name: 'enable_display_menu_stats',
    text: 'show_on_adblock_menu',
  },
  {
    name: 'prefs__show_devtools_panel',
    text: 'show_devtools_panel',
  },
  {
    name: 'prefs__data_collection_opt_out',
    text: 'data_collection_opt_out',
    subOptions: [
       {
         name: 'enable_data_collection_v2',
         text: 'datacollectionoption',
         helpLink: 'https://helpcenter.getadblock.com/hc/en-us/articles/9738517370259-About-AdBlock-s-opt-in-anonymous-filter-list-usage-and-data-collection',
       },
       {
         name: 'prefs__send_ad_wall_messages',
         text: 'allow_ad_wall_messages',
         helpLink: 'https://helpcenter.getadblock.com/hc/en-us/articles/22696374171027/',
       },
       {
         name: 'enable_onpageMessages',
         text: 'onpage_messages',
       },
    ],
  },
  {
    name: 'enable_show_advanced_options',
    text: 'advanced_options2',
  },
  {
    name: 'enable_debug_logging',
    text: 'debuginlogoption2',
    extraInfo: 'slows_down_extension',
  },
];

export function App() {
  return (
    <GeneralOptionsList items={ optionsData } />
  );
}
