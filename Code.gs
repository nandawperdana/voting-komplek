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
const STATUS_SHEET = 'Status'; // A1: header "Status", A2: "Berjalan" atau "Ditutup"
const CANDIDATES = ['1', '2', '3']; // 1=Jauin, 2=Tomo (3 tidak dipakai saat ini).
// Kalau kandidat ditambah/diganti, samakan ID-nya dengan entri
// CANDIDATES di index.html. Halaman kirim ID-nya; Hasil_Suara
// hanya menyimpan ID itu, jadi panitia harus tahu ID = siapa.

// Status voting, dibaca dari sheet "Status" (A2).
// Panitia menutup voting dengan mengubah A2 jadi "Ditutup" —
// setelah itu doPost menolak suara baru (voting_closed) dan
// ?action=results terbuka. Sheet lama tanpa tab Status dianggap
// "Berjalan" supaya tetap jalan.
function getStatus(ss) {
  const s = ss.getSheetByName(STATUS_SHEET);
  if (!s) return 'Berjalan';
  const v = String(s.getRange('A2').getValue() || '').trim();
  return v === 'Ditutup' ? 'Ditutup' : 'Berjalan';
}

// Ketentuan 2026-11-24: hasil sementara TIDAK boleh dilihat warga
// selama voting berjalan. Biarkan false selama voting; panitia boleh
// mengubah ke true (lalu deploy ulang) SETELAH voting ditutup, atau
// cukup membaca rekap langsung dari sheet Hasil_Suara.
const RESULTS_PUBLIC = false;

// Jalankan sekali dari editor Apps Script untuk menyiapkan header sheet.
function setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let t = ss.getSheetByName(TOKEN_SHEET);
  if (!t) t = ss.insertSheet(TOKEN_SHEET);
  if (t.getLastRow() === 0) t.appendRow(['Token', 'Rumah', 'Sudah_Memilih', 'Waktu_Memilih']);
  let r = ss.getSheetByName(RESULT_SHEET);
  if (!r) r = ss.insertSheet(RESULT_SHEET);
  if (r.getLastRow() === 0) r.appendRow(['Waktu', 'Pilihan']);
  let s = ss.getSheetByName(STATUS_SHEET);
  if (!s) s = ss.insertSheet(STATUS_SHEET);
  if (s.getLastRow() === 0) s.appendRow(['Status', 'Keterangan']);
  if (!String(s.getRange('A2').getValue() || '').trim()) {
    s.getRange('A2').setValue('Berjalan');
    s.getRange('B2').setValue('Ubah A2 jadi "Ditutup" untuk menutup voting.');
  }
}

// GET ?action=status -> {ok:true, status:"Berjalan"|"Ditutup"}
// GET ?action=check&token=STG-001 -> {ok:true, valid:true} kalau token
// ada dan belum dipakai; {ok:false, error:'invalid_token' |
// 'already_voted' | 'voting_closed'} kalau tidak. Dipakai halaman
// untuk menampilkan kandidat hanya setelah token terverifikasi.
// GET ?action=results -> hanya rekap jumlah, tanpa identitas pemilih.
// Dikunci selama voting berjalan (RESULTS_PUBLIC = false), dan
// otomatis terbuka begitu status di sheet "Status" jadi "Ditutup".
function checkToken(ss, token) {
  token = String(token || '').trim().toUpperCase();
  if (!token) return json({ ok: false, error: 'invalid_token' });
  if (getStatus(ss) === 'Ditutup') return json({ ok: false, error: 'voting_closed' });
  const t = ss.getSheetByName(TOKEN_SHEET);
  if (!t) return json({ ok: false, error: 'token_sheet_missing' });
  const rows = t.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0]).trim().toUpperCase() === token) {
      if (String(rows[i][2]).toUpperCase() === 'YA') {
        return json({ ok: false, error: 'already_voted' });
      }
      return json({ ok: true, valid: true });
    }
  }
  return json({ ok: false, error: 'invalid_token' });
}

function doGet(e) {
  const action = e && e.parameter ? e.parameter.action : '';
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (action === 'status') {
    return json({ ok: true, status: getStatus(ss) });
  }
  if (action === 'check') {
    return checkToken(ss, e.parameter.token);
  }
  if (action === 'results') {
    if (!RESULTS_PUBLIC && getStatus(ss) !== 'Ditutup') {
      return json({ ok: false, error: 'results_hidden_until_closed' });
    }
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
    if (getStatus(ss) === 'Ditutup') {
      return json({ ok: false, error: 'voting_closed' });
    }
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
