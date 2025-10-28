# DiscoApp v1.07a (Modular Split)

This version introduces a lightweight modular split that remains compatible with **iOS 12 Safari** (no ES modules, ES5 code). All logic is namespaced under `window.DiscoApp` and scripts are loaded in order.

## Files

- **index.html** – HTML shell; links CSS and loads JS in this order:
  1. `core.js`
  2. `list.js`
  3. `detail.js`
  4. `boot.js`
- **styles.css** – UI styles, including:
  - Hover overlay polish
  - Fade‑in animation for images
  - Subtle colour differential for meta text:
    - `Year Country` (softer)
    - `Master Year` (slightly stronger)
  - Tooltip support via `title` attributes
- **core.js** – Namespace, API helpers (with 429 backoff), caches, utilities, progress UI.
- **list.js** – Grid/List rendering, search, pagination, view toggle (persisted), fade‑in images.
- **detail.js** – Details page rendering, responsive art sizing, “More by Artist,” tooltips.
- **boot.js** – Startup: restore prefs, bind controls, fetch collection, initial render.

## Notes

- **Compatibility:** No build step required; works on desktop and older iOS Safari.
- **Persistence:** `localStorage` keys
  - `discoapp_per_page`
  - `discoapp_view`
  - `discoapp_country`
  - `discoapp_tracks`
  - `discoapp_master_year`
- **Sorting:** No changes in 1.07a (target for 1.08).

## Dev Tips

- Keep functions ES5-compatible (no arrow functions, `let/const`, or modules).
- Add new shared helpers to `core.js` under `window.DiscoApp`.
- Prefer small, focused modules to keep code review and ChatGPT sessions snappy.
