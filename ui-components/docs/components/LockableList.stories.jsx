import { Icon, LockableList } from '@components';
import { getArgsFromJSDoc } from '@/docs/helpers.js';

const changeHandler = ({ evt }) =>
  console.log("change is possible", evt, evt.target.checked);

const items = [
  {
    name: "acceptable_ads",
    onChange: changeHandler,
    isLocked: true,
    textKey: "acceptableadsoption",
    helpLink:
      "https://www.example.com",
    subOptions: [
      {
        name: "acceptable_ads_privacy",
        onChange: changeHandler,
        textKey: "acceptable_ads_privacy",
      },
    ],
  },
  {
    name: "youtube_channel_whitelist",
    onChange: changeHandler,
    textKey: "allow_whitelisting_youtube_channels2",
    extraInfo: "require_restart_browser",
    isNew: true,
    subOptions: [
      {
        name: "youtube_manage_subscribed",
        onChange: changeHandler,
        textKey: "youtube_manage_subscribed",
        helpLink:
          "https://www.example.com",
        additionalInfoLink: {
          textKey: "settings",
          href: "https://www.youtube.com/feed/channels",
        },
      },
    ],
    helpLink:
      "https://helpcenter.getadblock.com/hc/en-us/articles/9738502154131-Can-I-use-AdBlock-and-still-allow-ads-on-my-favorite-YouTube-channels",
  },
];

export default {
  title: 'Components/LockableList',
  component: LockableList,
  args: {
  	items,
    isChecked: () => true,
    onItemChange: () => {},
    translate: (arg) => arg
  }
}

export const AllVariants = {
  render: (args) => (
  	<>
	    <LockableList {...args} />
    </>
  ),
};
