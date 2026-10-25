import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

import { createLanguageResolver, resolveEntryTarget } from "../assets/js/language.mjs";
import { imageVariants } from "../scripts/media.mjs";
import { serviceWorkerSource } from "../scripts/service-worker.mjs";
import { ROOT, loadSite, renderEntryPage, renderLanguagePage, renderSite, siteVersion } from "../scripts/site.mjs";

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

test("image copies never upscale and never repeat a width", () => {
  const widths = (originalWidth) => imageVariants("./originals/x/photo.jpg", "photo", originalWidth).map((copy) => copy.width);

  assert.deepEqual(widths(559), [480, 559]);
  assert.deepEqual(widths(800), [480, 800]);
  assert.deepEqual(widths(1402), [480, 800, 1200, 1402]);
  assert.deepEqual(widths(1920), [480, 800, 1200, 1600]);
  assert.deepEqual(widths(300), [300]);
  assert.equal(imageVariants("./originals/x/photo.jpg", "photo", 1402)[0].path, "./assets/x/photo-480.webp");
  assert.throws(() => imageVariants("./assets/x/photo.jpg", "photo", 800), /originals/);
});

test("every local file a page refers to exists", () => {
  for (const [relativePath, html] of renderSite(site)) {
    const pageDir = path.dirname(path.join(ROOT, relativePath));
    const references = Array.from(html.matchAll(/(?:src|href|data-src)="(\.{1,2}\/[^"#]*)/g), (match) => match[1]);
    // Every candidate of every srcset, e.g. "../assets/x-480.webp 480w, ../assets/x-800.webp 800w".
    Array.from(html.matchAll(/(?:srcset|data-srcset)="([^"]+)"/g), (match) => match[1]).forEach((srcset) => {
      srcset.split(",").forEach((candidate) => references.push(candidate.trim().split(/\s+/)[0]));
    });

    // Pages are served from the site; the full-quality originals never are.
    references.forEach((reference) => assert.doesNotMatch(reference, /originals\//, `${relativePath} → ${reference}`));
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

// The server's Content-Security-Policy refuses inline styles and inline scripts (only JSON data blocks pass).
test("no page carries inline styles or inline scripts", () => {
  for (const [relativePath, html] of renderSite(site)) {
    if (!relativePath.endsWith(".html")) {
      continue;
    }
    assert.doesNotMatch(html, /\sstyle="/, `${relativePath}: style attribute`);
    assert.doesNotMatch(html, /<style[\s>]/, `${relativePath}: <style> block`);
    assert.doesNotMatch(html, /\son[a-z]+="/, `${relativePath}: inline event handler`);
    Array.from(html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)).forEach(([, attributes, body]) => {
      assert.ok(/\bsrc="/.test(attributes) || /type="application\/json"/.test(attributes), `${relativePath}: inline script ${body.slice(0, 40)}`);
    });
  }
});

test("each stop takes its colour from the generated stylesheet", () => {
  const css = renderSite(site).get("assets/css/stops.css");
  meta.sectionOrder.forEach((id) => assert.match(css, new RegExp(`#${id} \\{ --stop-accent: ${meta.sections[id].accent}; \\}`)));
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

// ---------------------------------------------------------------- without signal

// Runs the service worker's code with a stand-in for the browser's `self`, and returns its helpers.
function serviceWorkerHelpers() {
  const listeners = {};
  globalThis.self = { addEventListener: (type, listener) => (listeners[type] = listener), location: { origin: "https://example.test" } };
  try {
    return { ...serviceWorkerSource("test", 4000), listeners };
  } finally {
    delete globalThis.self;
  }
}

test("kept narration answers range requests like the server", async () => {
  const { rangeResponse, listeners } = serviceWorkerHelpers();
  const body = new Blob([new Uint8Array(100).map((_, index) => index)]);
  const bytes = async (response) => Array.from(new Uint8Array(await response.arrayBuffer()));

  const whole = rangeResponse(body, null, "audio/mpeg");
  assert.equal(whole.status, 200);
  assert.equal((await bytes(whole)).length, 100);

  const start = rangeResponse(body, "bytes=0-", "audio/mpeg");
  assert.equal(start.status, 206);
  assert.equal(start.headers.get("Content-Range"), "bytes 0-99/100");

  const middle = rangeResponse(body, "bytes=10-19", "audio/mpeg");
  assert.equal(middle.headers.get("Content-Range"), "bytes 10-19/100");
  assert.deepEqual(await bytes(middle), [10, 11, 12, 13, 14, 15, 16, 17, 18, 19]);

  const probe = rangeResponse(body, "bytes=0-1", "audio/mpeg");
  assert.deepEqual(await bytes(probe), [0, 1]);

  const tail = rangeResponse(body, "bytes=-5", "audio/mpeg");
  assert.equal(tail.headers.get("Content-Range"), "bytes 95-99/100");

  assert.equal(rangeResponse(body, "bytes=100-", "audio/mpeg").status, 416);
  assert.deepEqual(Object.keys(listeners).sort(), ["activate", "fetch", "install"]);
});

test("any change to what the site serves makes a new service worker version", () => {
  const files = renderSite(site);
  const version = files.get("sw.js").match(/\("([0-9a-f]{12})", \d+\)/)[1];
  const changed = new Map(files);
  changed.delete("sw.js");
  changed.set("el/index.html", `${changed.get("el/index.html")}<!-- changed -->`);

  assert.notEqual(siteVersion(site, changed), version);
  const same = new Map(files);
  same.delete("sw.js");
  assert.equal(siteVersion(site, same), version);
});
