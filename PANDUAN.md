# Panduan Voting Ketua RW — Bilik Suara (On-site)

Spek yang sudah disepakati (update 2026-11-24): kurleb 200 pemilih,
satu suara per rumah, panitia boleh tahu siapa yang sudah memilih
(tapi bukan pilihannya), 3 kandidat dummy untuk sekarang.

Perubahan dari rencana awal (remote lewat link WA):
- **Voting dilakukan di bilik suara.** Pemilih / perwakilan rumah
  datang di hari dan jam yang ditentukan, lalu voting langsung di
  perangkat yang disediakan panitia — bukan dari HP masing-masing
  lewat link WA.
- **Token dibagikan lewat undangan tertulis di kertas**, satu
  undangan per rumah, bukan lewat WA.
- **Hasil sementara tidak boleh dilihat warga** selama voting
  berjalan. Hasil baru dibuka setelah voting ditutup.

Kenapa pakai cara ini: web app di Muse tidak bisa dibagikan lewat link
publik, jadi untuk voting dipakai Google Sheet + Apps Script (gratis)
sebagai backend. Panitia membuka satu halaman voting di perangkat
bilik suara, pemilih masukkan token rumahnya, pilih, selesai.
Panitia memantau dari Sheet.

## File di folder ini

- `index.html` — halaman voting (mobile-friendly, dibuka di perangkat bilik suara)
- `Code.gs` — backend Apps Script
- `token_rumah_200.csv` — 200 token, satu per rumah (Rumah 001–200)
  — **DRAFT, daftar rumah masih BELUM FINAL (2026-11-24).**
  Jangan cetak undangan dari file ini sebelum daftar rumah final.
  Setelah final, sesuaikan jumlah / nama rumahnya dan buat ulang
  token untuk rumah yang berubah.

## Langkah setup (sekitar 10–15 menit)

1. **Buat Google Sheet baru**, beri nama misal "Voting Ketua RW".
2. **Buka Extensions → Apps Script**, hapus isi Code.gs bawaan,
   paste seluruh isi file `Code.gs` dari folder ini, lalu Save.
3. Di editor Apps Script, jalankan fungsi `setup()` sekali
   (klik Run, izinkan akses). Ini membuat sheet `Daftar_Token`
   dan `Hasil_Suara` dengan header yang benar.
4. **Isi token — hanya setelah daftar rumah final:** buka file
   `token_rumah_200.csv`, copy kolom Token + Rumah, paste ke sheet
   `Daftar_Token` di bawah header. Pastikan kolom `Sudah_Memilih`
   masih `BELUM` untuk semua baris.
   > Penting: file token ini adalah daftar pemilih. Jangan dibagikan
   > utuh ke warga — bagikan satu token ke masing-masing rumah saja,
   > lewat undangan tertulis (kertas).
5. **Deploy backend:** di Apps Script klik Deploy → New deployment →
   pilih Web app → Execute as: Me → Who has access: Anyone →
   Deploy. Copy URL Web App-nya (diawali
   `https://script.google.com/macros/s/.../exec`).
6. **Hubungkan halaman voting:** buka `index.html`, cari baris
   `const BACKEND_URL = "";` di bagian atas script, isi dengan URL
   dari langkah 5, lalu simpan.
7. **Siapkan perangkat bilik suara:** buka `index.html` di perangkat
   panitia (laptop / tablet di bilik suara). Untuk staging / testing
   ke panitia, pakai versi staging di URL publik — lihat bagian
   "Versi staging" di bawah. Halaman ini TIDAK menampilkan hasil
   sementara, jadi aman dibuka di depan pemilih.
8. **Uji dulu dengan 2–3 token dummy** sebelum hari voting:
   voting sekali (harus sukses), voting lagi dengan token yang
   sama (harus ditolak "sudah dipakai"), dan voting dengan token
   salah (harus ditolak "tidak ditemukan"). Setelah tiap uji,
   tekan tombol "Pemilih Berikutnya — Bersihkan Layar".

## Versi staging

- Versi staging = halaman yang sama (`index.html`) dalam mode demo
  (`BACKEND_URL` kosong), di-host di URL publik untuk testing
  panitia. Suara di staging hanya tersimpan di perangkat yang
  dipakai testing, tidak masuk ke Sheet.
- Jangan pakai URL staging untuk voting asli — voting asli harus
  pakai halaman dengan `BACKEND_URL` terisi (langkah 6) di perangkat
  bilik suara.

## Ganti kandidat dummy

- Di `index.html`: ganti nama + visi Kandidat 1–3, dan label di
  `CANDIDATES`.
- Di `Code.gs`: ID kandidat tetap `1`, `2`, `3` — tidak perlu diubah
  kalau jumlah kandidat tetap 3. Kalau kandidat jadi bukan 3 orang,
  ubah juga array `CANDIDATES` di `Code.gs` dan kartu kandidat di
  `index.html`.

## Di hari voting (bilik suara)

1. Pemilih datang membawa undangan tertulis (kertas) berisi token
   rumahnya.
2. Panitia / pemilih memasukkan token di perangkat bilik suara,
   memilih kandidat, tekan "Kirim Suara".
3. **Setelah tiap pemilih selesai, tekan "Pemilih Berikutnya —
   Bersihkan Layar"** supaya token dan pilihan pemilih sebelumnya
   tidak terlihat pemilih berikutnya. Ini penting karena perangkatnya
   dipakai bergantian.
4. Jangan membuka hasil sementara selama voting berjalan — halaman
   voting memang tidak menampilkannya, dan endpoint hasil di backend
   dikunci (`RESULTS_PUBLIC = false` di `Code.gs`).

## Cara panitia memantau

- **Sudah memilih siapa saja:** lihat sheet `Daftar_Token`,
  kolom `Sudah_Memilih` berubah jadi `YA` beserta waktunya.
- **Hasil suara:** HANYA dari sheet `Hasil_Suara` di Google Sheet,
  dan baru dibuka / diumumkan setelah voting ditutup. Sheet ini
  sengaja tidak berisi token/nama rumah, jadi pilihan tiap rumah
  tetap anonim. Endpoint `?action=results` di backend sengaja
  dikunci selama voting (`RESULTS_PUBLIC = false`); kalau mau
  membukanya setelah ditutup, ubah ke `true` di `Code.gs` lalu
  deploy ulang — atau cukup baca langsung dari sheet.
- **Menutup voting:** setelah waktu voting habis, buka Sheet lalu
  di tab `Status` ubah sel A2 dari `Berjalan` jadi `Ditutup`.
  Itu saja — halaman voting otomatis menampilkan "Voting sudah
  ditutup" dan tidak bisa lagi menerima suara (backend menolak
  kirim suara baru dengan `voting_closed`), dan endpoint
  `?action=results` otomatis terbuka. Rekap final diambil dari
  sheet `Hasil_Suara`. Kalau mau menghentikan backend sepenuhnya,
  di Apps Script Deploy → Manage deployments → hapus/nonaktifkan
  deployment-nya. Untuk membuka lagi (misal salah tutup), ubah A2
  kembali jadi `Berjalan` dan refresh halaman voting.

## Hal yang harus disepakati panitia sebelum voting asli

- Daftar rumah yang berhak — **masih belum final (2026-11-24)**.
  Finalkan dulu, baru cetak undangan dan isi token.
- Jadwal buka/tutup voting (hari + jam) dan lokasi bilik suara,
  serta cara mengumumkan hasil setelah ditutup.
- Tata cara pemilihan RW yang berlaku di kelurahan setempat —
  sistem ini membantu pemungutan suara, bukan menggantikan
  aturan / pengesahan panitia dan kelurahan.
