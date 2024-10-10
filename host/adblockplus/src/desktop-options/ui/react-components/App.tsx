import React, { useState } from "react";
import { Button } from "@eyeo/ext-ui-components";

export const App: React.FC = () => {
  const [count, setCount] = useState(0);
  return (
    <div>
      <h1 className="text-red-500 font-extrabold">React App</h1>
      <Button
        onClick={() => {
          setCount(count + 1);
        }}
        text={`Button clicks ${count}`}
      />
    </div>
  );
};
