import { afterEach, describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from "@testing-library/react";
import { ToggleSwitch } from '@components/Toggle';

const clickFn = vi.fn();

let toggle;
const defaultProps = {
  onChange: clickFn,
  id: 'toggle-one'
};

const renderToggleSwitch = (propsToSet = {}) => {
  const props = {
    ...defaultProps,
    ...propsToSet
  };
  const baseToggle = <ToggleSwitch {...props} />
  render(baseToggle);
  toggle = screen.getByRole('checkbox')
}

describe('ToggleSwitch in default configuration', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  });

  it ('renders', () => {
    renderToggleSwitch();
    expect(toggle).toBeVisible();
  });

  it('renders an unchecked toggle switch by default', () => {
    renderToggleSwitch();
    expect(toggle).to.have.property('checked', false);
  });

  it('renders an toggle switch with id when passed', () => {
    const id = 'toggle-two';
    renderToggleSwitch({ id });
    expect(toggle).toHaveAttribute('id', id);
  });

  it('responds to click events', () => {
    renderToggleSwitch();
    expect(clickFn).not.toHaveBeenCalled();
    expect(toggle).to.have.property('checked', false);
    fireEvent.click(toggle);
    expect(clickFn).toHaveBeenCalledTimes(1);
    expect(toggle).to.have.property('checked', true);
  });
});
