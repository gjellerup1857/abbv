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
    name: 'prefs__shouldShowBlockElementMenu',
    text: 'showcontextmenus2',
  },
  {
    name: 'enable_twitch_channel_allowlist',
    text: 'allowlisting_twitch_channels',
    extraInfo: 'require_restart_browser',
    helpLink: 'https://helpcenter.getadblock.com/hc/en-us/articles/9738502507283-Does-AdBlock-block-ads-on-Twitch',
    additionalInfoLink: {
      text: 'settings',
      href: 'http://www.example.com'
    }
  },
];

export function App() {
  return (
    <GeneralOptionsList items={ optionsData } />
  );
}
