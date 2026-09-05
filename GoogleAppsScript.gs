const SHEET_NAME = 'Updates';
const HEADERS = ['Code','Group','Name','Location1','Location2','Location3','UpdatedLocation','NewValue','UpdatedDate','UpdatedTime','UpdatedBy'];

function getUpdateSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.getSheets()[0];
    sheet.setName(SHEET_NAME);
  }
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    sheet.setFrozenRows(1);
  } else {
    const current = sheet.getRange(1, 1, 1, HEADERS.length).getDisplayValues()[0];
    if (current.join('|') !== HEADERS.join('|')) {
      sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
      sheet.setFrozenRows(1);
    }
  }
  return sheet;
}

function doGet(e) {
  try {
    const sheet = getUpdateSheet_();
    const lastRow = sheet.getLastRow();
    if (lastRow <= 1) return json_([]);

    const values = sheet.getRange(2, 1, lastRow - 1, HEADERS.length).getDisplayValues();
    const rows = values.map(row => Object.fromEntries(HEADERS.map((h, i) => [h, row[i] || ''])));
    const mode = String((e && e.parameter && e.parameter.mode) || 'latest').toLowerCase();

    if (mode === 'history') return json_(rows);

    // Fast mode: return only the latest state for each Code + Name.
    const latest = new Map();
    rows.forEach(r => latest.set(String(r.Code).trim().toLowerCase() + '||' + String(r.Name).trim().toLowerCase(), r));
    return json_(Array.from(latest.values()));
  } catch (err) {
    return json_({success:false, error:String(err && err.message ? err.message : err)});
  }
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
    const sheet = getUpdateSheet_();
    const body = JSON.parse((e && e.postData && e.postData.contents) || '[]');
    const items = Array.isArray(body) ? body : [body];
    const rows = items.filter(Boolean).map(item => HEADERS.map(h => item[h] == null ? '' : String(item[h])));
    if (!rows.length) return json_({success:true, saved:0});

    const start = sheet.getLastRow() + 1;
    sheet.getRange(start, 1, rows.length, HEADERS.length).setValues(rows);
    SpreadsheetApp.flush();
    return json_({success:true, saved:rows.length});
  } catch (err) {
    return json_({success:false, error:String(err && err.message ? err.message : err)});
  } finally {
    try { lock.releaseLock(); } catch (_) {}
  }
}

function json_(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}
