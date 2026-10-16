# Project guide

This is a small static portfolio site built with HTML, CSS, and vanilla JavaScript. There is no package manager, build step, or test suite in the repository.

## Where things live

- `index.html` is the home page. Its main sections are Projects, Experience, Skills, and Contact. It also contains the hero animation and project card tilt scripts inline.
- `projects/*.html` are standalone project writeups. They share the site navigation and stylesheet, and load the chapter navigation and preview lightbox scripts.
- `style.css` contains shared site styles and project writeup styles. Section comments such as `PROJECT GRID`, `TIMELINE`, `SKILLS`, and `Header` are useful landmarks.
- `js/theme.js` applies and toggles the saved color theme.
- `js/language-toggle.js` builds the EN/NL switcher and translates elements marked with `data-i18n`.
- `js/chapters.js` creates and updates the chapter navigation on project pages, including its visibility near the top of a writeup.
- `js/preview-lightbox.js` makes project screenshots with a real image source clickable and opens them in a dialog.
- `js/text-reveal.js` handles scroll-triggered text reveals.
- `js/timeline.js` animates the experience timeline.
- `site.webmanifest` contains the web app metadata. Fonts are in `fonts/`; project screenshots may be remote image URLs in the writeup HTML.

## Editing notes

- Keep project page asset paths relative to `projects/` (for example, `../style.css` and `../js/theme.js`). Home page paths are relative to the repository root.
- The language switcher sets `textContent` on each `[data-i18n]` element. Put that attribute on a text-only child (such as a `<span>`) when the parent also contains an icon or other markup, so translation does not remove it.
- Project screenshots use `.pp-visual-placeholder`. An image preview is enabled only when its `<img>` has a non-empty `src`; an empty image is just a placeholder.
- Shared navigation and theme behavior should stay consistent across `index.html` and every project writeup.
- Respect `prefers-reduced-motion` when changing animations; the site already has reduced-motion handling in CSS and JavaScript.

## Verification

There is no configured build or automated test command. For routine edits, inspect the affected pages and run `git diff --check` to catch whitespace errors. Do not add dependencies just to preview this static site.
