import React from 'react';
import { Button, Icon } from '@components';

export const Icons = () => {
  return (
    <div data-theme="solarized" data-extension="adblock" className="flex gap-x-2 fill-theme-button-secondary">
      <Icon name="circle" size="lg" className="fill-emerald-500" ariaHidden/>
      <Icon name="circle-open" className="stroke-sky-500" ariaLabel="the circle indicates mystery"/>
      <Icon name="circle" size="sm" className="fill-emerald-300" ariaHidden/>
      <Icon name="circle-open" className="stroke-sky-500" ariaLabel="the circle indicates mystery"/>
      <Icon name="circle" size="sm" className="fill-pink-500" ariaHidden/>
      <p>hi, hello</p> <Button onClick={() => console.log("🧤")} text="hi, hello" icon={<Icon name="circle" size="lg" ariaHidden/>} />
      <Icon name="circle" size="sm" className="fill-pink-500" ariaHidden/>
      <Icon name="circle-open" className="stroke-sky-500" ariaLabel="the circle indicates mystery"/>
      <Icon name="circle" size="sm" className="fill-emerald-300" ariaHidden/>
      <Icon name="circle-open" className="stroke-sky-500" ariaLabel="the circle indicates mystery"/>
      <Icon name="circle" size="lg" className="fill-emerald-500" ariaHidden/>
    </div>
  )
}
