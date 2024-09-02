import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from "@testing-library/react";
import { Button } from '@components/Buttons';

const buttonText = 'I am the button';
const clickFn = vi.fn();

let button;
const defaultProps = {
  text: buttonText,
  onClick: clickFn,
};

const renderButton = (propsToSet = {}) => {
  const props = {
    ...defaultProps,
    ...propsToSet
  };

  const baseButton = <Button {...props} />
  render(baseButton);
  button = screen.getByRole('button');
}

describe('Button in default configuration', () => {
  beforeEach(() => {
    renderButton();
  })

  it ('renders', () => {
    expect(button).toBeVisible();
  });

  it('renders the filled button by default', () => {
    expect(button).toHaveClass('bg-theme-button-primary');
  });

  it.todo('renders text');

  it.todo('uses text as the default aria label');

  it('calls the passed function on click', () => {
    expect(clickFn).not.toHaveBeenCalled();
    fireEvent.click(button);
    expect(clickFn).toHaveBeenCalledTimes(1);
  });
});

describe('Button kind variations', () => {
  it('renders the outline variation', () => {
    renderButton({ kind: 'outline' });
    expect(button).not.toHaveClass('bg-theme-button-primary');
    expect(button).toHaveClass('border border-theme-button-primary');
  });
});

describe('Button with optional parameters', () => {
  it.todo('overwrites text when distinct aria label is passed');
  it.todo('shows icon if passed');
});
