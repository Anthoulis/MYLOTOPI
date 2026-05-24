# Project Status

## Status

The guide is a production-candidate static QR/audio microsite with three runtime-active languages.

## Active Runtime Scope

- Active languages: `en`, `el`, `de`.
- Active route model: one page, using query params such as `?lang=en&spot=welcome`.
- Active tour stops: the nine canonical stops in `assets/js/content-meta.js`.
- Active audio: MP3 files referenced from the active language manifests.
- Active Mini-maps: `assets/maps/en/minimap.jpg`, `assets/maps/el/minimap.jpg`, and `assets/maps/de/minimap.jpg`.

## Staged Assets

The repository includes staged content, audio, and Mini-map folders for `fr`, `it`, `es`, `nl`, `pl`, `ru`, and `tr`. These are intentionally not listed in `MYLOTOPI_GUIDE_META.languages` yet.

Reasons they remain staged:

- Their core section content exists, but their UI chrome is not localized to the same standard as `en`, `el`, and `de`.
- The young-visitors challenge layer exists only for `en`, `el`, and `de`.
- Turkish uses a default-map fallback until a Turkish-specific Mini-map source is provided.

## Completed

- 9-stop QR guide structure.
- Sticky stop and language controls.
- Deep-link normalization for `lang` and `spot`.
- JSON-based active language content.
- Per-stop audio controls with metadata preload.
- Mini-map card and modal.
- Gallery support with centralized image metadata.
- Compatibility redirect at `qr-guide.html`.
- Lightweight content validator via `npm run validate`.

## Pending

- Final decision and review pass before activating `fr`, `it`, `es`, `nl`, `pl`, `ru`, and `tr`.
- Turkish-specific Mini-map source file.
- Final section-specific photo sets where no matching source assets exist.
- Real-device mobile testing and deployment check.

## Pre-deploy Checklist

1. Run a local static server.
2. Run `npm run validate`.
3. Test mobile widths `320`, `360`, `390`, and `430`.
4. Test language switching.
5. Test every audio file for active languages.
6. Test every gallery.
7. Test the Mini-map modal.
8. Test URL params `?lang=en&spot=welcome`.
9. Test invalid params fallback.
10. Check the browser console for errors.
