// Konfigurasi STAGING (uji ke backend Apps Script).
// Penanda pojok layar akan menampilkan STAGING.
//
// URL backend ikut di-commit untuk staging. Yang TIDAK boleh masuk repo:
// daftar token pemilih (token_*.csv sudah di-ignore di .gitignore).
// Untuk bilik suara live, pakai config.live.example.js (mode: 'live').
window.VOTING_CONFIG = {
  mode: 'demo',
  backendUrl: 'https://script.google.com/macros/s/AKfycbyiN5_URgUa4Cb1tfUx-_44PzX1j1NNcDDoxMIcN4Go7qouYP_syQXUF2Ak9V7xsMc/exec'
};
