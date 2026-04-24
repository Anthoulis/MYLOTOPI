(function () {
  const meta = window.MYLOTOPI_GUIDE_META;
  const locales = window.MYLOTOPI_GUIDE_LOCALES || {};

  if (!meta) {
    throw new Error("Mylotopi guide metadata is missing.");
  }

  const defaultLanguage = meta.defaultLanguage;
  const languages = meta.languages || {};
  const supportedLanguages = Object.keys(languages);
  const aliasMap = supportedLanguages.reduce(function (aliases, lang) {
    aliases[lang] = lang;
    (languages[lang].aliases || []).forEach(function (alias) {
      const key = alias.toString().trim().toLowerCase().replace(/\s+/g, "").replace(/_/g, "-");
      aliases[key] = lang;
    });
    return aliases;
  }, {});

  function normalizeLanguage(value) {
    if (!value) {
      return null;
    }

    const key = value.toString().trim().toLowerCase().replace(/\s+/g, "").replace(/_/g, "-");
    return aliasMap[key] || null;
  }

  function getLocale(lang) {
    return locales[lang] || locales[defaultLanguage] || {};
  }

  function getUi(lang) {
    return Object.assign({}, getLocale(defaultLanguage).ui || {}, getLocale(lang).ui || {});
  }

  function getSpotText(spotId, lang) {
    const defaultText = ((getLocale(defaultLanguage).spots || {})[spotId]) || {};
    const localeText = ((getLocale(lang).spots || {})[spotId]) || {};
    const defaultAudio = defaultText.audio || {};
    const localeAudio = localeText.audio || {};

    // Text fallback is shallow by design: locale fields override English,
    // while missing body/audio fields fall back independently.
    return Object.assign({}, defaultText, localeText, {
      body: Array.isArray(localeText.body)
        ? localeText.body
        : Array.isArray(defaultText.body)
          ? defaultText.body
          : [],
      audio: Object.assign({}, defaultAudio, localeAudio),
    });
  }

  function getSpotLabel(spotId, lang) {
    const spotText = getSpotText(spotId, lang || defaultLanguage);
    return spotText.shortTitle || spotText.title || spotId;
  }

  function getImageAlt(spotId, lang) {
    const spotText = getSpotText(spotId, lang);
    return spotText.imageAlt || spotText.shortTitle || spotText.title || getSpotLabel(spotId);
  }

  function getAudio(spotId, lang) {
    const requestedAudio = getSpotText(spotId, lang).audio || {};
    if (requestedAudio.path && requestedAudio.ready !== false) {
      return requestedAudio;
    }

    const defaultAudio = getSpotText(spotId, defaultLanguage).audio || {};
    if (defaultAudio.path && defaultAudio.ready !== false) {
      return defaultAudio;
    }

    // Last resort: find any ready audio in another loaded locale.
    const fallbackLang = supportedLanguages.find(function (candidateLang) {
      const candidateAudio = getSpotText(spotId, candidateLang).audio || {};
      return candidateAudio.path && candidateAudio.ready !== false;
    });

    return fallbackLang ? getSpotText(spotId, fallbackLang).audio : { path: "" };
  }

  window.MYLOTOPI_GUIDE_I18N = {
    defaultLanguage: defaultLanguage,
    supportedLanguages: supportedLanguages,
    normalizeLanguage: normalizeLanguage,
    getLanguageLabel: function (lang) {
      return (languages[lang] && languages[lang].nativeName) || lang.toUpperCase();
    },
    getUi: getUi,
    getSpotText: getSpotText,
    getSpotLabel: getSpotLabel,
    getImageAlt: getImageAlt,
    getAudio: getAudio,
  };
})();
