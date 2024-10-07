import { beforeEach, describe, it, expect } from 'vitest';
import { render, screen, waitFor } from "@testing-library/react";
import { Link, } from '@components';


let link;
const defaultProps = {
  href: 'https://example.com',
};

const renderLink = async (propsToSet = {}) => {
  const props = {
    ...defaultProps,
    ...propsToSet
  };

  const element = <Link {...props}>Click Here</Link>
  render(element);
  link = screen.getByRole('link');
};

describe('Link in default configuration', () => {
  beforeEach(async () => {
    await renderLink();
  });

  it('renders', async () => {
    await waitFor(() => expect(link).toBeVisible());
  });

  it('renders without passing referrer', async () => {
    await waitFor(async () => {
      expect(link).toHaveAttribute('rel', 'noreferrer');
      expect(link).toHaveAttribute('referrerPolicy', 'no-referrer');
    });
  });
});
