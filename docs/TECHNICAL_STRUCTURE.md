# Technical Structure

The Mylotopi QR Guide is a static single-page app. It has no framework build step.

Because runtime content is loaded from JSON files, local manual testing should serve the repository as static files and open `/index.html`.

## Root Files

- `index.html`: static entry point and application shell. It loads the stylesheet, metadata, i18n/content helper, and app runtime.
- `README.md`: project overview and replacement pointers.

## JavaScript

- `assets/js/content-meta.js`: global metadata, content base path, canonical spot order, accent colors, and image metadata.
- `assets/js/i18n.js`: JSON content loading, language normalization, content fallback, UI text lookup, spot text lookup, image alt fallback, and audio fallback helpers.
- `assets/js/app.js`: runtime state, rendering, URL/deep-link behavior, Mini-map navigation, stop dropdown navigation, language switching, audio lifecycle, gallery behavior, focus handling, and announcements.

## Styles

- `assets/css/main.css`: visual system, responsive layout, sticky navigation, hero, Mini-map, tour sections, gallery, audio controls, utility styles, and reduced-motion handling.

## Runtime Content

- `assets/content/<language>/index.json`: per-language manifest with language code, UI labels, Mini-map path, section order, section file paths, and audio paths.
- `assets/content/<language>/sections/*.json`: one localized JSON file per tour section.
- Supported content folders are `en`, `el`, `de`, `fr`, `it`, `es`, `nl`, `pl`, `ru`, and `tr`.

## Assets

- `assets/audio/`: real MP3 audio files, organized by language.
- `assets/maps/`: per-language mini-map JPGs resolved through language manifest JSON files.
- `assets/images/`: image assets for stop galleries and placeholders.
- `assets/images/tunnel/`: current tunnel gallery images referenced by `assets/js/content-meta.js`.
- `assets/images/stops/`: one numbered folder per canonical stop for future final images.
- `assets/print/`: print and operations source/reference assets. These files are not automatically exposed in the public UI.

## Documentation

- `docs/`: internal project documentation for status, content replacement, operations, print assets, and technical structure.
