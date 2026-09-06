# Raj Group Location — Google Sheet Old/New Value Version

This build keeps the existing fast static master data and the same Google Sheet backend URL.

## What changed
- `Location1 / Location2 / Location3` always show the latest/current value.
- `OldValue` records the value before the latest change.
- `NewValue` records the new value entered by the user.
- `Updates` keeps one latest/current row per Part Number + Name.
- `History` appends every change permanently with date/time.
- Date filter and exports continue to use the History data.
- Existing Google Sheet rows are preserved. On first run, the script inserts/renames the `OldValue` column without deleting existing data.

## Important behavior
The static master JSON files on GitHub are not physically rewritten. When the website opens, Google Sheet updates are overlaid on top of the master, so users see the latest Location1/2/3. `Export Full Master` also exports those latest overlaid values.

## Apps Script deployment
1. Open Google Sheet `RajGroupLocationUpdates`.
2. Extensions > Apps Script.
3. Replace all `Code.gs` content with `GoogleAppsScript.gs` from this ZIP.
4. Save.
5. Deploy > Manage deployments > Edit/Pencil > Version: New version > Deploy.
6. Execute as: Me; Who has access: Anyone.
7. Test the existing `/exec?action=ping` URL.

Spreadsheet ID is already configured in the script.

Responsive update:
- iPhone/iOS input and select controls use 16px computed font size to prevent Safari auto-zoom on focus.
- Portrait mobile keeps the compact table widths while enlarging the Update Location interaction area slightly.
- Landscape phone and tablet views no longer use a viewport-height table cap, so rows remain visible after rotation and the page can scroll normally.
- Google Sheet / Apps Script / OldValue + NewValue logic is unchanged.
