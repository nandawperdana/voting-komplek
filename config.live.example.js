// Konfigurasi LIVE untuk bilik suara.
// Cara pakai: salin file ini sebagai config.js di folder bilik/
// (folder yang sama dengan salinan index.html untuk bilik), lalu isi
// backendUrl dengan URL Web App Google Apps Script yang asli.
// Folder bilik/ TIDAK boleh di-commit ke repo publik.
//
// Kalau backendUrl dibiarkan kosong, halaman menampilkan "Halaman belum
// dikonfigurasi" dan form pemilihan diblokir (bukan jatuh ke mode demo).
window.VOTING_CONFIG = {
  mode: 'live',
  backendUrl: ''
};
