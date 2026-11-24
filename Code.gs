// ============================================================
// Backend Voting Ketua RW — Google Apps Script
// Cara pakai: lihat PANDUAN.md di folder yang sama.
// Prinsip privasi:
//  - Sheet "Daftar_Token": Token | Rumah | Sudah_Memilih | Waktu_Memilih
//    -> panitia BOLEH melihat siapa (rumah mana) yang sudah memilih.
//  - Sheet "Hasil_Suara": Waktu | Pilihan
//    -> TIDAK ada token / nama rumah di sini, jadi pilihan tiap rumah anonim.
//    -> Jangan pernah menggabungkan kedua sheet ini untuk menebak pilihan.
// ============================================================

const TOKEN_SHEET = 'Daftar_Token';
const RESULT_SHEET = 'Hasil_Suara';
const CANDIDATES = ['1', '2', '3']; // 1=Budi Santoso (Dummy), 2=Siti Rahma (Dummy), 3=Ahmad Fauzi (Dummy)

// Jalankan sekali dari editor Apps Script untuk menyiapkan header sheet.
function setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let t = ss.getSheetByName(TOKEN_SHEET);
  if (!t) t = ss.insertSheet(TOKEN_SHEET);
  if (t.getLastRow() === 0) t.appendRow(['Token', 'Rumah', 'Sudah_Memilih', 'Waktu_Memilih']);
  let r = ss.getSheetByName(RESULT_SHEET);
  if (!r) r = ss.insertSheet(RESULT_SHEET);
  if (r.getLastRow() === 0) r.appendRow(['Waktu', 'Pilihan']);
}

// GET ?action=results -> hanya rekap jumlah, tanpa identitas pemilih.
function doGet(e) {
  const action = e && e.parameter ? e.parameter.action : '';
  if (action === 'results') {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const r = ss.getSheetByName(RESULT_SHEET);
    const tally = { '1': 0, '2': 0, '3': 0 };
    if (r && r.getLastRow() > 1) {
      const vals = r.getRange(2, 2, r.getLastRow() - 1, 1).getValues();
      vals.forEach(function (row) {
        const c = String(row[0]);
        if (tally.hasOwnProperty(c)) tally[c]++;
      });
    }
    const t = ss.getSheetByName(TOKEN_SHEET);
    let voted = 0, total = 0;
    if (t && t.getLastRow() > 1) {
      const vals = t.getRange(2, 3, t.getLastRow() - 1, 1).getValues();
      total = vals.length;
      vals.forEach(function (row) { if (String(row[0]).toUpperCase() === 'YA') voted++; });
    }
    return json({ ok: true, tally: tally, voted: voted, total: total });
  }
  return json({ ok: true, message: 'Backend voting RW aktif.' });
}

// POST {token, choice} -> cek token, cegah suara ganda, catat anonim.
function doPost(e) {
  const lock = LockService.getScriptLock();
  try { lock.waitLock(10000); } catch (err) { return json({ ok: false, error: 'busy' }); }
  try {
    const data = JSON.parse(e.postData.contents);
    const token = String(data.token || '').trim().toUpperCase();
    const choice = String(data.choice || '').trim();
    if (!token || CANDIDATES.indexOf(choice) === -1) {
      return json({ ok: false, error: 'invalid_input' });
    }
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const t = ss.getSheetByName(TOKEN_SHEET);
    if (!t) return json({ ok: false, error: 'token_sheet_missing' });

    const rows = t.getDataRange().getValues();
    let rowIndex = -1;
    for (let i = 1; i < rows.length; i++) {
      if (String(rows[i][0]).trim().toUpperCase() === token) { rowIndex = i + 1; break; }
    }
    if (rowIndex === -1) return json({ ok: false, error: 'invalid_token' });
    if (String(rows[rowIndex - 1][2]).toUpperCase() === 'YA') {
      return json({ ok: false, error: 'already_voted' });
    }

    const now = new Date();
    t.getRange(rowIndex, 3).setValue('YA');
    t.getRange(rowIndex, 4).setValue(now);

    const r = ss.getSheetByName(RESULT_SHEET);
    if (!r) return json({ ok: false, error: 'result_sheet_missing' });
    // Sengaja TANPA token / rumah, supaya pilihan anonim.
    r.appendRow([now, choice]);

    return json({ ok: true });
  } catch (err) {
    return json({ ok: false, error: 'server_error' });
  } finally {
    lock.releaseLock();
  }
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
