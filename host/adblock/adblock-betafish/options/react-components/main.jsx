import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./app.jsx";

const checkAndAddApp = () => {
  const url = new URL(window.top.location.href);
  const showNewUI = url.searchParams.has("newUi");

  if (!showNewUI) {
    return;
  }

  const container = document.getElementById("react-options");
  const root = ReactDOM.createRoot(container);
  root.render(<App />);

  const oldUI = document.getElementById("jq-options");
  oldUI.style.display = "none";
}

checkAndAddApp();
