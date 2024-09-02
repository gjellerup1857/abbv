import './App.css'
import { Buttons, Themes } from './component-examples';

function App() {
  return (
    <div className="flex flex-col gap-y-14">
      <Buttons />
      <Themes />
    </div>
  )
}

export default App;
