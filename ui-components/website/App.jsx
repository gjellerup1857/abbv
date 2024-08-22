import { useState } from 'react';
import './App.css'

function App() {
  const themeNames = {
    'default': '•._.••´¯``•.¸¸.•` ᗪｅƑＡùℓ𝕋 `•.¸¸.•´´¯`••._.•',
    'dark': '`•.,¸¸,.•´¯ ∂ａʳҜ ¯`•.,¸¸,.•´',
    'solarized': '¸„.-•~¹°”ˆ˜¨ 𝓢𝕆ᒪ𝕒ℝᶤ𝐙ε𝔡 ¨˜ˆ”°¹~•-.„¸',
    'solarized_light': ",-*' ^ '~*-.,_,.-*~ ᔕ𝕠Ĺ𝓪𝕣Įⓩ𝐄𝓓_Ⓛ𝒾𝐆Ħ𝓣 ~*-.,_,.-*~' ^ '*-,¸",
    'rebecca_purple': '•´¯`•.   🎀  𝓇𝑒𝒷𝑒𝒸𝒸𝒶_𝓅𝓊𝓇𝓅𝓁𝑒  🎀   .•`¯´•',
    'watermelon': '◦•●◉✿ 𝔀ÃᵗẸⓡᵐ乇ⓛ𝐨𝓃 ✿◉●•◦',
    'ocean': '▌│█║▌║▌║ ｏ𝐜єα𝓷 ║▌║▌║█│▌',
    'sunshine': '¤¸¸.•´¯`•¸¸.•..>> Ｓยภᔕħ𝓘𝔫ε <<..•.¸¸•´¯`•.¸¸¤',
  };

  // Written with bg- so Tailwind will pick up on them, once this is filled out, we should be able to avoid
  const themeVariables = [
    'bg-theme-primary',
    'bg-theme-secondary',
    'bg-theme-text-primary',
    'bg-theme-text-secondary',
    'bg-theme-link-color',
    'bg-theme-accent-dark',
    'bg-theme-accent-light',
    'bg-theme-text-accent',
  ];

  return (
    <>
      <div data-extension="adblock" data-theme="default" className="flex flex-col gap-y-14">
        <p className="text-3xl">|!¤*'~``~'*¤!| ｃ卄𝒆ℂ𝕂 ᗝ𝓾𝓣 𝓉𝓗ｅŞ𝔼 ｔнｅм𝔼𝐬 |!¤*'~``~'*¤!|</p>
        <ul>
        {
          Object.keys(themeNames).map((name) => (
            <>
              <li><a className="text-xl text-theme-link-color hover:text-theme-text-accent" key={name} href={`#${name}`}>{ name }</a></li>
            </>
          ))
        }
        </ul>

        {
          Object.entries(themeNames).map(([ name, nameAsCuteString ]) => (
            <>
              <p id={name} className="text-3xl">{ nameAsCuteString }</p>
              <div data-theme={name} className="bg-theme-primary flex flex-wrap p-4">
                {
                  themeVariables.map((varName) => (
                    <div className="flex flex-col">
                      <p className="text-theme-text-primary">{ varName.split('-').slice(1).join('-') }</p>
                      <div key={varName} className={`${varName} flex basis-40 shrink-0 m-4`} style={{width: 200}}>
                      </div>
                    </div>
                  ))
                }
              </div>
            </>
          ))
        }
      </div>
    </>
  )
}

export default App;
