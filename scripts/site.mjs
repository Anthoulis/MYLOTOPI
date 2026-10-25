// Turns the content (assets/content/*.json) into the static pages of the guide.
// Pure functions only: reading happens in loadSite, writing in build.mjs.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { audioCopy, formatDuration, iconCopies, imageVariants, readImageSize, readMp3Duration } from "./media.mjs";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const LOGO_ORIGINAL = "./originals/logo/logo-header-light-full.png";
const THEME_COLOR = "#1f2210";
const END_ID = "tour-end";

const FLAG_SVG_MARKUP = {
  en: '<rect width="24" height="16" fill="#012169"></rect><path d="M0 0l24 16M24 0L0 16" stroke="#fff" stroke-width="3.2"></path><path d="M0 0l24 16M24 0L0 16" stroke="#c8102e" stroke-width="1.7"></path><path d="M12 0v16M0 8h24" stroke="#fff" stroke-width="5.2"></path><path d="M12 0v16M0 8h24" stroke="#c8102e" stroke-width="3"></path>',
  el: '<rect width="24" height="16" fill="#0d5eaf"></rect><path d="M0 3h24M0 6h24M0 9h24M0 12h24M0 15h24" stroke="#fff" stroke-width="1"></path><rect width="9.5" height="8.8" fill="#0d5eaf"></rect><path d="M4.75 0v8.8M0 4.4h9.5" stroke="#fff" stroke-width="1.6"></path>',
  de: '<rect width="24" height="5.34" fill="#000"></rect><rect y="5.33" width="24" height="5.34" fill="#dd0000"></rect><rect y="10.66" width="24" height="5.34" fill="#ffce00"></rect>',
  fr: '<rect width="8" height="16" fill="#0055a4"></rect><rect x="8" width="8" height="16" fill="#fff"></rect><rect x="16" width="8" height="16" fill="#ef4135"></rect>',
  it: '<rect width="8" height="16" fill="#009246"></rect><rect x="8" width="8" height="16" fill="#fff"></rect><rect x="16" width="8" height="16" fill="#ce2b37"></rect>',
  es: '<rect width="24" height="16" fill="#aa151b"></rect><rect y="4" width="24" height="8" fill="#f1bf00"></rect>',
  nl: '<rect width="24" height="5.34" fill="#ae1c28"></rect><rect y="5.33" width="24" height="5.34" fill="#fff"></rect><rect y="10.66" width="24" height="5.34" fill="#21468b"></rect>',
  pl: '<rect width="24" height="8" fill="#fff"></rect><rect y="8" width="24" height="8" fill="#dc143c"></rect>',
  ru: '<rect width="24" height="5.34" fill="#fff"></rect><rect y="5.33" width="24" height="5.34" fill="#0039a6"></rect><rect y="10.66" width="24" height="5.34" fill="#d52b1e"></rect>',
  tr: '<rect width="24" height="16" fill="#e30a17"></rect><circle cx="10" cy="8" r="4.2" fill="#fff"></circle><circle cx="11.2" cy="8" r="3.35" fill="#e30a17"></circle><path d="M15.1 5.9l.45 1.32h1.42l-1.15.82.44 1.33-1.16-.83-1.14.83.43-1.33-1.15-.82h1.42z" fill="#fff"></path>',
};

// One icon set, one stroke weight, drawn in currentColor.
const ICON_PATHS = {
  play: '<path d="M8 5.5v13l10.5-6.5z" fill="currentColor" stroke="none"></path>',
  pause: '<path d="M8 5.5v13M16 5.5v13" stroke-width="3"></path>',
  map: '<path d="M9 4.5 3.5 6.5v13l5.5-2 6 2 5.5-2v-13l-5.5 2z"></path><path d="M9 4.5v13M15 6.5v13"></path>',
  up: '<path d="m6.5 14.5 5.5-5.5 5.5 5.5"></path>',
  down: '<path d="m6.5 9.5 5.5 5.5 5.5-5.5"></path>',
  left: '<path d="m14.5 6.5-5.5 5.5 5.5 5.5"></path>',
  right: '<path d="m9.5 6.5 5.5 5.5-5.5 5.5"></path>',
};

function icon(name, className = "icon") {
  return (
    `<svg class="${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ` +
    `stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${ICON_PATHS[name]}</svg>`
  );
}

// ---------------------------------------------------------------- loading

export function loadSite(root = ROOT) {
  const contentDir = path.join(root, "assets", "content");
  const meta = JSON.parse(fs.readFileSync(path.join(contentDir, "meta.json"), "utf8"));
  const content = new Map(
    meta.languages.map((lang) => [lang, JSON.parse(fs.readFileSync(path.join(contentDir, `${lang}.json`), "utf8"))]),
  );

  return {
    root,
    meta,
    content,
    imageSize: (assetPath) => readImageSize(path.join(root, assetPath)),
    // The duration of the copy the visitor hears, read from the file itself.
    audioDuration: (originalPath) => formatDuration(readMp3Duration(path.join(root, audioCopy(originalPath)))),
  };
}

// ---------------------------------------------------------------- helpers

export function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function formatTemplate(template, values) {
  return String(template || "").replace(/\{([a-zA-Z0-9_]+)\}/g, (match, key) =>
    Object.prototype.hasOwnProperty.call(values, key) ? values[key] : match,
  );
}

// Content paths are written from the site root ("./assets/..."); language pages live one level down.
function fromLanguagePage(assetPath) {
  return assetPath.replace(/^\.\//, "../");
}

// Stop titles stay English in every language (PROJECT_RULES), so screen readers need lang="en".
function englishAttr(lang) {
  return lang === "en" ? "" : ' lang="en"';
}

function flagIcon(lang) {
  return `<svg class="language-option__flag" viewBox="0 0 24 16" aria-hidden="true" focusable="false">${FLAG_SVG_MARKUP[lang]}</svg>`;
}

function languageName(site, lang) {
  return site.content.get(lang).nativeName;
}

// A label gets a colon before its text unless it already ends in punctuation
// (including the Greek question mark ";").
function itemLabel(label, text) {
  return label && text && !/[.!?:;]$/.test(label) ? `${label}:` : label;
}

// ---------------------------------------------------------------- content blocks

function renderStoryItem(item) {
  if (typeof item === "string") {
    return `<li class="story-block__item">${escapeHtml(item)}</li>`;
  }

  const label = (item.label || "").trim();
  const text = (item.text || "").trim();
  const labelMarkup = label ? `<strong class="story-block__item-label">${escapeHtml(itemLabel(label, text))}</strong> ` : "";
  const textMarkup = text ? `<span class="story-block__item-text">${escapeHtml(text)}</span>` : "";
  return `<li class="story-block__item">${labelMarkup}${textMarkup}</li>`;
}

function renderStoryBlock(block) {
  const paragraphs = (block.paragraphs || []).map((paragraph) => `<p class="story-block__paragraph">${escapeHtml(paragraph)}</p>`);
  const list = block.items && block.items.length ? `<ul class="story-block__list">${block.items.map(renderStoryItem).join("")}</ul>` : "";
  return `<section class="story-block"><h3 class="story-block__heading">${escapeHtml(block.heading)}</h3>${paragraphs.join("")}${list}</section>`;
}

function renderCopyItem(item) {
  if (typeof item === "string") {
    return `<li>${escapeHtml(item)}</li>`;
  }

  const label = (item.label || "").trim();
  const text = (item.text || "").trim();
  const labelMarkup = label ? `<strong class="qr-copy__item-label">${escapeHtml(itemLabel(label, text))}</strong> ` : "";
  return `<li>${labelMarkup}${text ? `<span>${escapeHtml(text)}</span>` : ""}</li>`;
}

// Transcript blocks: every shape the validator accepts (validateDetails).
function renderCopyBlock(block) {
  if (typeof block === "string") {
    return `<p>${escapeHtml(block)}</p>`;
  }
  if (block.type === "heading") {
    return `<h3 class="qr-copy__heading">${escapeHtml(block.text)}</h3>`;
  }
  if (block.type === "list") {
    return `<ul class="qr-copy__list">${block.items.map(renderCopyItem).join("")}</ul>`;
  }
  if ("heading" in block || "body" in block) {
    const heading = block.heading ? `<h3 class="qr-copy__heading">${escapeHtml(block.heading)}</h3>` : "";
    const body = block.body ? `<p>${escapeHtml(block.body)}</p>` : "";
    return `<section class="qr-copy__section">${heading}${body}</section>`;
  }
  return `<p>${escapeHtml(block.text)}</p>`;
}

// A native <details> keeps the open/closed state in the browser itself: nothing to get out of sync.
function renderDisclosure(variant, labels, bodyMarkup) {
  if (!bodyMarkup) {
    return "";
  }

  return (
    `<details class="qr-readmore qr-readmore--${variant}">` +
    `<summary class="qr-readmore__button">` +
    `<span class="qr-readmore__label qr-readmore__label--closed">${escapeHtml(labels.more)}</span>` +
    `<span class="qr-readmore__label qr-readmore__label--open">${escapeHtml(labels.less)}</span>` +
    icon("down", "qr-readmore__chevron") +
    `</summary>${bodyMarkup}</details>`
  );
}

// ---------------------------------------------------------------- page parts

function renderLanguageMenu(site, lang) {
  const ui = site.content.get(lang).ui;

  const options = site.meta.languages
    .map(
      (code) =>
        `<a class="selector__option language-option" href="../${code}/" hreflang="${code}" lang="${code}" data-language-link` +
        `${code === lang ? ' aria-current="page"' : ""}>` +
        `${flagIcon(code)}<span class="language-option__name">${escapeHtml(languageName(site, code))}</span></a>`,
    )
    .join("");

  return (
    `<details class="selector selector--language" data-menu>` +
    `<summary class="header-button" aria-label="${escapeHtml(`${ui.languageLabel}: ${languageName(site, lang)}`)}">` +
    `${flagIcon(lang)}<span class="header-button__text">${escapeHtml(languageName(site, lang))}</span>${icon("down", "header-button__chevron")}</summary>` +
    `<div class="selector__menu selector__menu--language" role="group" aria-label="${escapeHtml(ui.languageLabel)}">${options}</div>` +
    `</details>`
  );
}

// The light WebP copies of an original image (scripts/media.mjs), for a language page.
// `sizes` tells the phone how wide the image is drawn, so it downloads only the copy it needs.
function responsiveImage(site, originalPath, kind, sizes) {
  const { width, height } = site.imageSize(originalPath);
  const variants = imageVariants(originalPath, kind, width);
  const fallback = variants.find((variant) => variant.width >= 800) || variants.at(-1);

  return {
    src: fromLanguagePage(fallback.path),
    srcset: variants.map((variant) => `${fromLanguagePage(variant.path)} ${variant.width}w`).join(", "),
    largest: fromLanguagePage(variants.at(-1).path),
    sizes,
    width,
    height,
  };
}

// A stop photo spans the stop card: the column (760px at most) minus the card padding and border.
const PHOTO_SIZES = "(min-width: 792px) 710px, calc(100vw - 66px)";
const MAP_SIZES = "(min-width: 792px) 736px, calc(100vw - 56px)";

function renderHeader(site, lang) {
  const { ui, miniMap } = site.content.get(lang);
  const logo = responsiveImage(site, LOGO_ORIGINAL, "logo", "150px");
  const map = responsiveImage(site, miniMap.path, "map", MAP_SIZES);

  // Without JavaScript the map button is a plain link to the map image.
  return (
    `<header class="site-header"><nav class="container site-header__inner" aria-label="${escapeHtml(ui.navigationLabel)}">` +
    `<span class="brand"><img class="brand__logo" src="${logo.src}" srcset="${logo.srcset}" sizes="${logo.sizes}" ` +
    `alt="Mylotopi" translate="no" width="${logo.width}" height="${logo.height}" decoding="async"></span>` +
    `<div class="header-actions">` +
    `<a class="header-button" href="${map.largest}" data-map-open>${icon("map")}<span class="header-button__text">${escapeHtml(ui.mapButton)}</span></a>` +
    renderLanguageMenu(site, lang) +
    `</div></nav></header>`
  );
}

function renderMapDialog(site, lang) {
  const { ui, miniMap } = site.content.get(lang);
  const map = responsiveImage(site, miniMap.path, "map", MAP_SIZES);

  // The map image loads only when the dialog opens: guide.js moves data-* into the real attributes.
  return (
    `<dialog class="minimap-modal" data-map-modal aria-labelledby="minimap-modal-title">` +
    `<div class="minimap-modal__dialog"><div class="minimap-modal__head">` +
    `<h2 class="minimap-modal__title" id="minimap-modal-title">${escapeHtml(ui.mapButton)}</h2>` +
    `<button class="minimap-modal__close" type="button" data-map-close>${escapeHtml(ui.miniMapModalClose)}</button>` +
    `</div><img class="minimap-modal__image" data-src="${map.src}" data-srcset="${map.srcset}" sizes="${map.sizes}" ` +
    `alt="${escapeHtml(ui.miniMapImageAlt)}" width="${map.width}" height="${map.height}" decoding="async">` +
    `</div></dialog>`
  );
}

function renderGallery(site, lang, section, index) {
  const ui = site.content.get(lang).ui;
  const images = site.meta.sections[section.id].images;
  const alt = section.imageAlt || section.navigationTitle;

  if (!images.length) {
    return (
      `<div class="qr-carousel"><div class="qr-media qr-carousel__frame is-placeholder" role="img" aria-label="${escapeHtml(alt)}">` +
      `<div class="qr-media__placeholder"><span>${escapeHtml(ui.imagePlaceholderLabel)}</span>` +
      `<strong${englishAttr(lang)}>${escapeHtml(section.navigationTitle)}</strong><small>${escapeHtml(ui.imagePlaceholderHint)}</small>` +
      `</div></div></div>`
    );
  }

  const frames = images
    .map((image) => {
      const photo = responsiveImage(site, image.src, "photo", PHOTO_SIZES);
      return (
        `<div class="qr-media qr-carousel__frame" data-image-fit="${image.fit}">` +
        `<img class="qr-carousel__image" src="${photo.src}" srcset="${photo.srcset}" sizes="${photo.sizes}" alt="${escapeHtml(alt)}" ` +
        `width="${photo.width}" height="${photo.height}" loading="${index === 0 ? "eager" : "lazy"}" decoding="async"></div>`
      );
    })
    .join("");

  // Swiping works without JavaScript; the buttons and the counter are added by guide.js.
  const controls =
    images.length > 1
      ? `<figcaption class="qr-carousel__controls" hidden>` +
        `<button class="qr-carousel__button" type="button" data-gallery-step="-1" aria-label="${escapeHtml(ui.galleryPrevious)}">${icon("left")}</button>` +
        `<span class="qr-carousel__counter" data-gallery-counter data-template="${escapeHtml(ui.imageCounter)}">` +
        `${escapeHtml(formatTemplate(ui.imageCounter, { current: "1", total: String(images.length) }))}</span>` +
        `<button class="qr-carousel__button" type="button" data-gallery-step="1" aria-label="${escapeHtml(ui.galleryNext)}">${icon("right")}</button>` +
        `</figcaption>`
      : "";

  return `<figure class="qr-carousel" data-gallery><div class="qr-carousel__track" data-gallery-track>${frames}</div>${controls}</figure>`;
}

// The listen button feeds the player at the bottom of the screen. Without JavaScript it is
// a plain link, and the phone's own player opens the MP3.
function renderListen(site, lang, section, duration) {
  const ui = site.content.get(lang).ui;

  if (section.audio.ready === false) {
    return `<p class="qr-listen-missing">${escapeHtml(ui.audioFallback)}</p>`;
  }

  return (
    `<a class="qr-listen" href="${fromLanguagePage(audioCopy(section.audio.path))}" data-listen>` +
    `<span class="qr-listen__icon">${icon("play", "icon icon--play")}${icon("pause", "icon icon--pause")}</span>` +
    `<span class="qr-listen__label">${escapeHtml(ui.listen)}</span>` +
    `<span class="qr-listen__time">${duration}</span></a>` +
    (section.audio.caption ? `<p class="qr-listen-caption">${escapeHtml(section.audio.caption)}</p>` : "")
  );
}

function renderStory(site, lang, section, isLast) {
  const ui = site.content.get(lang).ui;
  // The last stop shows its whole story: it ends with the thank-you and the way to the café.
  const [visible, hidden] = isLast ? [section.storyBlocks, []] : [section.storyBlocks.slice(0, 1), section.storyBlocks.slice(1)];

  return (
    `<div class="qr-story">` +
    visible.map(renderStoryBlock).join("") +
    renderDisclosure("story", { more: ui.readMore, less: ui.readLess }, hidden.length ? `<div class="story-expanded">${hidden.map(renderStoryBlock).join("")}</div>` : "") +
    renderDisclosure(
      "transcript",
      { more: ui.transcriptMore, less: ui.transcriptLess },
      section.transcript.length ? `<div class="qr-copy">${section.transcript.map(renderCopyBlock).join("")}</div>` : "",
    ) +
    `</div>`
  );
}

function renderStopNavLink(lang, ui, direction, target) {
  const isPrevious = direction < 0;
  const className = `qr-stop-nav__button qr-stop-nav__button--${isPrevious ? "previous" : "next"}`;

  if (!target) {
    return `<span class="${className}" aria-hidden="true"></span>`;
  }

  const label = isPrevious ? ui.previousSection : ui.nextSection;
  const aria = formatTemplate(isPrevious ? ui.previousSectionAria : ui.nextSectionAria, { title: target.navigationTitle });
  return (
    `<a class="${className}" href="#${target.id}" data-stop-link aria-label="${escapeHtml(aria)}">` +
    `<span class="qr-stop-nav__meta">${escapeHtml(label)}</span>` +
    `<strong class="qr-stop-nav__title"${englishAttr(lang)}>${escapeHtml(target.navigationTitle)}</strong></a>`
  );
}

function renderStop(site, lang, section, index) {
  const { ui, sections } = site.content.get(lang);
  const isLast = index === sections.length - 1;
  const duration = site.audioDuration(section.audio.path);
  const next = isLast ? null : sections[index + 1];

  return (
    `<article class="qr-stop${index === 0 ? " is-active" : ""}" id="${section.id}" data-stop tabindex="-1" ` +
    `aria-labelledby="${section.id}-title" ` +
    `data-number="${index + 1}" data-duration="${duration}">` +
    `<h2 class="qr-stop__title" id="${section.id}-title"><span class="qr-stop__number">${index + 1}</span>` +
    `<span class="qr-stop__name"${englishAttr(lang)}>${escapeHtml(section.title)}</span></h2>` +
    renderGallery(site, lang, section, index) +
    renderListen(site, lang, section, duration) +
    renderStory(site, lang, section, isLast) +
    `<nav class="qr-stop-nav" aria-label="${escapeHtml(ui.sectionsLabel)}">` +
    renderStopNavLink(lang, ui, -1, sections[index - 1]) +
    renderStopNavLink(lang, ui, 1, next) +
    `</nav></article>`
  );
}

function renderTourEnd(site, lang) {
  const { ui, sections } = site.content.get(lang);

  return (
    `<section class="qr-end" id="${END_ID}" tabindex="-1" aria-labelledby="${END_ID}-title">` +
    `<h2 class="qr-end__title" id="${END_ID}-title">${escapeHtml(ui.tourEndTitle)}</h2>` +
    `<a class="qr-end__restart" href="#${sections[0].id}" data-stop-link>${icon("up")}<span>${escapeHtml(ui.backToStart)}</span></a>` +
    `</section>`
  );
}

// The player stays at the bottom, in reach of the thumb. It shows the narration that is
// playing, or the stop on screen when nothing plays; its title opens the list of stops.
function renderPlayer(site, lang) {
  const { ui, sections } = site.content.get(lang);
  const first = sections[0];

  const stops = sections
    .map(
      (section, index) =>
        `<a class="selector__option selector__option--stop" href="#${section.id}" data-stop-link aria-current="${index === 0}">` +
        `<span class="selector__option-number">${index + 1}</span>` +
        `<span${englishAttr(lang)}>${escapeHtml(section.navigationTitle)}</span></a>`,
    )
    .join("");

  return (
    `<div class="player" data-player hidden role="region" aria-label="${escapeHtml(ui.audioHeading)}">` +
    `<div class="container player__inner">` +
    `<button class="player__toggle" type="button" data-player-toggle aria-label="${escapeHtml(ui.play)}" ` +
    `data-label-play="${escapeHtml(ui.play)}" data-label-pause="${escapeHtml(ui.pause)}">` +
    `${icon("play", "icon icon--play")}${icon("pause", "icon icon--pause")}</button>` +
    `<details class="player__stops" data-menu>` +
    `<summary class="player__stop" aria-label="${escapeHtml(ui.sectionsLabel)}">` +
    `<span class="player__number" data-player-number>1</span>` +
    `<span class="player__title" data-player-title${englishAttr(lang)}>${escapeHtml(first.navigationTitle)}</span>` +
    `<span class="player__time" data-player-time>${site.audioDuration(first.audio.path)}</span>` +
    `${icon("up", "player__chevron")}</summary>` +
    `<div class="selector__menu selector__menu--stops" role="group" aria-label="${escapeHtml(ui.sectionsLabel)}">${stops}</div>` +
    `</details>` +
    `<input class="player__seek" type="range" min="0" max="1000" step="1" value="0" data-player-seek aria-label="${escapeHtml(ui.seekLabel)}">` +
    `</div>` +
    `<audio data-player-audio preload="none"></audio>` +
    `</div>`
  );
}

// The stop colours and photo positions come from meta.json. They go into a stylesheet of their
// own, because the server's Content-Security-Policy refuses style="" attributes in the HTML.
export function renderStopStyles(site) {
  const rules = site.meta.sectionOrder.map((id) => {
    const { accent, images } = site.meta.sections[id];
    if (!/^#[0-9a-f]{3,8}$/i.test(accent)) {
      throw new Error(`meta.json: sections.${id}.accent must be a hex colour, got ${accent}`);
    }

    const positions = images
      .map((image, index) => ({ position: image.position || "center", index }))
      .filter(({ position }) => position !== "center")
      .map(({ position, index }) => {
        if (!/^[a-z0-9.%\-\s]+$/i.test(position)) {
          throw new Error(`meta.json: sections.${id}.images[${index}].position is not a CSS position: ${position}`);
        }
        return `#${id} .qr-carousel__frame:nth-child(${index + 1}) .qr-carousel__image { object-position: ${position}; }\n`;
      });

    return `#${id} { --stop-accent: ${accent}; }\n${positions.join("")}`;
  });

  return `/* Generated by npm run build from assets/content/meta.json. Do not edit. */\n${rules.join("")}`;
}

// `assets` is the path to assets/ from the page: "../assets/" for a language page, "./assets/" at the root.
function renderHead({ lang, title, assets }) {
  const [tabIcon, homeIcon] = iconCopies().map((copy) => copy.path.replace("./assets/", assets));

  return (
    `<!DOCTYPE html>\n<html lang="${lang}">\n<head>\n` +
    `<meta charset="utf-8">\n` +
    `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n` +
    `<meta name="theme-color" content="${THEME_COLOR}">\n` +
    `<meta name="color-scheme" content="light">\n` +
    `<title>${escapeHtml(title)}</title>\n` +
    `<link rel="icon" type="image/png" sizes="32x32" href="${tabIcon}">\n` +
    `<link rel="apple-touch-icon" href="${homeIcon}">\n` +
    `<link rel="stylesheet" href="${assets}css/main.css">\n` +
    `<link rel="stylesheet" href="${assets}css/stops.css">\n`
  );
}

// ---------------------------------------------------------------- pages

export function renderLanguagePage(site, lang) {
  const { ui, sections } = site.content.get(lang);

  return (
    renderHead({ lang, title: `${ui.heroTitle} | Mylotopi`, assets: "../assets/" }) +
    `<script type="module" src="../assets/js/guide.js"></script>\n` +
    `</head>\n<body>\n<div class="qr-page">\n` +
    renderHeader(site, lang) +
    `\n<main class="container qr-main">\n` +
    `<div class="qr-hero"><h1 class="qr-hero__title">${escapeHtml(ui.heroTitle)}</h1>` +
    `<p class="qr-hero__place">${escapeHtml(ui.kicker)}</p></div>\n` +
    sections.map((section, index) => renderStop(site, lang, section, index)).join("\n") +
    "\n" +
    renderTourEnd(site, lang) +
    `\n</main>\n` +
    renderPlayer(site, lang) +
    "\n" +
    renderMapDialog(site, lang) +
    `\n</div>\n</body>\n</html>\n`
  );
}

// The entry page answers every address printed on a QR code and forwards to a language page.
export function renderEntryPage(site) {
  const { meta } = site;
  const config = {
    defaultLanguage: meta.defaultLanguage,
    languages: meta.languages,
    languageAliases: meta.languageAliases,
    stopIds: meta.sectionOrder,
  };
  const links = meta.languages
    .map(
      (code) =>
        `<a class="selector__option language-option" href="./${code}/" hreflang="${code}" lang="${code}">` +
        `${flagIcon(code)}<span class="language-option__name">${escapeHtml(languageName(site, code))}</span></a>`,
    )
    .join("");

  return (
    renderHead({ lang: meta.defaultLanguage, title: "Mylotopi", assets: "./assets/" }) +
    `<script type="application/json" id="site-config">${JSON.stringify(config)}</script>\n` +
    `<script type="module" src="./assets/js/entry.js"></script>\n` +
    `</head>\n<body>\n<div class="qr-page">\n<main class="container qr-entry">\n` +
    `<h1 class="qr-hero__title" translate="no">Mylotopi</h1>\n` +
    `<nav class="qr-entry__languages" aria-label="Language">${links}</nav>\n` +
    `</main>\n</div>\n</body>\n</html>\n`
  );
}

// Every generated file, keyed by its path from the site root.
export function renderSite(site) {
  const files = new Map();
  const entry = renderEntryPage(site);

  files.set("assets/css/stops.css", renderStopStyles(site));
  files.set("index.html", entry);
  files.set("qr-guide.html", entry);
  site.meta.languages.forEach((lang) => files.set(`${lang}/index.html`, renderLanguagePage(site, lang)));

  return files;
}
