import React, { useState } from "react";
import { Button } from "@eyeo/ext-ui-components";

export function App() {
  const [count, setCount] = useState(0);
  return <Button onClick={() => setCount(count + 1)}>Button clicks {count}</Button>;
}
