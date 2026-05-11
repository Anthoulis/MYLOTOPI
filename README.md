# Mylotopi QR Guide

Mylotopi QR Guide is a lightweight static microsite for the visitor audio/text tour at Mylotopi. It is built as a single-page guide with deep linking, multilingual content, per-stop audio, a Mini-map index, and per-stop gallery support.

## Current Status

Technical skeleton complete.

The guide structure, navigation, language setup, placeholder audio contract, image placeholder folders, print asset folder, and operations documentation are in place. Final visitor copy, final translations, final audio, final images, mobile testing, and deployment checks are still pending.

## App Structure

- `index.html`: static entry point.
- `qr-guide.html`: compatibility redirect to `index.html`.
- `assets/css/main.css`: visual system and responsive layout.
- `assets/js/content-meta.js`: global metadata, language config, spot order, aliases, and image metadata.
- `assets/js/i18n.js`: language normalization, fallback logic, and locale helpers.
- `assets/js/app.js`: rendering, navigation, URL state, Mini-map, audio lifecycle, and gallery behavior.
- `assets/locales/*.js`: localized UI text, stop text, and audio paths.
- `assets/audio/`: placeholder and final audio files.
- `assets/images/`: stop image placeholders and current tunnel gallery images.
- `assets/print/`: print and operations source/reference assets.
- `docs/`: internal project documentation.

## Supported Languages

Default language: English (`en`).

Configured language order:

1. English (`en`)
2. Greek (`el`)
3. German (`de`)
4. Dutch (`nl`)
5. Polish (`pl`)

## Tour Stops

1. Welcome / Introduction (`welcome`)
2. Garden with Herbs (`herb-garden`)
3. Windmill - First Floor (`windmill-first-floor`)
4. Windmill - Second Floor (`windmill-second-floor`)
5. Windmill - Third Floor (`windmill-third-floor`)
6. Threshing Floor & Donkeys (`threshing-floor-donkeys`)
7. Cellar / Italian Tunnel (`cellar-italian-tunnel`)
8. Traditional House (`traditional-house`)
9. Bakery (`bakery`)

## Replacing Content

- Text: update the matching language file in `assets/locales/`.
- Audio: replace files in `assets/audio/<language>/` using the same `.wav` filenames unless locale paths are intentionally updated.
- Images: add final images to `assets/images/stops/<numbered-stop>/` and wire display metadata through `assets/js/content-meta.js`.
- Print materials: update files in `assets/print/`, keeping stable filenames where possible.

See `docs/CONTENT_REPLACEMENT_GUIDE.md` for the full replacement checklist.

## Public Asset Warning

`assets/print/staff-instructions.docx` is internal staff material. Do not link it from the public UI.

Visitor-facing print files should be linked from the website only after explicit approval.
