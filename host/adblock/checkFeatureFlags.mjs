// import { featureFlags } from "@core/feature-flags";
import { featureFlags } from "../../core/feature-flags/featureFlags.js";

if (featureFlags) {
  console.log("Feature flags package found:", featureFlags);
} else {
  console.log("Feature flags package not found.");
}
