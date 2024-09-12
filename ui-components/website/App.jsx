import './App.css'
import { Buttons, Themes, Toggles  } from './component-examples';

function App() {
  return (
    <div className="flex flex-col gap-y-14">
      <Buttons />
      <Themes />
      <Toggles />
    </div>
  )
}

export default App;
