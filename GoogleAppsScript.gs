const SPREADSHEET_ID = "1wnKmJOY1wA517akd5WDQBr9yONvC2npZw3zaTmr8rPE";
const UPDATE_SHEET = "Updates";
const HISTORY_SHEET = "History";

const HEADERS = [
  "Code","Group","Name","Location1","Location2","Location3",
  "UpdatedLocation","OldValue","NewValue","UpdatedDate","UpdatedTime","UpdatedBy"
];

function doGet(e) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const action = String((e && e.parameter && e.parameter.action) || "updates").toLowerCase();

    const updates = getOrCreateSheet_(ss, UPDATE_SHEET);
    const history = getOrCreateSheet_(ss, HISTORY_SHEET);

    if (action === "ping") {
      return json_({
        success: true,
        message: "Raj Group Location backend connected",
        spreadsheetName: ss.getName(),
        spreadsheetId: SPREADSHEET_ID,
        updatesCount: Math.max(updates.getLastRow() - 1, 0),
        historyCount: Math.max(history.getLastRow() - 1, 0)
      });
    }

    if (action === "history") {
      let rows = rowsToObjects_(history);
      const date = String((e && e.parameter && e.parameter.date) || "").trim();
      if (date) rows = rows.filter(r => normalizeDate_(r.UpdatedDate) === date);
      return json_({success:true, type:"history", count:rows.length, data:rows});
    }

    const rows = rowsToObjects_(updates);
    return json_({success:true, type:"updates", count:rows.length, data:rows});
  } catch (err) {
    return json_({success:false, error:errorMessage_(err)});
  }
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);
    if (!e || !e.postData || !e.postData.contents) throw new Error("POST body is empty.");

    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const updates = getOrCreateSheet_(ss, UPDATE_SHEET);
    const history = getOrCreateSheet_(ss, HISTORY_SHEET);

    let body;
    try { body = JSON.parse(e.postData.contents); }
    catch (_) { throw new Error("Invalid JSON received."); }

    const items = Array.isArray(body) ? body : (Array.isArray(body.updates) ? body.updates : [body]);
    if (!items.length) throw new Error("No updates received.");

    const tz = ss.getSpreadsheetTimeZone() || "Asia/Kolkata";
    const now = new Date();
    const dateText = Utilities.formatDate(now, tz, "yyyy-MM-dd");
    const timeText = Utilities.formatDate(now, tz, "HH:mm:ss");

    // Fast lookup: Code + Name keeps duplicate part numbers safe.
    const existing = rowsToObjects_(updates);
    const rowByKey = new Map();
    existing.forEach((r, i) => rowByKey.set(key_(r.Code, r.Name), i + 2));

    const newCurrentRows = [];
    const historyRows = [];
    let saved = 0;
    let skipped = 0;

    items.forEach(item => {
      const code = clean_(item.Code !== undefined ? item.Code : item.code);
      if (!code) { skipped++; return; }
      const group = value_(item.Group !== undefined ? item.Group : item.group);
      const name = value_(item.Name !== undefined ? item.Name : item.name);
      const k = key_(code, name);
      const rowNo = rowByKey.get(k);

      let location1 = value_(item.Location1 !== undefined ? item.Location1 : item.location1);
      let location2 = value_(item.Location2 !== undefined ? item.Location2 : item.location2);
      let location3 = value_(item.Location3 !== undefined ? item.Location3 : item.location3);
      let target = clean_(item.UpdatedLocation !== undefined ? item.UpdatedLocation : (item.updatedLocation !== undefined ? item.updatedLocation : item.targetLocation));
      const newValue = value_(item.NewValue !== undefined ? item.NewValue : item.newValue);
      const updatedBy = value_(item.UpdatedBy !== undefined ? item.UpdatedBy : item.updatedBy) || "Raj Group Web";

      const t = target.toLowerCase().replace(/\s/g, "");
      if (t === "1" || t === "location1" || t === "loc1") target = "Location1";
      else if (t === "2" || t === "location2" || t === "loc2") target = "Location2";
      else if (t === "3" || t === "location3" || t === "loc3") target = "Location3";

      // OldValue comes from the website before it overwrites the displayed location.
      // If an older website version does not send it, derive it from the current Updates row.
      let oldValue = value_(item.OldValue !== undefined ? item.OldValue : item.oldValue);
      if ((oldValue === "" || oldValue == null) && rowNo && /^Location[123]$/.test(target)) {
        const oldRow = updates.getRange(rowNo, 1, 1, HEADERS.length).getDisplayValues()[0];
        oldValue = oldRow[HEADERS.indexOf(target)] || "";
      }

      // Current location columns always hold the NEW/latest values.
      if (target === "Location1") location1 = newValue;
      if (target === "Location2") location2 = newValue;
      if (target === "Location3") location3 = newValue;

      const row = [
        code, group, name, location1, location2, location3,
        target, oldValue, newValue, dateText, timeText, updatedBy
      ];

      // Updates = one current/latest row per Code + Name.
      if (rowNo) {
        updates.getRange(rowNo, 1, 1, HEADERS.length).setValues([row]);
      } else {
        newCurrentRows.push(row);
        rowByKey.set(k, updates.getLastRow() + newCurrentRows.length);
      }

      // History = every change forever, date/time wise.
      historyRows.push(row);
      saved++;
    });

    if (newCurrentRows.length) {
      updates.getRange(updates.getLastRow() + 1, 1, newCurrentRows.length, HEADERS.length).setValues(newCurrentRows);
    }
    if (historyRows.length) {
      history.getRange(history.getLastRow() + 1, 1, historyRows.length, HEADERS.length).setValues(historyRows);
    }

    SpreadsheetApp.flush();
    return json_({success:true, saved:saved, skipped:skipped, date:dateText, time:timeText});
  } catch (err) {
    return json_({success:false, saved:0, error:errorMessage_(err)});
  } finally {
    try { lock.releaseLock(); } catch (_) {}
  }
}

function getOrCreateSheet_(ss, name) {
  let sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name);
  migrateHeadersWithoutDeletingData_(sh);
  return sh;
}

function migrateHeadersWithoutDeletingData_(sh) {
  // Empty tab: create final headers.
  if (sh.getLastRow() === 0) {
    sh.getRange(1,1,1,HEADERS.length).setValues([HEADERS]);
    sh.setFrozenRows(1);
    return;
  }

  const lastCol = Math.max(sh.getLastColumn(), 1);
  let current = sh.getRange(1,1,1,lastCol).getDisplayValues()[0].map(clean_);

  // Older History versions used PreviousLocation; rename it, preserving every row.
  const prevIdx = current.indexOf("PreviousLocation");
  if (prevIdx >= 0 && current.indexOf("OldValue") < 0) {
    sh.getRange(1, prevIdx + 1).setValue("OldValue");
    current[prevIdx] = "OldValue";
  }

  // Current Updates sheet has NewValue directly after UpdatedLocation.
  // Insert OldValue before NewValue. Google Sheets shifts ALL existing data right,
  // so no existing row is blanked or deleted.
  if (current.indexOf("OldValue") < 0) {
    const newValueIdx = current.indexOf("NewValue");
    const insertBefore = newValueIdx >= 0 ? newValueIdx + 1 : 8; // 1-based column position
    sh.insertColumnBefore(insertBefore);
    sh.getRange(1, insertBefore).setValue("OldValue");
  }

  // Set final header names only; data rows are untouched.
  sh.getRange(1,1,1,HEADERS.length).setValues([HEADERS]);
  sh.setFrozenRows(1);
}

function rowsToObjects_(sh) {
  const last = sh.getLastRow();
  if (last <= 1) return [];
  const vals = sh.getRange(2,1,last-1,HEADERS.length).getDisplayValues();
  return vals.filter(r => r.some(v => clean_(v) !== "")).map(r => {
    const o = {};
    HEADERS.forEach((h,i) => o[h] = r[i] || "");
    return o;
  });
}

function key_(code, name) { return clean_(code).toLowerCase() + "||" + clean_(name).toLowerCase(); }
function clean_(v) { return v == null ? "" : String(v).trim(); }
function value_(v) { return v == null ? "" : v; }
function normalizeDate_(v) { const s = clean_(v); const m = s.match(/^(\d{4}-\d{2}-\d{2})/); return m ? m[1] : s; }
function errorMessage_(e) { return e && e.message ? String(e.message) : String(e || "Unknown error"); }
function json_(data) { return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON); }
