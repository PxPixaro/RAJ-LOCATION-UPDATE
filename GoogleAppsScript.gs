const UPDATE_SHEET = 'Updates';
const HISTORY_SHEET = 'History';
const HEADERS = ['Code','Group','Name','Location1','Location2','Location3','UpdatedLocation','NewValue','UpdatedDate','UpdatedTime','UpdatedBy'];
const HISTORY_HEADERS = ['Code','Group','Name','Location1','Location2','Location3','UpdatedLocation','PreviousLocation','NewValue','UpdatedDate','UpdatedTime','UpdatedBy'];

function ensureSheet_(name, headers) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name);
  if (sh.getLastRow() === 0) {
    sh.getRange(1,1,1,headers.length).setValues([headers]);
    sh.setFrozenRows(1);
  } else {
    const cur = sh.getRange(1,1,1,headers.length).getDisplayValues()[0];
    if (cur.join('|') !== headers.join('|')) {
      sh.getRange(1,1,1,headers.length).setValues([headers]);
      sh.setFrozenRows(1);
    }
  }
  return sh;
}

function json_(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}

function rowsToObjects_(sh, headers) {
  const last = sh.getLastRow();
  if (last <= 1) return [];
  const vals = sh.getRange(2,1,last-1,headers.length).getDisplayValues();
  return vals.map(r => Object.fromEntries(headers.map((h,i)=>[h,r[i] || ''])));
}

function doGet(e) {
  try {
    const mode = String((e && e.parameter && e.parameter.mode) || 'latest').toLowerCase();
    if (mode === 'history') {
      const sh = ensureSheet_(HISTORY_SHEET, HISTORY_HEADERS);
      let rows = rowsToObjects_(sh, HISTORY_HEADERS);
      const date = String((e && e.parameter && e.parameter.date) || '').trim();
      if (date) rows = rows.filter(r => String(r.UpdatedDate).trim() === date);
      return json_(rows);
    }
    const sh = ensureSheet_(UPDATE_SHEET, HEADERS);
    return json_(rowsToObjects_(sh, HEADERS));
  } catch (err) {
    return json_({success:false,error:String(err && err.message ? err.message : err)});
  }
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
    const updates = ensureSheet_(UPDATE_SHEET, HEADERS);
    const hist = ensureSheet_(HISTORY_SHEET, HISTORY_HEADERS);
    const body = JSON.parse((e && e.postData && e.postData.contents) || '[]');
    const items = (Array.isArray(body) ? body : [body]).filter(Boolean);
    if (!items.length) return json_({success:true,saved:0});

    // Build a fast lookup of current rows. Same Part Number + Name = one permanent current row.
    const existing = rowsToObjects_(updates, HEADERS);
    const rowByKey = new Map();
    existing.forEach((r,i)=>rowByKey.set(String(r.Code).trim().toLowerCase()+'||'+String(r.Name).trim().toLowerCase(), i+2));

    const historyRows = [];
    items.forEach(item => {
      const key = String(item.Code||'').trim().toLowerCase()+'||'+String(item.Name||'').trim().toLowerCase();
      const rowNo = rowByKey.get(key);
      let previous = '';
      if (rowNo) {
        const old = updates.getRange(rowNo,1,1,HEADERS.length).getDisplayValues()[0];
        const target = String(item.UpdatedLocation||'');
        const idx = HEADERS.indexOf(target);
        if (idx >= 0) previous = old[idx] || '';
        updates.getRange(rowNo,1,1,HEADERS.length).setValues([HEADERS.map(h => item[h] == null ? '' : String(item[h]))]);
      } else {
        const row = HEADERS.map(h => item[h] == null ? '' : String(item[h]));
        updates.appendRow(row);
        rowByKey.set(key, updates.getLastRow());
      }
      historyRows.push(HISTORY_HEADERS.map(h => h === 'PreviousLocation' ? previous : (item[h] == null ? '' : String(item[h]))));
    });

    if (historyRows.length) {
      hist.getRange(hist.getLastRow()+1,1,historyRows.length,HISTORY_HEADERS.length).setValues(historyRows);
    }
    SpreadsheetApp.flush();
    return json_({success:true,saved:items.length});
  } catch (err) {
    return json_({success:false,error:String(err && err.message ? err.message : err)});
  } finally {
    try { lock.releaseLock(); } catch (_) {}
  }
}
