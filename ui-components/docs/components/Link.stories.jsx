import { Link } from '@components';
import { getArgsFromJSDoc } from '@/docs/helpers.js';


export default {
  title: 'Components/Link',
  component: Link,
  argTypes: getArgsFromJSDoc(Link),
  args: {
    href: 'https://example.com',
  }
}

export const AllVariants = {
  render: (args) => (
    <div className="grid grid-cols-1 items-center gap-6">
      <Link {...args}>Click Here</Link>
    </div>
  ),
};
