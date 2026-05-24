# Image Asset Structure

`assets/images/stops/` contains one folder per canonical tour stop.

Recommended final image filenames:

- `01-main.webp`
- `02-detail.webp`
- `03-extra.webp`

The runtime does not scan folders automatically. Every displayed image must be referenced from `assets/js/content-meta.js`.

If a stop has no suitable image, leave its `images` array empty so the app renders the intentional placeholder. Do not use unrelated photos just to fill a gallery.

When adding a tall or narrow image, consider `fit: "contain"` or a precise `position` value in `content-meta.js` so important details are not cropped on mobile.
