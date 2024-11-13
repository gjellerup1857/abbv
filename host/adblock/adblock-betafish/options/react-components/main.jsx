import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./app.jsx";

const checkAndAddApp = (data) => {
  const url = new URL(window.top.location.href);
  // TODO: Reverse me again before shipping
  const showNewUI = !url.searchParams.has("newUi");

  if (!showNewUI) {
    return;
  }

  const container = document.getElementById("react-options");
  const root = ReactDOM.createRoot(container);
  root.render(<App {...data} />);

  const oldUI = document.getElementById("jq-options");
  oldUI.style.display = "none";
};

const fetchData = async () => {
  const subs = await SubscriptionAdapter.getSubscriptionsMinusText();
  // TODO: Import these from a globals file and also name them better
  return { subs, settings, prefsNames: abpPrefPropertyNames };
};

const initializeApp = async () => {
  const data = await fetchData();
  checkAndAddApp(data);
};

(async () => await initializeApp())();
