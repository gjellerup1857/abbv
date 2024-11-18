import { expect } from "expect";
import { sendExtCommand, updateExtPrefAPIKey } from "./shared/helpers.js";
import {
  blockHideUrl,
  checkBlockHidePage,
  reloadExtension,
  removeFilter,
  sendExtMessage,
} from "../../utils/page.js";
import { openNewTab } from "../../utils/driver.js";

const filterText = "@@||adblockinc.gitlab.io^$document";

/**
 * Validates the filter metadata.
 *
 * @param {object} debugInfo - The debug info response from the extension.
 * @param expiresAt
 */
function validateFilterMetadata(debugInfo, expiresAt = null) {
  expect(debugInfo).not.toBeNull();
  expect(debugInfo.otherInfo).not.toBeNull();
  expect(debugInfo.otherInfo.customRuleMetaData).not.toBeNull();

  const rulesMetadata = debugInfo.otherInfo.customRuleMetaData;
  const expectedMetadata = {
    created: expect.any(Number),
    origin: "web",
  };

  if (expiresAt !== null) {
    expectedMetadata.expiresAt = expiresAt;
  }

  expect(rulesMetadata).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        metaData: expectedMetadata,
        text: filterText,
      }),
    ]),
  );
}

export default () => {
  before(async function () {
    // update prefs and reload extension
    await updateExtPrefAPIKey("allowlisting_authorizedKeys");
    // Suppress the opening of the update page when the extension is reloaded.
    await reloadExtension();
  });

  afterEach(async function () {
    await removeFilter(filterText);
  });

  it("allowlists the page forever", async function () {
    // open the block-hide page
    await openNewTab(blockHideUrl);

    // trigger allowlisting with expiration
    const allowlisted = await sendExtCommand({
      triggerEventName: "domain_allowlisting_request",
      responseEventName: "domain_allowlisting_success",
    });

    // verify that the page received the allowlisting successfully event
    expect(allowlisted).not.toBeNull();

    // refresh the page to ensure the allowlisting is applied
    await driver.navigate().refresh();

    // verify that the page is allowlisted
    await checkBlockHidePage(true);

    // check filter metadata
    const debugInfo = await sendExtMessage({ command: "getDebugInfo" });
    validateFilterMetadata(debugInfo);
  });

  it("allowlists the page with expiration", async function () {
    // open the block-hide page
    await openNewTab(blockHideUrl);

    // trigger allowlisting with expiration
    const expiresAt = Date.now() + 1000 * 60 * 60 * 24 * 30; // 30 days
    const allowlisted = await sendExtCommand({
      triggerEventName: "domain_allowlisting_request",
      responseEventName: "domain_allowlisting_success",
      options: {
        expiresAt,
      },
    });

    // verify that the page received the allowlisting successfully event
    expect(allowlisted).not.toBeNull();

    // refresh the page to ensure the allowlisting is applied
    await driver.navigate().refresh();

    // verify that the page is allowlisted
    await checkBlockHidePage(true);

    // check filter metadata
    const debugInfo = await sendExtMessage({ command: "getDebugInfo" });
    validateFilterMetadata(debugInfo, expiresAt);
  });
};
