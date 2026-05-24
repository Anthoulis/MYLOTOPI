(function () {
  const meta = window.MYLOTOPI_GUIDE_META;

  if (!meta) {
    throw new Error("Mylotopi guide metadata is missing.");
  }

  const defaultLanguage = meta.defaultLanguage;
  const supportedLanguages = Array.isArray(meta.languages) ? meta.languages.slice() : [];
  const contentBasePath = meta.contentBasePath || "./assets/content";
  const content = {
    languages: {},
    aliasMap: {},
    loaded: false,
  };

  function normalizeKey(value) {
    return value.toString().trim().toLowerCase().replace(/\s+/g, "").replace(/_/g, "-");
  }

  function getLanguageIndexPath(lang) {
    return contentBasePath.replace(/\/$/, "") + "/" + lang + "/index.json";
  }

  function getLanguageContentPath(lang, contentPath) {
    if (/^(?:\.?\/|https?:\/\/)/.test(contentPath)) {
      return contentPath;
    }

    return contentBasePath.replace(/\/$/, "") + "/" + lang + "/" + contentPath.replace(/^\//, "");
  }

  async function fetchJson(path) {
    const response = await fetch(path, { cache: "no-cache" });

    if (!response.ok) {
      throw new Error("Unable to load Mylotopi content: " + path);
    }

    return response.json();
  }

  function buildAliasMap() {
    const aliases = {};

    supportedLanguages.forEach(function (lang) {
      const language = content.languages[lang] && content.languages[lang].index;
      aliases[normalizeKey(lang)] = lang;

      if (!language) {
        return;
      }

      (language.aliases || []).forEach(function (alias) {
        aliases[normalizeKey(alias)] = lang;
      });
    });

    content.aliasMap = aliases;
  }

  function getSectionManifest(index, spotId) {
    return (index.sections || []).find(function (section) {
      return section.id === spotId;
    });
  }

  function normalizeSection(section, manifest) {
    return Object.assign({}, section, {
      shortText: section.preview || "",
      shortTitle: section.navigationTitle || section.title,
      audio: Object.assign({}, manifest.audio || {}),
      details: Array.isArray(section.details) ? section.details : [],
      bullets: Array.isArray(section.bullets) ? section.bullets : [],
    });
  }

  async function loadLanguage(lang) {
    const index = await fetchJson(getLanguageIndexPath(lang));
    if (index.code !== lang) {
      throw new Error("Mylotopi content language mismatch for " + lang + ".");
    }

    const sections = {};
    await Promise.all(
      (index.sections || []).map(async function (manifest) {
        const sectionPath = getLanguageContentPath(lang, manifest.path);
        const section = await fetchJson(sectionPath);
        if (section.id !== manifest.id) {
          throw new Error("Mylotopi section id mismatch for " + sectionPath + ".");
        }

        sections[section.id] = normalizeSection(section, manifest);
      })
    );

    content.languages[lang] = {
      index: index,
      sections: sections,
    };
  }

  async function loadContent() {
    if (content.loaded) {
      return;
    }

    await Promise.all(supportedLanguages.map(loadLanguage));
    buildAliasMap();
    content.loaded = true;
  }

  function normalizeLanguage(value) {
    if (!value) {
      return null;
    }

    const key = normalizeKey(value);
    return content.aliasMap[key] || (supportedLanguages.includes(key) ? key : null);
  }

  function getLocale(lang) {
    return content.languages[lang] || content.languages[defaultLanguage] || { index: {}, sections: {} };
  }

  function getUi(lang) {
    return Object.assign({}, getLocale(defaultLanguage).index.ui || {}, getLocale(lang).index.ui || {});
  }

  function getLocalizedLanguageName(lang, displayLang) {
    const labels = getLocale(displayLang || lang).index.languageLabels || {};
    return labels[lang] || getLanguageName(lang);
  }

  function getSpotText(spotId, lang) {
    const defaultText = getLocale(defaultLanguage).sections[spotId] || {};
    const localeText = getLocale(lang).sections[spotId] || {};
    const defaultAudio = defaultText.audio || {};
    const localeAudio = localeText.audio || {};

    return Object.assign({}, defaultText, localeText, {
      details: Array.isArray(localeText.details)
        ? localeText.details
        : Array.isArray(defaultText.details)
          ? defaultText.details
          : [],
      bullets: Array.isArray(localeText.bullets)
        ? localeText.bullets
        : Array.isArray(defaultText.bullets)
          ? defaultText.bullets
          : [],
      challenge: lang === defaultLanguage ? defaultText.challenge : localeText.challenge || null,
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

    const fallbackLang = supportedLanguages.find(function (candidateLang) {
      const candidateAudio = getSpotText(spotId, candidateLang).audio || {};
      return candidateAudio.path && candidateAudio.ready !== false;
    });

    return fallbackLang ? getSpotText(spotId, fallbackLang).audio : { path: "" };
  }

  function getMiniMap(lang) {
    const defaultMiniMap = getLocale(defaultLanguage).index.miniMap || {};
    const requestedMiniMap = getLocale(lang).index.miniMap || {};

    return Object.assign({}, defaultMiniMap, requestedMiniMap);
  }

  function getLanguageName(lang) {
    const language = getLocale(lang).index;
    return language.nativeName || lang.toUpperCase();
  }

  function getLanguageDisplayLabel(lang, displayLang) {
    return getLocalizedLanguageName(lang, displayLang);
  }

  window.MYLOTOPI_GUIDE_I18N = {
    defaultLanguage: defaultLanguage,
    supportedLanguages: supportedLanguages,
    loadContent: loadContent,
    normalizeLanguage: normalizeLanguage,
    getLanguageName: getLanguageName,
    getLanguageLabel: getLanguageDisplayLabel,
    getUi: getUi,
    getSpotText: getSpotText,
    getSpotLabel: getSpotLabel,
    getImageAlt: getImageAlt,
    getAudio: getAudio,
    getMiniMap: getMiniMap,
  };
})();
