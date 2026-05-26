# Project Status

## Status

The guide is a production-candidate static QR/audio microsite with ten runtime-active languages.

## Active Runtime Scope

- Active languages: `en`, `el`, `de`, `fr`, `it`, `es`, `nl`, `pl`, `ru`, `tr`.
- Default language: `en`.
- Active language flags: inline SVG flags for English/UK, Greek, German, French, Italian, Spanish, Dutch, Polish, Russian, and Turkish.
- Active route model: one page, using query params such as `?lang=en&spot=welcome`.
- Active tour stops: the nine canonical stops in `assets/js/content-meta.js`.
- Active audio: MP3 files referenced from the active language manifests.
- Active Mini-maps: `assets/maps/<language>/minimap.jpg` for every active language.

## Known Asset Caveats

- Turkish is active and uses a documented default-map fallback until a Turkish-specific Mini-map source is provided.
- Final section-specific photo sets are still pending where no suitable source assets exist.

## Completed

- 9-stop QR guide structure.
- Sticky stop and language controls.
- Deep-link normalization for `lang` and `spot`.
- JSON-based content for all active languages.
- Inline SVG flag renderer for all active language codes.
- Per-stop audio controls with metadata preload.
- Mini-map card and modal.
- Gallery support with centralized image metadata.
- Sleeping-area gallery photo.
- Compatibility redirect at `qr-guide.html`.
- Lightweight content validator via `npm run validate`.

## Pending

- Turkish-specific Mini-map source file.
- Final section-specific photo sets where no matching source assets exist.
- Real-device mobile testing and deployment check.

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
