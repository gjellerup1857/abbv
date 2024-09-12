import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from "@testing-library/react";
import { ToggleSwitch } from '@components/Toggle';

const clickFn = vi.fn();

let toggle;
const defaultProps = {
  onClick: clickFn,
  name: 'slider-1'
};

const renderToggleSwitch = (propsToSet = {}) => {
  const props = {
    ...defaultProps,
    ...propsToSet
  };

  const baseToggle = <ToggleSwitch {...props} />
  render(baseToggle);
  toggle = screen.getByRole('ToggleSwitch')
}

describe('ToggleSwitch in default configuration', () => {
  beforeEach(() => {
    renderToggleSwitch();
  })

  it ('renders', () => {
    expect(toggle).toBeVisible();
  });

});
