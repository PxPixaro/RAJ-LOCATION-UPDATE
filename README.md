# Raj Group Location — Google Sheet Backend

This build keeps the 58,893-row master data in compressed static files for fast GitHub Pages loading. Only changed locations are sent to Google Sheet, so the cloud payload stays small.

## Connected Apps Script URL
`https://script.google.com/macros/s/AKfycbyiuC9UupygFtGMTpdoL8SCzzgQPAd9Pn58gS3nnwcUNNfFVLmaj20rQqpwovQ_4MaYiQ/exec`

## One-time Apps Script update (recommended)
1. Open `RajGroupLocationUpdates` Google Sheet.
2. Extensions > Apps Script.
3. Replace Code.gs with the contents of `GoogleAppsScript.gs` from this ZIP.
4. Save.
5. Deploy > Manage deployments > Edit (pencil) > Version: New version > Deploy.
6. Keep **Execute as: Me** and **Who has access: Anyone**.
7. Keep the same Web App `/exec` URL.

The script automatically uses/renames the first tab to `Updates`, writes headers if needed, appends updates in one batch, and returns only the latest row per product for faster loading.

## GitHub Pages
Upload these files to the repository root. Do not upload the ZIP itself. `index.html` already contains the Apps Script URL.

## Data flow
- Master search/filter: local compressed JSON, no Google Sheet delay.
- Initial cloud sync: only latest updated products are fetched.
- Update All: one batched POST to Google Sheet, then verification GET.
- Background sync: at most about once per minute while the page is visible; returning to the tab can refresh sooner.
- Full history remains in the Google Sheet itself.
