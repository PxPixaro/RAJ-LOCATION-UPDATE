# Raj Group Location — Google Sheet Date History Fast Version

This version keeps the 58,893-row master locally in compressed files for speed and uses Google Sheet only for changed products.

## Google Sheet design
- `Updates` = one current/latest row per Part Number + Name. A later update overwrites this row, so this tab stays small and fast.
- `History` = every location change is appended permanently with date and time.
- The website date filter requests only one selected date from `History`, so old history does not slow normal loading.

## One-time Apps Script upgrade
1. Open `RajGroupLocationUpdates` Google Sheet.
2. Extensions > Apps Script.
3. Replace all existing Code.gs code with `GoogleAppsScript.gs` from this ZIP.
4. Save.
5. Deploy > Manage deployments > Edit (pencil) > New version > Deploy.
6. Keep **Execute as: Me** and **Who has access: Anyone**.
7. Keep the same `/exec` URL. No URL change is needed.

The script automatically creates a `History` tab. Existing `Updates` data stays available. Future updates overwrite the same product in `Updates` and append a new row in `History`.

## Website date filter
- Date box defaults to today.
- `Show Date Updates` displays only products changed on that date.
- `All Dates` returns to the full master.
- `Download Date` downloads only the selected day's history to Excel.

## GitHub Pages
Upload all website files from this ZIP to the repository root and replace the old files. Do not upload the ZIP itself.
