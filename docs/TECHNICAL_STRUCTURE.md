# Technical Structure

The Mylotopi QR Guide is a static single-page app. It has no framework build step.

Because runtime content is loaded from JSON files, local manual testing should serve the repository as static files and open `/index.html`.

## Root Files

- `index.html`: static entry point and application shell. It loads the stylesheet, metadata, i18n/content helper, and app runtime.
- `qr-guide.html`: tiny compatibility redirect for old QR targets. JavaScript preserves query params and hash fragments when redirecting to `index.html`.
- `package.json`: validation script entry point only. It does not add a build step.
- `README.md`: project overview and replacement pointers.

## JavaScript

- `assets/js/content-meta.js`: non-text runtime metadata, active language list, canonical section order, accent colors, and shared image metadata.
- `assets/js/i18n.js`: `GuideContentLoader` and selected-language content service. It loads `assets/content/<language>.json` on demand and caches only requested languages.
- `assets/js/app.js`: object-oriented runtime state, rendering, inline SVG language flags, URL/deep-link behavior, Mini-map modal, section dropdown navigation, language switching, audio lifecycle, gallery behavior, focus handling, and announcements.
- `scripts/validate-content.mjs`: Node-based deployment validator for active runtime content and media references.

## Styles

- `assets/css/main.css`: visual system, responsive layout, sticky navigation, hero, Mini-map, tour sections, gallery, audio controls, read-more affordance, utility styles, and reduced-motion handling.

## Runtime Content

- Active runtime languages: `en`, `el`, `de`, `fr`, `it`, `es`, `nl`, `pl`, `ru`, `tr`.
- Default language: `en`.
- Staged content folders: none currently.
- `assets/content/<language>.json`: one complete localized JSON file per active language, including UI labels, section text, image alt text, and language-specific audio paths.

Only languages listed in `MYLOTOPI_GUIDE_META.languages` are exposed in the language switcher.

The public QR code should open the tour from the beginning. Section query params such as `?spot=welcome` remain supported as optional direct links, not as separate QR destinations.

Language flags are centralized in `assets/js/app.js` as inline SVGs using the same `0 0 24 16` viewBox. Do not store emoji flags in content manifests.

## Assets

- `assets/audio/`: MP3 audio files organized by language.
- `assets/maps/`: flat per-language Mini-map JPGs named `minimap-<language>.jpg` and resolved through language JSON files.
- `assets/images/stops/`: stop image folders used by `assets/js/content-meta.js`.
- `assets/print/`: print and operations source/reference assets. These files are not automatically exposed in the public UI.
- `source-texts/`: source DOCX files used to produce runtime JSON content. These files are archival inputs and are not loaded by the app.

## Validation

Run:

```bash
npm run validate
```

The validator loads `assets/js/content-meta.js` in a sandbox, checks all active language files, verifies canonical section order, verifies ready audio paths, verifies Mini-map paths, verifies section/image metadata, and warns about intentional image placeholders and documented Mini-map fallbacks.

## Documentation

- `docs/`: internal project documentation for status, content replacement, operations, print assets, and technical structure.
