import path from "path";
import { installUrl } from "../utils/urls.js";

// Path to end to end test code
const endToEndPath = path.join(process.cwd(), "test", "end-to-end");
// Path to extension zip files from the current build
const buildsDirPath = path.join(process.cwd(), "dist", "release");
// Path to downloaded extension zip files from the latest released build
const liveBuildsDirPath = path.join(process.cwd(), "dist", "live");

export const runnerConfig = {
  // The browser name to use for the tests
  browserName: process.env.BROWSER,
  // The manifest version passed as command line argument
  manifestVersion: process.env.MANIFEST_VERSION,
  // Screenshots folder path
  screenshotsPath: path.join(endToEndPath, "screenshots"),
  // Runners path
  runnersPath: path.join(endToEndPath, "runners", "runner.*.js"),
  // Path to build the helper extension
  helperExtensionPath: path.join(process.cwd(), "dist", "devenv", "helper-extension"),
  buildsDirPath,
  // Path to the unpacked extension
  unpackedDirPath: path.join(buildsDirPath, "adblock-unpacked"),
  liveBuildsDirPath,
  // Path to the unpacked upgrade extension
  unpackedUpgradeDirPath: path.join(liveBuildsDirPath, "adblock-upgrade-unpacked"),
  // Name of the host extension folder in /hosts
  hostname: "adblock",
  installUrl,
};
