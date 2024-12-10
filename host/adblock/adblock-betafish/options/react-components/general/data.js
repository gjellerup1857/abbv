/* eslint-disable-next-line no-console */
import {
  changeHandler,
  toggleDataCollectionOptOut,
  togglePrefs,
  toggleShowContextMenus,
} from "./events";

export const optionsData = [
  {
    name: "acceptable_ads",
    onChange: changeHandler,
    textKey: "acceptableadsoption",
    helpLink:
      "https://helpcenter.getadblock.com/hc/en-us/articles/9738480686483-About-the-Acceptable-Ads-program-and-non-intrusive-ads",
    subOptions: [
      {
        name: "acceptable_ads_privacy",
        onChange: changeHandler,
        textKey: "acceptable_ads_privacy",
        helpLink:
          "https://helpcenter.getadblock.com/hc/en-us/articles/9738459986707-About-Acceptable-Ads-and-Third-Party-Tracking",
      },
    ],
  },
  {
    name: "youtube_channel_whitelist",
    onChange: changeHandler,
    textKey: "allow_whitelisting_youtube_channels2",
    extraInfo: "require_restart_browser",
    subOptions: [
      {
        name: "youtube_manage_subscribed",
        onChange: changeHandler,
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
    name: "twitch_channel_allowlist",
    onChange: changeHandler,
    textKey: "allowlisting_twitch_channels",
    extraInfo: "require_restart_browser",
    helpLink:
      "https://helpcenter.getadblock.com/hc/en-us/articles/9738502507283-Does-AdBlock-block-ads-on-Twitch",
  },
  {
    name: "shouldShowBlockElementMenu",
    onChange: toggleShowContextMenus,
    textKey: "showcontextmenus2",
  },
  {
    name: "show_statsinicon",
    onChange: togglePrefs.bind(null, "show_statsinicon"),
    textKey: "show_on_adblock_button",
  },
  {
    name: "display_menu_stats",
    onChange: changeHandler,
    textKey: "show_on_adblock_menu",
  },
  {
    name: "show_devtools_panel",
    onChange: togglePrefs.bind(null, "show_devtools_panel"),
    textKey: "show_devtools_panel",
  },
  {
    name: "data_collection_opt_out",
    onChange: toggleDataCollectionOptOut,
    textKey: "data_collection_opt_out",
    subOptions: [
      {
        name: "data_collection_v2",
        onChange: changeHandler,
        textKey: "datacollectionoption",
        helpLink:
          "https://helpcenter.getadblock.com/hc/en-us/articles/9738517370259-About-AdBlock-s-opt-in-anonymous-filter-list-usage-and-data-collection",
      },
      {
        name: "send_ad_wall_messages",
        onChange: togglePrefs.bind(null, "send_ad_wall_messages"),
        textKey: "allow_ad_wall_messages",
        helpLink: "https://helpcenter.getadblock.com/hc/en-us/articles/22696374171027/",
      },
      {
        name: "onpageMessages",
        onChange: changeHandler,
        textKey: "onpage_messages",
      },
    ],
  },
  {
    name: "show_advanced_options",
    onChange: changeHandler,
    textKey: "advanced_options2",
  },
  {
    name: "debug_logging",
    onChange: changeHandler,
    textKey: "debuginlogoption2",
    extraInfo: "slows_down_extension",
  },
];
