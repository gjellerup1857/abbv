/*
 * This file is part of Adblock Plus <https://adblockplus.org/>,
 * Copyright (C) 2006-present eyeo GmbH
 *
 * Adblock Plus is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 3 as
 * published by the Free Software Foundation.
 *
 * Adblock Plus is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Adblock Plus.  If not, see <http://www.gnu.org/licenses/>.
 */

"use strict";

const BasePage = require("./base.page");

class AdvancedPage extends BasePage {
  constructor(browser) {
    super();
    this.browser = browser;
  }

  get _advancedTabButton() {
    return $("#tab-advanced");
  }

  async init() {
    await this.waitForEnabledThenClick(this._advancedTabButton);
  }

  get abpFiltersFL() {
    let abpFiltersText = "ABP filters";
    if (process.env.MANIFEST_VERSION === "3")
      abpFiltersText = "ABP filters (compliance)";
    return $("//li[@aria-label='" + abpFiltersText + "']");
  }

  get abpFiltersFLErrorIcon() {
    let abpFiltersText = "ABP filters";
    if (process.env.MANIFEST_VERSION === "3")
      abpFiltersText = "ABP filters (compliance)";
    return $("//li[@aria-label='" + abpFiltersText + "']/div/io-popout");
  }

  get abpFiltersFLLastUpdatedText() {
    let abpFiltersText = "ABP filters";
    if (process.env.MANIFEST_VERSION === "3")
      abpFiltersText = "ABP filters (compliance)";
    return $(
      "//li[@aria-label='" +
        abpFiltersText +
        "']/div/span[@class='last-update']"
    );
  }

  get abpFiltersFLStatusToggle() {
    let abpFiltersText = "ABP filters";
    if (process.env.MANIFEST_VERSION === "3")
      abpFiltersText = "ABP filters (compliance)";
    return $("//li[@aria-label='" + abpFiltersText + "']/div/io-toggle/button");
  }

  get abpFiltersFLTrashButton() {
    let abpFiltersText = "ABP filters";
    if (process.env.MANIFEST_VERSION === "3")
      abpFiltersText = "ABP filters (compliance)";
    return $(
      "//li[@aria-label='" +
        abpFiltersText +
        "']/div/button" +
        "[@data-action='remove-subscription']"
    );
  }

  get abpTestFilterErrorIcon() {
    return $("//li[@aria-label='ABP_TEST_FILTER']/div/io-popout");
  }

  get addAFilterListButton() {
    return $("//button[@data-action='validate-import-subscription']");
  }

  get addBuiltinFilterListButton() {
    return $("#filters-boxlabel");
  }

  get addCustomFilterListButton() {
    return $("//io-filter-table/io-filter-search/button");
  }

  get addCustomFilterListInput() {
    return $("//io-filter-search/input");
  }

  get addNewFilterListButton() {
    return $("//button[@data-i18n='options_filterList_add']");
  }

  get addNewFilterListDialog() {
    return $("#filterlist-by-url");
  }

  get allowNonintrusiveAdvertisingFL() {
    return $("//li[@aria-label='Allow nonintrusive advertising']");
  }

  get allowNonintrusiveAdvertisingFLLastUpdatedText() {
    return $(
      "//li[@aria-label='Allow nonintrusive advertising']" +
        "/div/span[@class='last-update']"
    );
  }

  get allowNonintrusiveAdvertisingFLStatusToggle() {
    return $(
      "//li[@aria-label='Allow nonintrusive advertising']" +
        "/div/io-toggle/button"
    );
  }

  get allowNonintrusiveAdvertisingFLTrashButton() {
    return $(
      "//li[@aria-label='Allow nonintrusive advertising']/div/button" +
        "[@data-action='remove-subscription']"
    );
  }

  get allowNonintrusiveAdvertisingWithoutTrackingFL() {
    return $(
      "//li[@aria-label='Allow nonintrusive advertising " +
        "without third-party tracking']"
    );
  }

  get builtInFilterListsItems() {
    return $$("//io-list-box[@id='filters-box']/ul/li[@role='option']");
  }

  async builtInFilterListsTableItem(text) {
    return $("//li[contains(text(), '" + text + "')]");
  }

  get cancelAddingFLButton() {
    return $("//button[@data-action='close-filterlist-by-url']");
  }

  get copyCustomFLButton() {
    return $("//button[@class='copy']");
  }

  get customFilterListsErrorText() {
    return $("//div[@class='footer visible']/ul/li");
  }

  get customFilterListsFirstItemAlertIcon() {
    return $("//tbody/tr[1]/td[4]/img[@src='skin/icons/alert.svg']");
  }

  get customFilterListsFirstItemErrorIcon() {
    return $("//tbody/tr[1]/td[4]/img[@src='skin/icons/error.svg']");
  }

  get customFilterListsFirstItemAlertText() {
    return $("//tbody/tr[1]/td[4]/img[contains(@title, 'Slow filter')]");
  }

  async customFilterListsNthItemCheckbox(n) {
    return $("//tbody/tr[" + n + "]/td[1]/io-checkbox/button");
  }

  async customFilterListsNthItemText(n) {
    return $("//io-filter-list/table/tbody/tr[" + n + "]/td[3]/div");
  }

  async customFilterListsCheckboxByText(text) {
    return $(`//tr[td[3]/div[contains(text(),
      "${text}")]]/td[@data-column="selected"]/io-checkbox/button`);
  }

  get customFilterListsFirstItemToggle() {
    return $("//io-filter-list/table/tbody/tr[1]/td[2]/io-toggle/button");
  }

  get customFilterListsTable() {
    return $("//io-filter-table");
  }

  get customFilterListsTableContent() {
    return $("//io-filter-list");
  }

  async customFilterListsTableElementText(text) {
    return $("//div[@title='" + text + "']");
  }

  get customFilterListsTableRowsTexts() {
    return $$("//io-filter-list/table//div[@class='content']");
  }

  get customFLTableHeadAlertIcon() {
    return $("//io-filter-list/table/thead/tr/th[4]/img");
  }

  get customFLTableHeadArrow() {
    return $("//io-filter-list/table/thead/tr/th[2]");
  }

  get customFLTableHeadCheckbox() {
    return $("//io-filter-list/table/thead/tr/th[1]/io-checkbox/button");
  }

  get customFLTableHeadFilterRule() {
    return $("//io-filter-list/table/thead/tr/th[3]");
  }

  get deleteCustomFLButton() {
    return $("//button[@class='delete']");
  }

  get easyListEnglishFLDropdownItem() {
    return $(
      "//*[@id='filters-boxpopup']/" +
        "li[contains(text(),'EasyList (English)')]"
    );
  }

  get easyListFL() {
    return $("//li[@aria-label='EasyList']");
  }

  get easyListFLGearIcon() {
    return $("//li[@aria-label='EasyList']/div/io-popout[@type='menubar']");
  }

  get easyListFLLastUpdatedText() {
    // eslint-disable-next-line max-len
    return $("//li[@aria-label='EasyList']/div/span[@class='last-update']");
  }

  get easyListFLSourceButton() {
    return $(
      "//li[@aria-label='EasyList']" +
        "/div/io-popout[@type='menubar']" +
        "/div/div/ul/li/a[@data-i18n='options_filterList_source']"
    );
  }

  get easyListFLStatusToggle() {
    return $("//li[@aria-label='EasyList']/div/io-toggle/button");
  }

  get easyListFLTrashButton() {
    return $(
      "//li[@aria-label='EasyList']/div/button" +
        "[@data-action='remove-subscription']"
    );
  }

  get easyListFLUpdateNowButton() {
    return $(
      "//li[@aria-label='EasyList']" +
        "/div/io-popout[@type='menubar']" +
        "/div/div/ul/li/button[@data-i18n='options_filterList_updateNow']"
    );
  }

  get easyListFLWebsiteButton() {
    return $(
      "//li[@aria-label='EasyList']" +
        "/div/io-popout[@type='menubar']" +
        "/div/div/ul/li/a[@data-i18n='options_filterList_website']"
    );
  }

  get easyListGermanyPlusEasyListFL() {
    return $("//li[@aria-label='EasyList Germany+EasyList']");
  }

  get easyPrivacyFL() {
    return $("//li[@aria-label='EasyPrivacy']");
  }

  get enableThemButton() {
    return $("//a[@data-action='enable-filters']");
  }

  get fanboysNotificationsBlockingListFL() {
    return $('//li[@aria-label="Fanboy\'s Notifications Blocking List"]');
  }

  get fanboysSocialBlockingListFL() {
    return $('//li[@aria-label="Fanboy\'s Social Blocking List"]');
  }

  get filterListsDropdown() {
    return $("#filters-boxpopup");
  }

  get filterListErrorPopout() {
    return $(
      "//io-popout[@data-template-i18n-body=" +
        "'options_filterList_errorPopup_title']"
    );
  }

  get filterListErrorTooltip() {
    return $(
      "//io-popout[@data-template-i18n-body=" +
        "'options_filterList_errorPopup_title']/div/div[@role='tooltip']"
    );
  }

  get filterListErrorTooltipText() {
    return $(
      "//io-popout[@data-template-i18n-body=" +
        "'options_filterList_errorPopup_title']/div/div[@role='tooltip']/p"
    );
  }

  get filterListErrorTooltipFirstErrorText() {
    return $(
      "//io-popout[@data-template-i18n-body=" +
        "'options_filterList_errorPopup_title']/div/div[@role='tooltip']/ul/li"
    );
  }

  get filterListsLearnMoreLink() {
    return $(
      "//a[contains(@data-doclink, 'subscriptions')" +
        "and text()='Learn more']"
    );
  }

  get filterListUrlInput() {
    return $("#import-list-url");
  }

  get flTableEmptyPlaceholder() {
    return $(
      "//*[@id='all-filter-lists-table']/li[@class='empty-placeholder']"
    );
  }

  get iDontCareAboutCookiesFL() {
    return $('//li[@aria-label="I don\'t care about cookies"]');
  }

  get learnHowToWriteFiltersLink() {
    return $("//a[text()='Learn how to write filters (English only)']");
  }

  get listeFREasyListFL() {
    return $("//li[@aria-label='Liste FR+EasyList']");
  }

  get listeFREasyListFLDropdownItem() {
    return $(
      "//*[@id='filters-boxpopup']/" +
        "li[contains(text(),'Liste FR+EasyList (français + English)')]"
    );
  }

  get listeFREasyListFLStatusToggle() {
    return $("//li[@aria-label='Liste FR+EasyList']/div/io-toggle/button");
  }

  get premiumBlockCookieConsentPopupsFL() {
    return $("//li[@aria-label='Premium - Block cookie consent pop-ups']");
  }

  get premiumBlockCookieConsentPopupsFLStatusToggle() {
    return $(
      "//li[@aria-label='Premium - Block cookie consent pop-ups']" +
        "/div/io-toggle/button"
    );
  }

  get premiumBlockCookieConsentPopupsFLTrashButton() {
    return $(
      "//li[@aria-label='Premium - Block cookie consent pop-ups']" +
        "/div/button[@data-action='remove-subscription']"
    );
  }

  get premiumDistractionControlFL() {
    return $("//li[@aria-label='Premium - Distraction Control']");
  }

  get premiumDistractionControlFLStatusToggle() {
    return $(
      "//li[@aria-label='Premium - Distraction Control']" +
        "/div/io-toggle/button"
    );
  }

  get premiumBlockMoreDistractionsFLTrashButton() {
    return $(
      "//li[@aria-label='Premium - Distraction Control']" +
        "/div/button[@data-action='remove-subscription']"
    );
  }

  get showAdblockPlusPanelCheckbox() {
    return $("//li[@data-pref='show_devtools_panel']/button");
  }

  get showAdblockPlusPanelTooltipIcon() {
    return $("//li[@data-pref='show_devtools_panel']/io-popout");
  }

  get showAdblockPlusPanelTooltipText() {
    return $("//li[@data-pref='show_devtools_panel']/io-popout/div/div/p");
  }

  get showBlockElementCheckbox() {
    return $("//li[@data-pref='shouldShowBlockElementMenu']/button");
  }

  get showBlockElementTooltipIcon() {
    return $("//li[@data-pref='shouldShowBlockElementMenu']/io-popout");
  }

  get showBlockElementTooltipText() {
    return $(
      "//li[@data-pref='shouldShowBlockElementMenu']/io-popout/div/div/p"
    );
  }

  get showNumberOfAdsBlockedCheckbox() {
    return $("//li[@data-pref='show_statsinicon']/button");
  }

  get showUsefulNotificationsCheckbox() {
    return $("//li[@data-pref='notifications_ignoredcategories']/button");
  }

  get showUsefulNotificationsTooltipIcon() {
    return $("//li[@data-pref='notifications_ignoredcategories']/io-popout");
  }

  get showUsefulNotificationsTooltipText() {
    return $(
      "//li[@data-pref='notifications_ignoredcategories']" +
        "/io-popout/div/div/p"
    );
  }

  get testFilterList() {
    return $("//li[@aria-label='https://test-filterlist.txt']");
  }

  get testFilterListNoHtttps() {
    return $("//li[@aria-label='test-filterlist.txt']");
  }

  get testFilterListStatusToggle() {
    return $(
      "//li[@aria-label='https://test-filterlist.txt']" +
        "/div/io-toggle/button"
    );
  }

  get turnOnDebugElementCheckbox() {
    return $("//li[@data-pref='elemhide_debug']/button");
  }

  get turnOnDebugElementTooltipIcon() {
    return $("//li[@data-pref='elemhide_debug']/io-popout");
  }

  get turnOnDebugElementTooltipText() {
    return $("//li[@data-pref='elemhide_debug']/io-popout/div/div/p");
  }

  get updateAllFilterlistsButton() {
    return $("#update");
  }

  get urlErrorMessage() {
    return $(
      "//span[contains(@class, 'error-msg')" +
        "and text()='URL must start with https://.']"
    );
  }

  async addCustomFiltersOneByOne(filters) {
    for (const filter of filters) {
      await this.typeTextToAddCustomFilterListInput(filter);
      await this.clickAddCustomFilterListButton();
      await this.verifyTextPresentInCustomFLTable(filter);
    }
  }

  async clickAbpFiltersFLErrorIcon() {
    await (await this.abpFiltersFLErrorIcon).click();
  }

  async clickAbpTestFilterErrorIcon() {
    await (await this.abpTestFilterErrorIcon).click();
  }

  async clickAbpFiltersFLTrashButton() {
    await this.waitForEnabledThenClick(this.abpFiltersFLTrashButton);
  }

  async clickAddAFilterListButton() {
    await this.waitForEnabledThenClick(this.addAFilterListButton);
  }

  async clickAddBuiltinFilterListButton() {
    await (await this.addBuiltinFilterListButton).click();
  }

  async clickAddCustomFilterListButton() {
    await this.waitForEnabledThenClick(this.addCustomFilterListButton);
  }

  async clickAddNewFilterListButton() {
    await this.waitForEnabledThenClick(this.addNewFilterListButton);
  }

  async clickAllowNonintrusiveAdvertisingFLTrashButton() {
    await this.waitForEnabledThenClick(
      this.allowNonintrusiveAdvertisingFLTrashButton
    );
  }

  async clickBuiltInFLTableItem(text) {
    await this.scrollIntoViewAndClick(this.builtInFilterListsTableItem(text));
  }

  async clickCancelAddingFLButton() {
    await (await this.cancelAddingFLButton).click();
  }

  async clickCopyCustomFLButton() {
    await this.scrollIntoViewAndClick(this.copyCustomFLButton);
  }

  async clickCustomFilterListsNthItemCheckbox(n) {
    await this.scrollIntoViewAndClick(
      await this.customFilterListsNthItemCheckbox(n)
    );
  }

  async clickCustomFilterListsNthItemText(n) {
    await this.scrollIntoViewAndClick(
      await this.customFilterListsNthItemText(n)
    );
  }

  async clickCustomFilterListsCheckboxByText(text) {
    await this.scrollIntoViewAndClick(
      await this.customFilterListsCheckboxByText(text)
    );
  }

  async clickCustomFilterListsFirstItemToggle() {
    await this.scrollIntoViewAndClick(this.customFilterListsFirstItemToggle);
  }

  async clickCustomFLTableHeadAlertIcon() {
    await (await this.customFLTableHeadAlertIcon).click();
  }

  async clickCustomFLTableHeadArrow() {
    await (await this.customFLTableHeadArrow).click();
  }

  async clickCustomFLTableHeadCheckbox() {
    await this.scrollIntoViewAndClick(this.customFLTableHeadCheckbox);
  }

  async clickCustomFLTableHeadFilterRule() {
    await (await this.customFLTableHeadFilterRule).click();
  }

  async clickDeleteCustomFLButton() {
    await this.scrollIntoViewAndClick(this.deleteCustomFLButton);
  }

  async clickEasyListEnglishFL() {
    await this.scrollIntoViewAndClick(this.easyListEnglishFLDropdownItem);
  }

  async clickEasyListFLGearIcon() {
    await this.waitForEnabledThenClick(this.easyListFLGearIcon);
  }

  async clickEasyListFLSourceButton() {
    await (await this.easyListFLSourceButton).click();
  }

  async clickEasyListFLStatusToggle() {
    await this.waitForEnabledThenClick(this.easyListFLStatusToggle);
  }

  async clickEasyListFLTrashButton() {
    await this.waitForEnabledThenClick(this.easyListFLTrashButton);
  }

  async clickEasyListFLUpdateNowButton() {
    await this.waitForEnabledThenClick(this.easyListFLUpdateNowButton);
  }

  async clickEasyListFLWebsiteButton() {
    await (await this.easyListFLWebsiteButton).click();
  }

  async clickEnableThemButton() {
    await (await this.enableThemButton).click();
  }

  async clickFilterListsLearnMoreLink() {
    await (await this.filterListsLearnMoreLink).click();
  }

  async clickLearnHowToWriteFiltersLink() {
    await (await this.learnHowToWriteFiltersLink).click();
  }

  async clickListeFREasyListFL() {
    await this.scrollIntoViewAndClick(this.listeFREasyListFLDropdownItem);
  }

  async clickPremiumBlockCookieConsentPopupsFLStatusToggle() {
    await this.scrollIntoViewAndClick(
      this.premiumBlockCookieConsentPopupsFLStatusToggle
    );
  }

  async clickPremiumBlockCookieConsentPopupsFLTrashButton() {
    await (await this.premiumBlockCookieConsentPopupsFLTrashButton).click();
  }

  async clickPremiumDistractionControlFLStatusToggle() {
    await this.scrollIntoViewAndClick(
      this.premiumDistractionControlFLStatusToggle
    );
  }

  async clickPremiumBlockMoreDistractionsFLTrashButton() {
    await this.scrollIntoViewAndClick(
      this.premiumBlockMoreDistractionsFLTrashButton
    );
  }

  async clickShowAdblockPlusPanelCheckbox() {
    await (await this.showAdblockPlusPanelCheckbox).click();
  }

  async clickShowAdblockPlusPanelTooltipIcon() {
    await this.waitForEnabledThenClick(this.showAdblockPlusPanelTooltipIcon);
  }

  async clickShowBlockElementCheckbox() {
    await (await this.showBlockElementCheckbox).click();
  }

  async clickShowBlockElementTooltipIcon() {
    await this.waitForEnabledThenClick(this.showBlockElementTooltipIcon);
  }

  async clickShowNumberOfAdsBlockedCheckbox() {
    await (await this.showNumberOfAdsBlockedCheckbox).click();
  }

  async clickShowUsefulNotificationsCheckbox() {
    await (await this.showUsefulNotificationsCheckbox).click();
  }

  async clickShowUsefulNotificationsTooltipIcon() {
    await this.waitForEnabledThenClick(this.showUsefulNotificationsTooltipIcon);
  }

  async clickTurnOnDebugElementCheckbox() {
    await (await this.turnOnDebugElementCheckbox).click();
  }

  async clickTurnOnDebugElementTooltipIcon() {
    await this.waitForEnabledThenClick(this.turnOnDebugElementTooltipIcon);
  }

  async clickUpdateAllFilterlistsButton() {
    await (await this.updateAllFilterlistsButton).click();
  }

  async getBuiltInFilterListsItemsNames() {
    const flItems = await this.builtInFilterListsItems;
    return await flItems.map((e) => e.getText());
  }

  async getCustomFilterListsErrorText() {
    return await (await this.customFilterListsErrorText).getText();
  }

  async getFilterListErrorTooltipText() {
    let completeTooltipText = "";
    completeTooltipText += await (
      await this.filterListErrorTooltipText
    ).getText();
    completeTooltipText += await (
      await this.filterListErrorTooltipFirstErrorText
    ).getText();
    return completeTooltipText;
  }

  async getFlTableEmptyPlaceholderText() {
    return await (await this.flTableEmptyPlaceholder).getText();
  }

  async getShowAdblockPlusPanelTooltipText() {
    return await (await this.showAdblockPlusPanelTooltipText).getText();
  }

  async getShowBlockElementTooltipText() {
    return await (await this.showBlockElementTooltipText).getText();
  }

  async getShowUsefulNotificationsTooltipText() {
    return await (await this.showUsefulNotificationsTooltipText).getText();
  }

  async getTurnOnDebugElementTooltipText() {
    return await (await this.turnOnDebugElementTooltipText).getText();
  }

  async isAbpFiltersFLDisplayed() {
    return await this.waitForDisplayedNoError(this.abpFiltersFL);
  }

  async isAbpFiltersFLStatusToggleSelected() {
    return (
      (await (
        await this.abpFiltersFLStatusToggle
      ).getAttribute("aria-checked")) === "true"
    );
  }

  async isAbpFiltersFLUpdating(timeout = 5000, reverse = false) {
    return await this.waitUntilAttributeValueIs(
      this.abpFiltersFL,
      "class",
      "show-message",
      timeout,
      reverse
    );
  }

  async isAbpFiltersFLUpdatingDone() {
    return await this.waitUntilAttributeValueIs(
      this.abpFiltersFL,
      "class",
      "show-message",
      10000,
      true
    );
  }

  async isAbpFiltersFLErrorIconDisplayed(reverseOption = false) {
    return await this.waitForDisplayedNoError(
      this.abpFiltersFLErrorIcon,
      reverseOption
    );
  }

  async isAbpTestFilterErrorIconDisplayed(reverseOption = false) {
    return await this.waitForDisplayedNoError(
      this.abpTestFilterErrorIcon,
      reverseOption
    );
  }

  async isAddCustomFilterListButtonEnabled(
    reverseOption = false,
    timeoutMs = 3000
  ) {
    return await this.waitForEnabledNoError(
      this.addCustomFilterListButton,
      reverseOption,
      timeoutMs
    );
  }

  async isAddNewFilterListDialogDisplayed(reverseOption = false) {
    return await this.waitForDisplayedNoError(
      this.addNewFilterListDialog,
      reverseOption
    );
  }

  async isAllowNonintrusiveAdvertisingFLDisplayed() {
    return await this.waitForDisplayedNoError(
      this.allowNonintrusiveAdvertisingFL
    );
  }

  async isAllowNonintrusiveAdvertisingFLStatusToggleEnabled() {
    return await (
      await this.allowNonintrusiveAdvertisingFLStatusToggle
    ).isEnabled();
  }

  async isAllowNonintrusiveAdvertisingFLUpdating(
    timeout = 5000,
    reverse = false
  ) {
    return await this.waitUntilAttributeValueIs(
      this.allowNonintrusiveAdvertisingFL,
      "class",
      "show-message",
      timeout,
      reverse
    );
  }

  async isAllowNonintrusiveAdvertisingFLUpdatingDone() {
    return await this.waitUntilAttributeValueIs(
      this.allowNonintrusiveAdvertisingFL,
      "class",
      "show-message",
      10000,
      true
    );
  }

  async isAllowNonintrusiveAdvertisingWithoutTrackingFLDisplayed() {
    return await this.waitForDisplayedNoError(
      this.allowNonintrusiveAdvertisingWithoutTrackingFL
    );
  }

  async isCopyCustomFLButtonDisplayed() {
    return await (await this.copyCustomFLButton).isDisplayed();
  }

  async isCustomFilterListsFirstItemAlertIconDisplayed(reverseOption = false) {
    return await this.waitForDisplayedNoError(
      this.customFilterListsFirstItemAlertIcon,
      reverseOption
    );
  }

  async isCustomFilterListsFirstItemErrorIconDisplayed(reverseOption = false) {
    return await this.waitForDisplayedNoError(
      this.customFilterListsFirstItemErrorIcon,
      reverseOption
    );
  }

  async isCustomFLFirstItemAlertIconTooltipDisplayed(
    expectedValue = "",
    timeoutVal = 5000
  ) {
    expectedValue =
      "Slow filter. Please check the length of the pattern " +
      "and ensure it doesn't contain a regular expression.";
    await this.waitUntilAttributeValueIs(
      this.customFilterListsFirstItemAlertIcon,
      "title",
      expectedValue,
      timeoutVal
    );
    // Wait until tooltip is displayed
    await browser.pause(2500);
    return await (await this.customFilterListsFirstItemAlertText).isDisplayed();
  }

  async isCustomFilterListsNthItemCheckboxChecked(n, reverseOption = false) {
    await (await this.customFilterListsNthItemCheckbox(n)).scrollIntoView();
    return await this.waitUntilAttributeValueIs(
      this.customFilterListsNthItemCheckbox(n),
      "aria-checked",
      "true",
      3000,
      reverseOption
    );
  }

  async isCustomFilterListsFirstItemToggleDisplayed() {
    return await (await this.customFilterListsFirstItemToggle).isDisplayed();
  }

  async isCustomFilterListsFirstItemToggleSelected(reverseOption = false) {
    return await this.waitUntilAttributeValueIs(
      this.customFilterListsFirstItemToggle,
      "aria-checked",
      "true",
      3000,
      reverseOption
    );
  }

  async isCustomFilterListsTableDisplayed() {
    return await (await this.customFilterListsTable).isDisplayed();
  }

  async isCustomFilterListsTableContentDisplayed() {
    return await (await this.customFilterListsTableContent).isDisplayed();
  }

  async isCustomFLTableHeadCheckboxClickable() {
    return await (await this.customFLTableHeadCheckbox).isClickable();
  }

  async isDeleteCustomFLButtonDisplayed() {
    return await (await this.deleteCustomFLButton).isDisplayed();
  }

  async isEasyListFLDisplayed() {
    return await this.waitForDisplayedNoError(this.easyListFL);
  }

  async isEasyListFLStatusToggleSelected() {
    return (
      (await (
        await this.easyListFLStatusToggle
      ).getAttribute("aria-checked")) === "true"
    );
  }

  async isEasyListFLUpdating() {
    return await this.waitUntilAttributeValueIs(
      this.easyListFL,
      "class",
      "show-message"
    );
  }

  async isEasyListFLUpdatingDone() {
    return await this.waitUntilAttributeValueIs(
      this.easyListFL,
      "class",
      "show-message",
      10000,
      true
    );
  }

  async isEasyListGermanyPlusEasyListFLDisplayed() {
    return await this.waitForDisplayedNoError(
      this.easyListGermanyPlusEasyListFL
    );
  }

  async isEasyPrivacyFLDisplayed() {
    return await this.waitForDisplayedNoError(this.easyPrivacyFL);
  }

  async isFanboysNotificationsBlockingListFLDisplayed() {
    return await this.waitForDisplayedNoError(
      this.fanboysNotificationsBlockingListFL
    );
  }

  async isFanboysSocialBlockingListFLDisplayed() {
    return await this.waitForDisplayedNoError(this.fanboysSocialBlockingListFL);
  }

  async isFilterListErrorPopoutDisplayed(reverseOption = false) {
    return await this.waitForDisplayedNoError(
      this.filterListErrorPopout,
      reverseOption
    );
  }

  async isFilterListErrorTooltipDisplayed(reverseOption = false) {
    return await this.waitForDisplayedNoError(
      this.filterListErrorTooltip,
      reverseOption
    );
  }

  async isFilterListsDropdownDisplayed(reverseOption = false) {
    return await this.waitForDisplayedNoError(
      this.filterListsDropdown,
      reverseOption
    );
  }

  async isIDontCareAboutCookiesFLDisplayed() {
    return await this.waitForDisplayedNoError(this.iDontCareAboutCookiesFL);
  }

  async isListeFREasyListFLDisplayed() {
    return await this.waitForDisplayedNoError(
      this.listeFREasyListFL,
      false,
      1000
    );
  }

  async isListeFREasyListFLStatusToggleSelected(
    expectedValue = "true",
    timeoutVal = 3000
  ) {
    return await this.waitUntilAttributeValueIs(
      this.listeFREasyListFLStatusToggle,
      "aria-checked",
      expectedValue,
      timeoutVal
    );
  }

  async isPremiumBlockCookieConsentPopupsFLDisplayed(reverseOption = false) {
    return await this.waitForDisplayedNoError(
      this.premiumBlockCookieConsentPopupsFL,
      reverseOption
    );
  }

  async isPremiumBlockCookieConsentPopupsFLStatusToggleSelected(
    expectedValue = "true",
    timeoutVal = 3000
  ) {
    return await this.waitUntilAttributeValueIs(
      this.premiumBlockCookieConsentPopupsFLStatusToggle,
      "aria-checked",
      expectedValue,
      timeoutVal
    );
  }

  async isPremiumDistractionControlFLDisplayed(reverseOption = false) {
    return await this.waitForDisplayedNoError(
      this.premiumDistractionControlFL,
      reverseOption
    );
  }

  async isPremiumDistractionControlFLStatusToggleSelected(
    expectedValue = "true",
    timeoutVal = 3000
  ) {
    return await this.waitUntilAttributeValueIs(
      this.premiumDistractionControlFLStatusToggle,
      "aria-checked",
      expectedValue,
      timeoutVal
    );
  }

  async isShowAdblockPlusPanelCheckboxSelected(
    expectedValue = "true",
    timeoutVal = 3000
  ) {
    return await this.waitUntilAttributeValueIs(
      this.showAdblockPlusPanelCheckbox,
      "aria-checked",
      expectedValue,
      timeoutVal
    );
  }

  async isShowAdblockPlusPanelTooltipTextDisplayed(reverseOption = false) {
    return await this.waitForDisplayedNoError(
      this.showAdblockPlusPanelTooltipText,
      reverseOption
    );
  }

  async isShowBlockElementCheckboxSelected(
    expectedValue = "true",
    timeoutVal = 3000
  ) {
    return await this.waitUntilAttributeValueIs(
      this.showBlockElementCheckbox,
      "aria-checked",
      expectedValue,
      timeoutVal
    );
  }

  async isShowBlockElementTooltipTextDisplayed(reverseOption = false) {
    return await this.waitForDisplayedNoError(
      this.showBlockElementTooltipText,
      reverseOption
    );
  }

  async isShowNumberOfAdsBlockedCheckboxSelected(
    expectedValue = "true",
    timeoutVal = 3000
  ) {
    return await this.waitUntilAttributeValueIs(
      this.showNumberOfAdsBlockedCheckbox,
      "aria-checked",
      expectedValue,
      timeoutVal
    );
  }

  async isShowUsefulNotificationsCheckboxSelected(
    expectedValue = "true",
    timeoutVal = 3000
  ) {
    return await this.waitUntilAttributeValueIs(
      this.showUsefulNotificationsCheckbox,
      "aria-checked",
      expectedValue,
      timeoutVal
    );
  }

  async isShowUsefulNotificationsTooltipTextDisplayed(reverseOption = false) {
    return await this.waitForDisplayedNoError(
      this.showUsefulNotificationsTooltipText,
      reverseOption
    );
  }

  async isTestFilterListDisplayed() {
    return await (await this.testFilterList).isExisting();
  }

  async isTestFilterListNoHtttpsDisplayed() {
    return await (await this.testFilterListNoHtttps).isExisting();
  }

  async isTestFilterListStatusToggleSelected() {
    return (
      (await (
        await this.testFilterListStatusToggle
      ).getAttribute("aria-checked")) === "true"
    );
  }

  async isTurnOnDebugElementCheckboxSelected(
    expectedValue = "true",
    timeoutVal = 3000
  ) {
    return await this.waitUntilAttributeValueIs(
      this.turnOnDebugElementCheckbox,
      "aria-checked",
      expectedValue,
      timeoutVal
    );
  }

  async isTurnOnDebugElementTooltipTextDisplayed(reverseOption = false) {
    return await this.waitForDisplayedNoError(
      this.turnOnDebugElementTooltipText,
      reverseOption
    );
  }

  async isUrlErrorMessageDisplayed() {
    return await this.waitForDisplayedNoError(this.urlErrorMessage);
  }

  async hoverCustomFilterListsFirstItemAlertIcon() {
    await (await this.customFilterListsFirstItemAlertIcon).scrollIntoView();
    await (await this.customFilterListsFirstItemAlertIcon).moveTo();
  }

  async switchToEasylistSourceTab() {
    await this.switchToTab(/easylist-downloads/);
  }

  async switchToEasylisttoTab() {
    await this.switchToTab(/easylist.to/);
  }

  async switchToHowToWriteFiltersTab() {
    await this.switchToTab(/360062733293/);
  }

  async switchToSubscriptionsTab() {
    await this.switchToTab(/subscriptions/);
  }

  async typeTextToFilterListUrlInput(text) {
    // filterListUrlInput
    await this.clearValue("#import-list-url");

    await (await this.filterListUrlInput).click();
    await browser.keys(text);
  }

  async typeTextToAddCustomFilterListInput(text) {
    // addCustomFilterListInput
    await this.clearValue("io-filter-search > input");

    await this.waitForEnabledThenClick(this.addCustomFilterListInput);
    await browser.keys(text);
  }

  async verifyTextPresentInCustomFLTable(text, timeoutVal = 3000) {
    try {
      const element = await this.customFilterListsTableElementText(text);
      await element.waitForExist({ timeout: timeoutVal });
      if (!(await element.isDisplayedInViewport())) {
        await element.scrollIntoView();
      }
      return true;
    } catch (error) {
      return false;
    }
  }

  async waitForAbpFiltersFLLastUpdatedTextToEqual(text, timeoutVal = 3000) {
    return await this.waitUntilTextIs(
      this.abpFiltersFLLastUpdatedText,
      text,
      timeoutVal
    );
  }

  async waitForAllowNonintrusiveFLLastUpdatedTextToEqual(
    text,
    timeoutVal = 3000
  ) {
    return await this.waitUntilTextIs(
      this.allowNonintrusiveAdvertisingFLLastUpdatedText,
      text,
      timeoutVal
    );
  }

  async waitForCustomFilterListsNthItemTextToEqual(text, n, timeoutVal = 5000) {
    if (
      !(await (
        await this.customFilterListsNthItemText(n)
      ).isDisplayedInViewport())
    ) {
      await (await this.customFilterListsNthItemText(n)).scrollIntoView();
    }
    return await this.waitUntilTextIs(
      this.customFilterListsNthItemText(n),
      text,
      timeoutVal
    );
  }

  async waitForEasyListFLLastUpdatedTextToEqual(text, timeoutVal = 3000) {
    return await this.waitUntilTextIs(
      this.easyListFLLastUpdatedText,
      text,
      timeoutVal
    );
  }
}

module.exports = AdvancedPage;
