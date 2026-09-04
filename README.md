# Raj Group Location Master — GitHub Optimized

This version is optimized for GitHub Pages and mobile loading.

## Upload these 5 files to the repository root

- `index.html` — UI/app logic (small; future UI changes usually replace only this file)
- `raj-group-logo.png` — optimized Raj Group logo
- `data-location.json.gz` — products that already have Location1; loaded first
- `data-rest.json.gz` — remaining searchable products; loads in background
- `master-full.json.gz` — complete original master; loaded only when an export needs it

## Why this is faster

The old repo used several large JavaScript data files totaling about 21 MB uncompressed. This build stores repeated master data as compact array-based gzip files. GitHub upload/overwrite is much smaller, and normal UI changes do not require re-uploading the master data files.

## Future updates

- UI/filter/button/color changes: normally replace **only `index.html`**.
- Logo change: replace only `raj-group-logo.png`.
- Master Excel data change: regenerate and replace the three `.json.gz` data files.

## GitHub Pages

Keep all five files in the same repo folder (recommended: root), then enable GitHub Pages from the `main` branch / root folder.

## Notes

Committed location changes continue to be stored in the current browser's local storage. Export Full Master merges those changes into Location1 at export time.
