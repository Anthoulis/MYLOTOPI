# Content Replacement Guide

This guide explains how to replace structured content without changing the QR Guide structure or app behavior.

## Language Codes

- `en`: English, default
- `el`: Greek
- `de`: German
- `fr`: French
- `it`: Italian
- `es`: Spanish
- `nl`: Dutch
- `pl`: Polish
- `ru`: Russian
- `tr`: Turkish

Keep this order in the UI unless there is an explicit product decision to change it.

## Canonical Spot Keys

1. `welcome`
2. `garden-herbs`
3. `windmill-base`
4. `sleeping-area`
5. `machinery`
6. `threshing-floor-donkeys`
7. `cellar-italian-tunnel`
8. `traditional-house`
9. `bakery`

These are the final public route keys for future QR generation. Do not add compatibility aliases for route names that are not being printed or published.

## Replacing Audio

Current project audio format:

- `.mp3` for every supported language.

Each language folder under `assets/audio/` contains 9 audio files:

- `section-01.mp3`: Welcome / Introduction
- `section-02.mp3`: Garden / Herbs
- `section-03.mp3`: Windmill base
- `section-04.mp3`: Sleeping area
- `section-05.mp3`: Machinery
- `section-06.mp3`: Threshing floor and donkeys
- `section-07.mp3`: Cellar / Italian tunnel
- `section-08.mp3`: Traditional house
- `section-09.mp3`: Bakery

Replace narration using the same filenames whenever possible.

Do not leave zero-byte, corrupt, or invalid audio files. Browser audio controls must be able to load the files.

If the final format changes later, update the `audio.path` values in every affected `assets/content/<language>/index.json` file and confirm MIME handling in `assets/js/app.js` still supports the extension.

## Replacing Images

Add final stop images to the matching folder under `assets/images/stops/`.

Recommended filenames:

- `01-main.webp`
- `02-detail.webp`
- `03-extra.webp`

After adding images, update the matching spot's `images` array in `assets/js/content-meta.js`.

Existing tunnel images currently remain in `assets/images/tunnel/` and are referenced from `assets/js/content-meta.js`. If those images are moved later, update every referenced path in the metadata file at the same time.

## Updating Localized Text

Localized runtime content belongs in `assets/content/`.

Each language folder should keep:

- `index.json`
- `sections/01-welcome.json`
- `sections/02-garden-herbs.json`
- `sections/03-windmill-base.json`
- `sections/04-sleeping-area.json`
- `sections/05-machinery.json`
- `sections/06-threshing-floor-donkeys.json`
- `sections/07-cellar-italian-tunnel.json`
- `sections/08-traditional-house.json`
- `sections/09-bakery.json`

Each section JSON contains:

- `id`
- `title`
- `preview`
- `details`
- `bullets`

`details` preserves the ordered reading structure. Bullet groups are stored once in `bullets` and referenced from `details` with `{ "type": "bulletGroup", "id": "..." }`.

Do not hardcode translated visitor copy in `index.html`, `assets/js/app.js`, or any other JavaScript file.

When extracting from source DOCX files, split on the source marker `Read more>>` if it exists. Text before the marker becomes `preview`; text after the marker becomes `details`. The literal marker must not be stored for rendering.

## Filename And Path Rules

- Keep audio paths in the form `./assets/audio/<language>/section-<number>.mp3`.
- Keep section paths in language manifests in the form `sections/<number>-<slug>.json`.
- Keep stop image folders in the form `assets/images/stops/<number>-<slug>/`.
- Use lowercase kebab-case for new asset filenames where practical.
- Keep public paths stable after QR targets are finalized; before then, prefer clean semantic ids and update every reference safely.
- Do not link internal staff files from the public UI.

## Deployment Checklist

- All 10 language manifests load without JavaScript errors.
- All languages contain the same 9 section ids.
- Every `audio.path` points to an existing valid file.
- No audio file is zero-byte.
- Final images referenced in `content-meta.js` exist.
- `index.html` still loads `main.css`, `content-meta.js`, `i18n.js`, and `app.js`.
- Mini-map navigation still scrolls to the correct stops.
- Stop dropdown navigation still scrolls to the correct stops.
- Language switching preserves the current spot where appropriate.
- Gallery controls still work.
- No public page links to `staff-instructions.docx`.
