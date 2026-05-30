# Mini-map Asset Contract

Mini-map images are stored directly in this folder and referenced from `assets/content/<language>.json`.

Active runtime files:

- `minimap-en.jpg`
- `minimap-el.jpg`
- `minimap-de.jpg`
- `minimap-fr.jpg`
- `minimap-it.jpg`
- `minimap-es.jpg`
- `minimap-nl.jpg`
- `minimap-pl.jpg`
- `minimap-ru.jpg`
- `minimap-tr.jpg`

Use `el` for Greek, and keep the spelling `minimap`.

Turkish is active and currently uses a default-map fallback because the source folder does not include a Turkish-specific Mini-map. Replace `assets/maps/minimap-tr.jpg` and remove the `fallback` metadata when a Turkish-specific source image is available.
