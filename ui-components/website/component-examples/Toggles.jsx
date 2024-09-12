import React, { useState } from 'react';
import { ToggleSwitch } from '@components'
import { themeNames } from './Themes';

export const Toggles = () => {

  const clickFn = (evt) => {
    document.getElementById('clicked-checkbox').innerText = evt.target.id;
  };

  return (
    <>
      <div data-extension="adblock" data-theme="default" className="flex flex-col gap-y-4">
        <p className="text-3xl">Toggle Switches</p>
        <div className="flex flex-col justify-cennter">
          <span className="text-2xl text-theme-text-primary"> Clicked this checkbox: </span>
          <span className="text-2xl text-theme-text-primary" id="clicked-checkbox"> </span>
        </div>
        <div className="flex flex-wrap gap-10">
          {
            Object.keys(themeNames).map((name) => (
              <div data-extension="adblock" data-theme={ name } key={ name } className="flex flex-col items-start w-full">
                <p> { name } </p>
                <div className="flex w-full gap-x-2 bg-theme-primary p-4">
                    <ToggleSwitch name={ '1.1-' + name } onClick={ clickFn } checked={true} isLargeSlider={false} />
                    <ToggleSwitch name={ '1.2-' + name } onClick={ clickFn } checked={false} isLargeSlider={false} />
                    <ToggleSwitch name={ '1.3-' + name } onClick={ clickFn } checked={false} isLargeSlider={false} i18nPrefixMessage={"new_badge"} />
                    <ToggleSwitch name={ '1.4-' + name } onClick={ clickFn } checked={false} isLargeSlider={false} i18nPostfixMessage={"new_badge"} />
                    <ToggleSwitch name={ '2.1-' + name } onClick={ clickFn } checked={false} i18nPrefixMessage={"new_badge"} />
                    <ToggleSwitch name={ '2.2-' + name } onClick={ clickFn } checked={false} i18nPostfixMessage={"new_badge"} />
                    <ToggleSwitch name={ '2.3-' + name } onClick={ clickFn } checked={true} />
                    <ToggleSwitch name={ '2.4-' + name } onClick={ clickFn } checked={false} />
                </div>
              </div>
            ))
          }
        </div>
      </div>
    </>
  )
};
