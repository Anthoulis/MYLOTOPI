# Mini-map Asset Contract

Mini-map images are organized by language code and exposed through `assets/content/<language>/index.json`.

Active runtime map folders:

- `en`
- `el`
- `de`
- `fr`
- `it`
- `es`
- `nl`
- `pl`
- `ru`
- `tr`

Each language folder contains `minimap.jpg`.

Turkish is active and currently uses a default-map fallback because the source folder does not include a Turkish-specific Mini-map. Replace `assets/maps/tr/minimap.jpg` and remove the `fallback` metadata when a Turkish-specific source image is available.
