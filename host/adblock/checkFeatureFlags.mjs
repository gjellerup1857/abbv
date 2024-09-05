import { featureFlags } from "@core/feature-flags";

if (featureFlags) {
  console.log("Feature flags package found:", featureFlags);
} else {
  console.log("Feature flags package not found.");
}
