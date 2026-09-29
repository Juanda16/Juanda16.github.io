# Juanda16.github.io

Personal portfolio of Juan Arismendy, in English and Spanish.
Plain HTML + CSS + JavaScript: no build step, no frameworks, no trackers.

Live: https://juanda16.github.io

## Run locally

```sh
python3 -m http.server 8000
# open http://localhost:8000  (or http://localhost:8000/?lang=es)
```

It must be served over HTTP (not `file://`) because the page loads JSON files with `fetch`.

## Edit the content

| What | Where |
|---|---|
| All texts (both languages) | `i18n/en.json`, `i18n/es.json` (keep the same keys in both) |
| Page title / meta description per language | `meta.*` in the same files |
| Projects (order, tags, repo links) | `data/projects.json` (texts live in `projects.items.<id>` in i18n) |
| Skills | `data/skills.json` (group names in `skills.groups.<id>`) |
| Publications / certifications | `data/publications.json` |
| Page structure, contact links | `index.html` |
| Profile photo | `assets/avatar.jpg` (square, 480×480); alt text in `hero.photoAlt` |
| Colors, layout | `css/style.css` (CSS variables at the top) |

To add a project: add an entry to `data/projects.json` and a matching `projects.items.<id>` block (`kind`, `title`, `desc`) in both i18n files.

After changing any file, bump the version: `?v=` on the CSS/JS links in `index.html` and `VERSION` in `js/app.js`. GitHub Pages caches files for 10 minutes and this forces browsers to fetch the new ones.

## Language and theme

- Initial language: `?lang=en|es` in the URL, else the saved choice (`localStorage`), else `navigator.language`.
- The EN | ES toggle in the header saves the choice and updates `<html lang>`, the title and the meta tags.
- Theme follows `prefers-color-scheme`; the header button overrides it and is saved.

## Publish

GitHub Pages: Settings → Pages → Deploy from a branch → `main` / `/ (root)`.
`.nojekyll` makes Pages serve the files as-is.

Do not add a `CNAME` file until the custom domain is active.
