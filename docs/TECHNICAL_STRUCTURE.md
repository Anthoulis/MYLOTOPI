# Technical Structure

The Mylotopi QR Guide is a static single-page app. It has no framework build step.

Because runtime content is loaded from JSON files, local manual testing should serve the repository as static files and open `/index.html`.

## Root Files

- `index.html`: static entry point and application shell. It loads the stylesheet, metadata, i18n/content helper, and app runtime.
- `qr-guide.html`: tiny compatibility redirect for old QR targets. JavaScript preserves query params and hash fragments when redirecting to `index.html`.
- `package.json`: validation script entry point only. It does not add a build step.
- `README.md`: project overview and replacement pointers.

## JavaScript

- `assets/js/content-meta.js`: global metadata, active language list, staged language list, content base path, canonical spot order, accent colors, and image metadata.
- `assets/js/i18n.js`: JSON content loading, language normalization, content fallback, UI text lookup, spot text lookup, image alt fallback, and audio fallback helpers.
- `assets/js/app.js`: runtime state, rendering, URL/deep-link behavior, Mini-map modal, stop dropdown navigation, language switching, audio lifecycle, gallery behavior, focus handling, and announcements.
- `scripts/validate-content.mjs`: Node-based deployment validator for active runtime content and media references.

## Styles

- `assets/css/main.css`: visual system, responsive layout, sticky navigation, hero, Mini-map, tour sections, gallery, audio controls, read-more affordance, utility styles, and reduced-motion handling.

## Runtime Content

- Active runtime languages: `en`, `el`, `de`.
- Staged content folders: `fr`, `it`, `es`, `nl`, `pl`, `ru`, `tr`.
- `assets/content/<language>/index.json`: per-language manifest with language code, UI labels, Mini-map path, section order, section file paths, and audio paths.
- `assets/content/<language>/sections/*.json`: one localized JSON file per tour section.

Only languages listed in `MYLOTOPI_GUIDE_META.languages` are exposed in the language switcher. Folders listed in `MYLOTOPI_GUIDE_META.stagedLanguages` are kept in the repository for future activation and documentation clarity.

## Assets

- `assets/audio/`: MP3 audio files organized by language.
- `assets/maps/`: per-language Mini-map JPGs resolved through language manifest JSON files.
- `assets/images/stops/`: stop image folders used by `assets/js/content-meta.js`.
- `assets/print/`: print and operations source/reference assets. These files are not automatically exposed in the public UI.

## Validation

Run:

```bash
npm run validate
```

The validator loads `assets/js/content-meta.js` in a sandbox, checks active language manifests and sections, verifies ready audio paths, verifies Mini-map paths, verifies spot/image metadata, and warns about intentional image placeholders.

## Documentation

- `docs/`: internal project documentation for status, content replacement, operations, print assets, and technical structure.
