import './App.css'
import { Buttons, Icons, Themes } from './component-examples';

function App() {
  return (
    <div className="flex flex-col gap-y-14">
      <Icons />
      <Buttons />
      <Themes />
    </div>
  )
}

export default App;
