// Language and entry-address rules, shared by the browser entry page and the build.

export function normalizeKey(value) {
  return String(value).trim().toLowerCase().replace(/\s+/g, "").replace(/_/g, "-");
}

// Builds the alias table once and fails fast when one alias points to two languages.
export function createLanguageResolver({ languages, languageAliases }) {
  const aliases = new Map();

  function register(alias, lang) {
    const key = normalizeKey(alias);
    const existing = aliases.get(key);
    if (existing && existing !== lang) {
      throw new Error(`Language alias ${alias} is assigned to both ${existing} and ${lang}.`);
    }
    aliases.set(key, lang);
  }

  languages.forEach((lang) => register(lang, lang));
  Object.entries(languageAliases || {}).forEach(([lang, list]) => {
    if (!languages.includes(lang)) {
      throw new Error(`Language aliases reference unsupported language ${lang}.`);
    }
    list.forEach((alias) => register(alias, lang));
  });

  return function resolveLanguage(value) {
    if (!value) {
      return null;
    }

    const key = normalizeKey(value);
    if (aliases.has(key)) {
      return aliases.get(key);
    }

    const primary = key.split("-")[0];
    return languages.includes(primary) ? primary : null;
  };
}

// Maps every address that was ever printed on a QR code (/, index.html, qr-guide.html,
// ?lang=..., ?spot=...) to a language page, e.g. "./el/#machinery".
// Without ?lang the phone's own language list decides, falling back to the default.
export function resolveEntryTarget({ search, browserLanguages, config }) {
  const resolveLanguage = createLanguageResolver(config);
  const params = new URLSearchParams(search || "");
  const candidates = [params.get("lang"), ...(params.has("lang") ? [] : browserLanguages || [])];
  const lang = candidates.map(resolveLanguage).find(Boolean) || config.defaultLanguage;

  const spot = params.get("spot");
  const stopId = spot ? normalizeKey(spot) : "";
  const hash = config.stopIds.includes(stopId) ? `#${stopId}` : "";

  return `./${lang}/${hash}`;
}
