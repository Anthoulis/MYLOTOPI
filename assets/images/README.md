# Image Asset Structure

`assets/images/stops/` contains one folder per canonical tour stop.

Recommended final image filenames:

- `01-main.webp`
- `02-detail.webp`
- `03-extra.webp`

Existing tunnel images may remain in `assets/images/tunnel/` for now because they are referenced by `assets/js/content-meta.js`.

If tunnel images are moved later, update the `content-meta.js` image references safely at the same time.
