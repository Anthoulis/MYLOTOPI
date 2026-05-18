# Mylotopi QR Guide

Mylotopi QR Guide is a lightweight static microsite for the visitor audio/text tour at Mylotopi. It is built as a single-page guide with deep linking, multilingual content, per-stop audio, a Mini-map index, and per-stop gallery support.

## Current Status

Real museum content integrated.

The guide structure, navigation, language setup, multilingual visitor copy, per-language MP3 audio, per-language mini-maps, print assets, image placeholder folders, and operations documentation are in place. Final section-specific image sets are still pending where no matching source assets exist.

## App Structure

- `index.html`: static entry point.
- `assets/css/main.css`: visual system and responsive layout.
- `assets/js/content-meta.js`: global metadata, content base path, canonical spot order, and image metadata.
- `assets/js/i18n.js`: JSON content loading, language normalization, fallback logic, and content helpers.
- `assets/js/app.js`: rendering, navigation, URL state, Mini-map, audio lifecycle, and gallery behavior.
- `assets/content/<language>/index.json`: language manifest, UI labels, Mini-map path, section order, section file paths, and audio paths.
- `assets/content/<language>/sections/*.json`: per-section localized visitor content.
- `assets/audio/`: real MP3 audio files, organized by language.
- `assets/maps/`: per-language mini-map JPGs.
- `assets/images/`: stop image placeholders and current tunnel gallery images.
- `assets/print/`: print and operations source/reference assets.
- `docs/`: internal project documentation.

## Running Locally

The site is still static and has no build step, but it now fetches JSON content files at runtime. Serve the repository as static files and open `/index.html`; opening the HTML file directly may block JSON loading in some browsers.

## Supported Languages

Default language: English (`en`).

Configured language order:

1. English (`en`)
2. Greek (`el`)
3. German (`de`)
4. French (`fr`)
5. Italian (`it`)
6. Spanish (`es`)
7. Dutch (`nl`)
8. Polish (`pl`)
9. Russian (`ru`)
10. Turkish (`tr`)

## Tour Stops

1. Welcome / Introduction (`welcome`)
2. Garden / Herbs (`garden-herbs`)
3. Windmill base (`windmill-base`)
4. Sleeping area (`sleeping-area`)
5. Machinery (`machinery`)
6. Threshing floor and donkeys (`threshing-floor-donkeys`)
7. Cellar / Italian tunnel (`cellar-italian-tunnel`)
8. Traditional house (`traditional-house`)
9. Bakery (`bakery`)

## Replacing Content

- Text: update the matching section JSON file in `assets/content/<language>/sections/`.
- Audio: replace files in `assets/audio/<language>/` using `section-01.mp3` through `section-09.mp3`.
- Audio paths: update the matching language manifest in `assets/content/<language>/index.json`.
- Mini-maps: replace `assets/maps/<language>/minimap.jpg`. Turkish currently uses the default map until a Turkish-specific source image is provided.
- Images: add final images to `assets/images/stops/<numbered-stop>/` and wire display metadata through `assets/js/content-meta.js`.
- Print materials: update files in `assets/print/`, keeping stable filenames where possible.

See `docs/CONTENT_REPLACEMENT_GUIDE.md` for the full replacement checklist.

## Public Asset Warning

`assets/print/staff-instructions.docx` is internal staff material. Do not link it from the public UI.

Visitor-facing print files should be linked from the website only after explicit approval.
