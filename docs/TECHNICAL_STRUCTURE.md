# Technical Structure

The Mylotopi QR Guide is a static single-page app. It has no framework build step.

## Root Files

- `index.html`: static entry point and application shell. It loads the stylesheet, metadata, locales, i18n helper, and app runtime.
- `qr-guide.html`: compatibility redirect to `index.html` that preserves query parameters and hash fragments.
- `README.md`: project overview and replacement pointers.

## JavaScript

- `assets/js/content-meta.js`: global metadata, language configuration, language aliases, canonical spot order, legacy spot aliases, accent colors, and image metadata.
- `assets/js/i18n.js`: language normalization, locale fallback, UI text lookup, spot text lookup, image alt fallback, and audio fallback helpers.
- `assets/js/app.js`: runtime state, rendering, URL/deep-link behavior, Mini-map navigation, stop dropdown navigation, language switching, audio lifecycle, gallery behavior, focus handling, and announcements.

## Styles

- `assets/css/main.css`: visual system, responsive layout, sticky navigation, hero, Mini-map, tour sections, gallery, audio controls, utility styles, and reduced-motion handling.

## Locale Content

- `assets/locales/*.js`: per-language UI strings, spot text, image alt text, and audio paths.
- Supported locale files are `en.js`, `el.js`, `de.js`, `nl.js`, and `pl.js`.

## Assets

- `assets/audio/`: placeholder or final audio files, organized by language.
- `assets/images/`: image assets for stop galleries and placeholders.
- `assets/images/tunnel/`: current tunnel gallery images referenced by `assets/js/content-meta.js`.
- `assets/images/stops/`: one numbered folder per canonical stop for future final images.
- `assets/print/`: print and operations source/reference assets. These files are not automatically exposed in the public UI.

## Documentation

- `docs/`: internal project documentation for status, content replacement, operations, print assets, and technical structure.
