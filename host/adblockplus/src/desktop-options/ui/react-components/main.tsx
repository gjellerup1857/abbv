import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";

const container = document.getElementById("react-sections");
if (container) {
  const root = ReactDOM.createRoot(container);
  root.render(<App />);
} else {
  console.error("Failed to find the container element.");
}
