import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const META_PATH = path.join(ROOT, "assets", "js", "content-meta.js");
const I18N_PATH = path.join(ROOT, "assets", "js", "i18n.js");
const APP_PATH = path.join(ROOT, "assets", "js", "app.js");
const CSS_PATH = path.join(ROOT, "assets", "css", "main.css");

function createContentRuntime() {
  const fetchCalls = [];
  const runtimeWindow = { Intl };
  const sandbox = {
    console,
    fetch: async (contentPath) => {
      fetchCalls.push(contentPath);
      const resolvedPath = path.resolve(ROOT, contentPath);
      return {
        ok: fs.existsSync(resolvedPath),
        json: async () => JSON.parse(fs.readFileSync(resolvedPath, "utf8")),
      };
    },
    Intl,
    window: runtimeWindow,
  };

  vm.runInNewContext(fs.readFileSync(META_PATH, "utf8"), sandbox, { filename: META_PATH });
  vm.runInNewContext(fs.readFileSync(I18N_PATH, "utf8"), sandbox, { filename: I18N_PATH });

  return {
    contentApi: runtimeWindow.MYLOTOPI_GUIDE_CONTENT,
    fetchCalls,
    meta: runtimeWindow.MYLOTOPI_GUIDE_META,
    service: runtimeWindow.MYLOTOPI_GUIDE_I18N,
  };
}

test("all configured aliases resolve before any language content is loaded", () => {
  const { meta, service } = createContentRuntime();

  Object.entries(meta.languageAliases).forEach(([lang, aliases]) => {
    aliases.forEach((alias) => {
      assert.equal(service.normalizeLanguage(alias), lang, `${alias} should resolve to ${lang}`);
    });
  });
});

test("language aliases load and cache the canonical language file", async () => {
  const { fetchCalls, service } = createContentRuntime();

  const greekContent = await service.loadLanguage("GR");
  assert.equal(greekContent.code, "el");
  assert.equal(service.currentLanguage, "el");
  assert.deepEqual(fetchCalls, ["./assets/content/el.json"]);

  await service.loadLanguage("greek");
  assert.deepEqual(fetchCalls, ["./assets/content/el.json"]);
});

test("language normalization supports regional codes and rejects unknown languages", () => {
  const { service } = createContentRuntime();

  assert.equal(service.normalizeLanguage("fr-CA"), "fr");
  assert.equal(service.normalizeLanguage("EL_GR"), "el");
  assert.equal(service.normalizeLanguage("en-US"), "en");
  assert.equal(service.normalizeLanguage("unknown"), null);
});

test("conflicting configured aliases fail fast", () => {
  const { contentApi, meta } = createContentRuntime();
  const conflictingAliases = {
    ...meta.languageAliases,
    de: [...meta.languageAliases.de, "shared-alias"],
    en: [...meta.languageAliases.en, "shared-alias"],
  };

  assert.throws(
    () =>
      new contentApi.GuideContentService({
        ...meta,
        languageAliases: conflictingAliases,
      }),
    /assigned to multiple languages/,
  );
});

test("the map modal uses the native dialog contract", () => {
  const appSource = fs.readFileSync(APP_PATH, "utf8");
  const cssSource = fs.readFileSync(CSS_PATH, "utf8");

  assert.match(appSource, /<dialog class="minimap-modal"/);
  assert.match(appSource, /modal\.showModal\(\)/);
  assert.match(appSource, /modal\.close\(\)/);
  assert.doesNotMatch(appSource, /minimap-modal__backdrop/);
  assert.match(cssSource, /\.minimap-modal::backdrop/);
  assert.match(cssSource, /\.minimap-modal:not\(\[open\]\)/);
});
