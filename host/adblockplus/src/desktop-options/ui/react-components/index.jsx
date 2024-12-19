import ReactDOM from "react-dom/client";
import * as messaging from "~/core/messaging/front/index.ts";
import GeneralFeaturesContainer from "./GeneralFeaturesContainer";

(async () => {
  const url = new URL(window.top.location.href);
  const showNewUI = url.searchParams.has("newUi");

  // kill switch for react app
  // TODO: Remember to reverse
  if (showNewUI) {
    return;
  }

  // TODO: Use some kind of state management library
  // Fetch user data
  const premium = await messaging.premium.get();
  const hasPremium = premium.isActive;
  const user = {
    hasPremium
  };

  // Fetch subscriptions data
  const [recommendedSubs, enabledSubs] = await Promise.all([
    messaging.subscriptions.getRecommendations(),
    messaging.subscriptions.get()
  ]);
  const subscriptions = {
    recommended: recommendedSubs,
    enabled: enabledSubs
  };

  const container = document.getElementById("general-features-section");
  if (container) {
    // Render the React app
    const root = ReactDOM.createRoot(container);
    root.render(<GeneralFeaturesContainer user={user} />);

    // TODO: Remove this line after the React app is fully functional
    // Hide the old features container
    document.querySelector(".recommended-features").style.display = "none";
  } else {
    console.warn("Unable to load react app, container is missing");
  }
})();
