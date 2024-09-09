import { fn } from '@storybook/test';
import { Button } from '@components';
import { getArgsFromJSDoc } from '../helpers.js';


export default {
  title: 'Components/Button',
  component: Button,
  argTypes: getArgsFromJSDoc(Button),
  args: {
    text: 'Update now',
    onClick: fn(),
  },
};

export const AllVariants = {
  render: (args) => (
    <div className="flex items-center gap-2">
      <Button {...args} />
      <Button {...args} kind="outline" />
      <Button {...args} kind="text" />
      <Button {...args} kind="link" />
      <Button {...args} kind="punched" />
    </div>
  ),
}

/**
 * Filled buttons initiate the primary action of any given page or flow.
 * Avoid having more than one filled button available to the user at a
 * given time.
 */
export const Filled = {
  args: {
    text: 'Update now',
  }
};

/**
 * Outline buttons are the default and most common buttons in product
 * interfaces. In general, use the outline style for buttons that aren’t
 * for primary actions.
 */
export const Outline = {
  args: {
    text: 'Update now',
    kind: 'outline',
  }
};

export const Text = {
  args: {
    kind: 'text',
    text: 'Update now',
  }
};

export const Link = {
  args: {
    kind: 'link',
    text: 'Update now',
  }
};

export const Punched = {
  args: {
    kind: 'punched',
    text: 'Update now',
  }
};
