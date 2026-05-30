# Mylotopi QR Guide

Mylotopi QR Guide is a lightweight static microsite for the visitor audio/text tour at Mylotopi. It is a single-page guide with URL language selection, optional section deep linking, structured multilingual content, per-section audio, a Mini-map, and per-section gallery support.

## Current Status

Production-active runtime languages are English (`en`), Greek (`el`), German (`de`), French (`fr`), Italian (`it`), Spanish (`es`), Dutch (`nl`), Polish (`pl`), Russian (`ru`), and Turkish (`tr`).

English is the default language. The language selector renders fixed inline SVG flags for all active languages; English uses a UK flag, and unknown future language codes use a neutral fallback icon.

Final section-specific image sets are still incomplete. When a section does not have a suitable image, the guide intentionally shows a clean placeholder instead of an unrelated photo.

Turkish is active and currently uses a documented fallback mini-map copied from the default map. Replace it with a Turkish-specific source map when one is available.

The public QR code should open the tour from the beginning. Sections are internal navigation within the same page; `?spot=...` remains supported only as an optional deep link.

## App Structure

- `index.html`: static entry point.
- `qr-guide.html`: compatibility redirect to `index.html` that preserves query params in JavaScript.
- `assets/css/main.css`: visual system and responsive layout.
- `assets/js/content-meta.js`: non-text metadata, runtime language list, canonical section order, accent colors, and shared image metadata.
- `assets/js/i18n.js`: selected-language JSON loading, language normalization, caching, and content helpers.
- `assets/js/app.js`: object-oriented runtime state, rendering, navigation, URL state, Mini-map, audio lifecycle, and gallery behavior.
- `assets/content/<language>.json`: complete localized guide content for one language, including UI labels, section text, image alt text, and language-specific audio paths.
- `assets/audio/`: MP3 audio files organized by language.
- `assets/maps/`: flat per-language Mini-map JPGs named `minimap-<language>.jpg`.
- `assets/images/`: section image assets and current active gallery images.
- `assets/print/`: print and operations source/reference assets.
- `docs/`: internal project documentation.

## Running Locally

The site is static and has no build step, but it fetches JSON content files at runtime. Serve the repository as static files and open `/index.html`; opening the HTML file directly may block JSON loading in some browsers.

Example:

```bash
python -m http.server 8000
```

Then open `http://localhost:8000/index.html`.

## Validation

Run the deployment validator before publishing:

```bash
npm run validate
```

The validator checks active language files, canonical section order, required UI and section fields, ready audio paths, Mini-map paths, section metadata, and referenced images.

## Runtime Languages

Active:

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
2. Herb Garden (`herb-garden`)
3. Windmill First Floor (`windmill-first-floor`)
4. Windmill Second Floor (`windmill-second-floor`)
5. Windmill Third Floor (`windmill-third-floor`)
6. Threshing floor and donkeys (`threshing-floor-donkeys`)
7. Cellar / Italian tunnel (`cellar-italian-tunnel`)
8. Traditional house (`traditional-house`)
9. Bakery (`bakery`)

## Replacing Content

- Text: update the matching language file, for example `assets/content/en.json`.
- Audio: replace files in `assets/audio/<language>/` using `section-01.mp3` through `section-09.mp3`.
- Audio paths: update the matching section object inside `assets/content/<language>.json`.
- Mini-maps: replace `assets/maps/minimap-<language>.jpg`.
- Images: add final images under `assets/images/stops/` and wire display metadata through `assets/js/content-meta.js`.
- Print materials: update files in `assets/print/`, keeping stable filenames where possible.

See `docs/CONTENT_REPLACEMENT_GUIDE.md` for the full replacement checklist.

## Pre-deploy Checklist

1. Run a local static server.
2. Run `npm run validate`.
3. Test widths `320`, `360`, `390`, `430`, `720`, `980`, and `1180`.
4. Test language switching.
5. Test every audio file.
6. Test every gallery.
7. Test the Mini-map modal.
8. Test URL params `?lang=en&spot=welcome`.
9. Test invalid params fallback.
10. Check the browser console for errors.

## Public Asset Warning

`assets/print/staff-instructions.docx` is internal staff material. Do not link it from the public UI.

Visitor-facing print files should be linked from the website only after explicit approval.
