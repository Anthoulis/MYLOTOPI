# Mylotopi QR Guide

Mylotopi QR Guide is a lightweight static microsite for the visitor audio/text tour at Mylotopi. It is a single-page guide with query-param deep linking, structured multilingual content, per-stop audio, a Mini-map, and per-stop gallery support.

## Current Status

Production-active runtime languages are English (`en`), Greek (`el`), German (`de`), French (`fr`), Italian (`it`), Spanish (`es`), Dutch (`nl`), Polish (`pl`), Russian (`ru`), and Turkish (`tr`).

English is the default language. The language selector renders fixed inline SVG flags for all active languages; English uses a UK flag, and unknown future language codes use a neutral fallback icon.

Final section-specific image sets are still incomplete. When a stop does not have a suitable image, the guide intentionally shows a clean placeholder instead of an unrelated photo.

Turkish is active and currently uses a documented fallback mini-map copied from the default map. Replace it with a Turkish-specific source map when one is available.

## App Structure

- `index.html`: static entry point.
- `qr-guide.html`: compatibility redirect to `index.html` that preserves query params in JavaScript.
- `assets/css/main.css`: visual system and responsive layout.
- `assets/js/content-meta.js`: global metadata, runtime language list, canonical spot order, and image metadata.
- `assets/js/i18n.js`: JSON content loading, language normalization, fallback logic, and content helpers.
- `assets/js/app.js`: rendering, navigation, URL state, Mini-map, audio lifecycle, and gallery behavior.
- `assets/content/<language>/index.json`: language manifest, UI labels, Mini-map path, section order, section file paths, and audio paths.
- `assets/content/<language>/sections/*.json`: per-section localized visitor content.
- `assets/audio/`: MP3 audio files organized by language.
- `assets/maps/`: per-language Mini-map JPGs.
- `assets/images/`: stop image assets and current active gallery images.
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

The validator checks active language manifests, section JSON files, audio paths, Mini-map paths, spot metadata, and referenced images.

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
- Mini-maps: replace `assets/maps/<language>/minimap.jpg`.
- Images: add final images to `assets/images/stops/<numbered-stop>/` and wire display metadata through `assets/js/content-meta.js`.
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
