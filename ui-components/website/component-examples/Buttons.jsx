import React, { useState } from 'react';
import { Button } from '@components'
import { themeNames } from './Themes';

const buttonKinds = ['filled', 'outline', 'text', 'link', 'punched'];

export const Buttons = () => {
  const [showSorryButton, setShowSorryButton] = useState(false);
  const [responseText, setResponseText] = useState('');

  const clickFn = () => {
    setResponseText('OW I TOLD YOU NOT TO CLICK');
    setShowSorryButton(true);
  };

  const sorryClickFn = () => {
    setResponseText('');
    setShowSorryButton(false);
  };

  return (
    <>
      <div data-extension="adblock" data-theme="default" className="flex flex-col gap-y-4">
        <p className="text-3xl">ßµ††ðñ§ ฿Ʉ₮₮Ø₦₴ ꌃꀎ꓄꓄ꂦꈤꌗ</p>
        <div className="flex flex-col justify-cennter">
          <p className="text-2xl text-theme-text-primary">{ responseText }</p>
          { showSorryButton &&
            <Button kind="text" text="omg I am so sorry" onClick={sorryClickFn} />
          }
        </div>
        <div className="flex flex-wrap gap-10">
          {
            Object.keys(themeNames).map((name) => (
              <div data-extension="adblock" data-theme={ name } key={ name } className="flex flex-col items-start w-full">
                <p> { name } </p>
                <div className="flex w-full gap-x-2 bg-theme-secondary p-4">
                {
                  buttonKinds.map((kind) => (
                    <Button text="do not click me" key={ kind } kind={ kind } ariaLabel="ow-ow-ow" onClick={ clickFn } />
                  ))
                }
                </div>
              </div>
            ))
          }
        </div>

      </div>
    </>
  )
};
