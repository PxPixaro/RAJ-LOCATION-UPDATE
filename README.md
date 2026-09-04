# Raj Group Location Master

Static GitHub Pages app for product location lookup and session-based location updates.

## Files to upload to GitHub repo root
- `index.html`
- `raj-group-logo.png`
- `data.js` — fast first-load data (products with existing Location1)
- `data-more-1.js` to `data-more-4.js` — remaining search/master rows loaded progressively
- `data-full.js` — complete original master, loaded only when an Excel export needs full columns

## Main workflow
1. Search by part number/name/location/group or choose Group + Sub Group.
2. Enter a new location. Use the yellow `/` button beside Location1 to insert `/` at the cursor without changing the mobile keyboard screen.
3. Continue searching; pending entries stay saved for the current browser session.
4. Click **Update All & Download** to download the session updates and overwrite Location1 in browser storage.
5. **Download Updated Master Only** exports only committed updated items with date/time history.
6. **Export Full Master** loads `data-full.js` only when needed and exports the entire original master with committed Location1 values applied.

## Performance
The page first loads the 17,033 products that already have an Actual Location1. The remaining products are loaded in four smaller background chunks. This makes the useful location data visible sooner while keeping universal search available after background loading completes.

## GitHub Pages
Upload all files to the repository root. In GitHub: **Settings → Pages → Deploy from a branch → main / root**.

No backend/database is required. Committed changes are stored in the current browser's localStorage, so keep exported Excel backups if the browser/device may change or its storage may be cleared.
