async function migrateToSmartAllowlisting() {
    const localesEnabled = []; // TODO: get this from ab testing
    const userLocale = browser.i18n.getUILanguage();
    if (!localesEnabled.includes(userLocale)) {
      return;
    }

    const origins = ["popup", "youtube", "wizard"];
    const filters = await ewe.filters.getUserFilters();
    let transitionedCount = 0;


    for (const filter of filters) {
      const isDocumentAllowlist = filter.text.startsWith("@@") && filter.text.includes("document");
      const metadata = await ewe.filters.getMetadata(filter.text);
      const isSmartAllowlist = metadata && metadata.autoExtendMs && metadata.expiresAt;
      // transition
      if (isDocumentAllowlist && !isSmartAllowlist && origins.includes(filter.metadata.origin)) {
        const autoExtendMs = Prefs.get("allowlisting_auto_extend_ms");
        filter.metadata.expiresAt = Date.now() + autoExtendMs;
        filter.metadata.autoExtendMs = autoExtendMs;
        await ewe.filters.setMetadata(filter.text, filter.metadata);
        transitionedCount += 1;
      }
    }

    // log event
  }