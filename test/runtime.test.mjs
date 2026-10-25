import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

import { createLanguageResolver, resolveEntryTarget } from "../assets/js/language.mjs";
import { ROOT, loadSite, renderEntryPage, renderLanguagePage, renderSite } from "../scripts/site.mjs";

const site = loadSite();
const { meta } = site;
const entryConfig = {
  defaultLanguage: meta.defaultLanguage,
  languages: meta.languages,
  languageAliases: meta.languageAliases,
  stopIds: meta.sectionOrder,
};

// ---------------------------------------------------------------- languages

test("every configured alias resolves to its language", () => {
  const resolve = createLanguageResolver(meta);

  Object.entries(meta.languageAliases).forEach(([lang, aliases]) => {
    aliases.forEach((alias) => assert.equal(resolve(alias), lang, `${alias} should resolve to ${lang}`));
  });
});

test("regional codes resolve to the base language and unknown ones do not", () => {
  const resolve = createLanguageResolver(meta);

  assert.equal(resolve("fr-CA"), "fr");
  assert.equal(resolve("EL_GR"), "el");
  assert.equal(resolve(" de-AT "), "de");
  assert.equal(resolve("pt-BR"), null);
  assert.equal(resolve(""), null);
});

test("an alias assigned to two languages fails fast", () => {
  const languageAliases = { ...meta.languageAliases, de: [...meta.languageAliases.de, "shared"], en: [...meta.languageAliases.en, "shared"] };
  assert.throws(() => createLanguageResolver({ ...meta, languageAliases }), /assigned to both/);
});

// ---------------------------------------------------------------- entry addresses

test("the entry page follows the phone's language, then falls back to the default", () => {
  const target = (search, browserLanguages) => resolveEntryTarget({ search, browserLanguages, config: entryConfig });

  assert.equal(target("", ["de-DE", "en"]), "./de/");
  assert.equal(target("", ["pt-BR", "el-GR"]), "./el/");
  assert.equal(target("", ["ja"]), "./en/");
  assert.equal(target("", []), "./en/");
});

test("old printed addresses keep working", () => {
  const target = (search) => resolveEntryTarget({ search, browserLanguages: ["de"], config: entryConfig });

  assert.equal(target("?lang=el"), "./el/", "?lang wins over the phone language");
  assert.equal(target("?lang=GR"), "./el/");
  assert.equal(target("?lang=xx"), "./en/", "an unknown ?lang falls back to the default, as before");
  assert.equal(target("?lang=el&spot=bakery"), "./el/#bakery");
  assert.equal(target("?spot=Machinery"), "./de/#machinery");
  assert.equal(target("?lang=el&spot=nowhere&utm_source=x"), "./el/");
});

// ---------------------------------------------------------------- built pages

test("every language page holds all stops, in order, with its own language", () => {
  meta.languages.forEach((lang) => {
    const html = renderLanguagePage(site, lang);
    const ids = Array.from(html.matchAll(/<article class="qr-stop[^"]*" id="([^"]+)"/g), (match) => match[1]);

    assert.match(html, new RegExp(`<html lang="${lang}">`));
    assert.deepEqual(ids, meta.sectionOrder, `${lang}: stop order`);
    assert.equal((html.match(/data-listen>/g) || []).length, meta.sectionOrder.length, `${lang}: one listen button per stop`);
    assert.equal((html.match(/<audio /g) || []).length, 1, `${lang}: one shared player`);
    // data-template keeps the counter pattern for guide.js on purpose.
    const visibleMarkup = html.replace(/ data-template="[^"]*"/g, "");
    assert.doesNotMatch(visibleMarkup, /\{[a-zA-Z]+\}|undefined|\[object/, `${lang}: unreplaced placeholder`);
  });
});

test("every local file a page refers to exists", () => {
  for (const [relativePath, html] of renderSite(site)) {
    const pageDir = path.dirname(path.join(ROOT, relativePath));
    const references = Array.from(html.matchAll(/(?:src|href|data-src)="(\.{1,2}\/[^"#]*)/g), (match) => match[1]);

    references
      .filter((reference) => !reference.endsWith("/"))
      .forEach((reference) => assert.ok(fs.existsSync(path.join(pageDir, reference)), `${relativePath} → ${reference}`));
  }
});

test("language links point at every language page, and stop links at real stops", () => {
  const html = renderLanguagePage(site, "el");

  meta.languages.forEach((lang) => assert.match(html, new RegExp(`href="\\.\\./${lang}/"`)));
  Array.from(html.matchAll(/data-stop-link[^>]*|href="#([^"]+)"/g), (match) => match[1])
    .filter(Boolean)
    .forEach((id) => assert.ok(meta.sectionOrder.includes(id), `#${id}`));
});

test("a label ending in the Greek question mark gets no extra colon", () => {
  const html = renderLanguagePage(site, "el");
  assert.doesNotMatch(html, /;:</);
});

test("the map opens in a native dialog and loads its image only on demand", () => {
  const html = renderLanguagePage(site, "en");
  assert.match(html, /<dialog class="minimap-modal" data-map-modal/);
  assert.match(html, /<img class="minimap-modal__image" data-src="/);
});

test("the entry page lists every language for visitors without JavaScript", () => {
  const html = renderEntryPage(site);
  meta.languages.forEach((lang) => assert.match(html, new RegExp(`href="\\./${lang}/"`)));
  assert.match(html, /<script type="module" src="\.\/assets\/js\/entry\.js"><\/script>/);
});
