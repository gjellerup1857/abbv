import React, { useState } from "react";
import { OptionsList } from "./OptionsList";

const optionsData = [
  {
    name: "acceptable_ads",
    textKey: "acceptableadsoption",
    helpLink:
      "https://helpcenter.getadblock.com/hc/en-us/articles/9738480686483-About-the-Acceptable-Ads-program-and-non-intrusive-ads",
    subOptions: [
      {
        name: "acceptable_ads_privacy",
        textKey: "acceptable_ads_privacy",
        helpLink:
          "https://helpcenter.getadblock.com/hc/en-us/articles/9738459986707-About-Acceptable-Ads-and-Third-Party-Tracking",
      },
    ],
  },
  {
    name: "enable_youtube_channel_whitelist",
    textKey: "allow_whitelisting_youtube_channels2",
    extraInfo: "require_restart_browser",
    subOptions: [
      {
        name: "enable_youtube_manage_subscribed",
        textKey: "youtube_manage_subscribed",
        helpLink:
          "https://helpcenter.getadblock.com/hc/en-us/articles/9738459986707-About-Acceptable-Ads-and-Third-Party-Tracking",
        additionalInfoLink: {
          textKey: "settings",
          href: "https://www.youtube.com/feed/channels",
        },
      },
    ],
    helpLink:
      "https://helpcenter.getadblock.com/hc/en-us/articles/9738502154131-Can-I-use-AdBlock-and-still-allow-ads-on-my-favorite-YouTube-channels",
  },
  {
    name: "enable_twitch_channel_allowlist",
    textKey: "allowlisting_twitch_channels",
    extraInfo: "require_restart_browser",
    helpLink:
      "https://helpcenter.getadblock.com/hc/en-us/articles/9738502507283-Does-AdBlock-block-ads-on-Twitch",
  },
  {
    name: "prefs__shouldShowBlockElementMenu",
    textKey: "showcontextmenus2",
  },
  {
    name: "prefs__show_statsinicon",
    textKey: "show_on_adblock_button",
  },
  {
    name: "enable_display_menu_stats",
    textKey: "show_on_adblock_menu",
  },
  {
    name: "prefs__show_devtools_panel",
    textKey: "show_devtools_panel",
  },
  {
    name: "prefs__data_collection_opt_out",
    textKey: "data_collection_opt_out",
    subOptions: [
      {
        name: "enable_data_collection_v2",
        textKey: "datacollectionoption",
        helpLink:
          "https://helpcenter.getadblock.com/hc/en-us/articles/9738517370259-About-AdBlock-s-opt-in-anonymous-filter-list-usage-and-data-collection",
      },
      {
        name: "prefs__send_ad_wall_messages",
        textKey: "allow_ad_wall_messages",
        helpLink: "https://helpcenter.getadblock.com/hc/en-us/articles/22696374171027/",
      },
      {
        name: "enable_onpageMessages",
        textKey: "onpage_messages",
      },
    ],
  },
  {
    name: "enable_show_advanced_options",
    textKey: "advanced_options2",
  },
  {
    name: "enable_debug_logging",
    textKey: "debuginlogoption2",
    extraInfo: "slows_down_extension",
  },
];

const contentWrapperClasses = "flex flex-col justify-center mx-5 mb-6 flex-initial w-[711px]";

export function App() {
  return (
    <div className={contentWrapperClasses}>
      <OptionsList className="option-page-content" items={optionsData} />
    </div>
  );
}
