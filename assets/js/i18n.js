(function () {
  const meta = window.MYLOTOPI_GUIDE_META;

  if (!meta) {
    throw new Error("Mylotopi guide metadata is missing.");
  }

  // Runtime visitor text lives in one JSON file per language and is loaded on demand.
  const CONTENT_BASE_PATH = "./assets/content";

  function normalizeKey(value) {
    return value.toString().trim().toLowerCase().replace(/\s+/g, "").replace(/_/g, "-");
  }

  function normalizeBasePath(path) {
    return path.replace(/\/$/, "");
  }

  async function fetchJson(path) {
    const response = await fetch(path, { cache: "no-cache" });

    if (!response.ok) {
      throw new Error("Unable to load Mylotopi content: " + path);
    }

    return response.json();
  }

  function getNativeLanguageName(lang) {
    if (window.Intl && typeof window.Intl.DisplayNames === "function") {
      try {
        return new Intl.DisplayNames([lang], { type: "language" }).of(lang) || lang.toUpperCase();
      } catch (error) {
        return lang.toUpperCase();
      }
    }

    return lang.toUpperCase();
  }

  class GuideContentLoader {
    constructor(basePath) {
      this.basePath = normalizeBasePath(basePath || CONTENT_BASE_PATH);
      this.cache = new Map();
    }

    getLanguagePath(lang) {
      return this.basePath + "/" + lang + ".json";
    }

    getCached(lang) {
      return this.cache.get(lang) || null;
    }

    async load(lang) {
      if (this.cache.has(lang)) {
        return this.cache.get(lang);
      }

      const path = this.getLanguagePath(lang);
      const content = await fetchJson(path);

      if (!content || content.code !== lang) {
        throw new Error("Mylotopi content language mismatch for " + lang + ".");
      }

      this.cache.set(lang, content);
      return content;
    }
  }

  class GuideContentService {
    constructor(config) {
      this.defaultLanguage = config.defaultLanguage;
      this.supportedLanguages = Array.isArray(config.languages) ? config.languages.slice() : [];
      this.loader = new GuideContentLoader(CONTENT_BASE_PATH);
      this.aliases = new Map();
      this.currentLanguage = null;
      this.currentContent = null;

      this.supportedLanguages.forEach((lang) => {
        this.registerAlias(lang, lang);
      });

      this.registerConfiguredAliases(config.languageAliases);
    }

    registerAlias(alias, lang) {
      if (typeof alias !== "string" || !alias.trim()) {
        throw new Error("Mylotopi language aliases must be non-empty strings.");
      }

      if (!this.supportedLanguages.includes(lang)) {
        throw new Error("Mylotopi language alias references unsupported language " + lang + ".");
      }

      const key = normalizeKey(alias);
      const existingLanguage = this.aliases.get(key);

      if (existingLanguage && existingLanguage !== lang) {
        throw new Error("Mylotopi language alias " + alias + " is assigned to multiple languages.");
      }

      this.aliases.set(key, lang);
    }

    registerConfiguredAliases(languageAliases) {
      if (!languageAliases || typeof languageAliases !== "object" || Array.isArray(languageAliases)) {
        throw new Error("Mylotopi language aliases must be configured as an object.");
      }

      Object.entries(languageAliases).forEach(([lang, aliases]) => {
        if (!Array.isArray(aliases)) {
          throw new Error("Mylotopi language aliases for " + lang + " must be an array.");
        }

        aliases.forEach((alias) => {
          this.registerAlias(alias, lang);
        });
      });
    }

    normalizeLanguage(value) {
      if (!value) {
        return null;
      }

      const key = normalizeKey(value);
      if (this.aliases.has(key)) {
        return this.aliases.get(key);
      }

      if (this.supportedLanguages.includes(key)) {
        return key;
      }

      const primaryCode = key.split("-")[0];
      return this.supportedLanguages.includes(primaryCode) ? primaryCode : null;
    }

    registerAliases(content) {
      const code = content.code;
      this.registerAlias(code, code);

      (content.aliases || []).forEach((alias) => {
        this.registerAlias(alias, code);
      });
    }

    async loadLanguage(value) {
      const lang = this.normalizeLanguage(value) || this.defaultLanguage;
      const content = await this.loader.load(lang);

      this.registerAliases(content);
      this.currentLanguage = lang;
      this.currentContent = content;

      return content;
    }

    getContent(lang) {
      const requestedLang = lang || this.currentLanguage;

      if (requestedLang === this.currentLanguage) {
        return this.currentContent;
      }

      return this.loader.getCached(requestedLang);
    }

    getUi(lang) {
      const content = this.getContent(lang);
      return content && content.ui ? content.ui : {};
    }

    getSections(lang) {
      const content = this.getContent(lang);
      return content && Array.isArray(content.sections) ? content.sections : [];
    }

    getSection(sectionId, lang) {
      return (
        this.getSections(lang).find((section) => {
          return section.id === sectionId;
        }) || null
      );
    }

    getSectionLabel(sectionId, lang) {
      const section = this.getSection(sectionId, lang);
      return section ? section.navigationTitle || section.title || sectionId : sectionId;
    }

    getImageAlt(sectionId, lang) {
      const section = this.getSection(sectionId, lang);
      return section ? section.imageAlt || section.navigationTitle || section.title || sectionId : sectionId;
    }

    getAudio(sectionId, lang) {
      const section = this.getSection(sectionId, lang);
      const audio = section && section.audio ? section.audio : {};

      if (audio.path && audio.ready !== false) {
        return audio;
      }

      return { path: "" };
    }

    getMiniMap(lang) {
      const content = this.getContent(lang);
      return content && content.miniMap ? content.miniMap : {};
    }

    getLanguageName(lang) {
      const content = this.getContent(lang);
      return content && content.nativeName ? content.nativeName : getNativeLanguageName(lang);
    }
  }

  window.MYLOTOPI_GUIDE_CONTENT = {
    GuideContentLoader: GuideContentLoader,
    GuideContentService: GuideContentService,
  };

  window.MYLOTOPI_GUIDE_I18N = new GuideContentService(meta);
})();
