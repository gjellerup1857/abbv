import { LockableList } from '@components';
import { getArgsFromJSDoc } from '@/docs/helpers.js';

const changeHandler = ({ evt }) =>
  console.log("change is possible", evt, evt.target.checked);

const items = [
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
    <LockableList {...args} />
  ),
};
