# Panduan Voting Ketua RW — Remote lewat Link WA

Spek yang sudah disepakati: kurleb 200 pemilih, satu suara per rumah,
panitia boleh tahu siapa yang sudah memilih (tapi bukan pilihannya),
3 kandidat dummy untuk sekarang.

Kenapa pakai cara ini: web app di Muse tidak bisa dibagikan lewat link
publik, jadi untuk voting remote via WA dipakai Google Sheet + Apps
Script (gratis). Warga buka satu link, masukkan token rumah, pilih,
selesai. Panitia memantau dari Sheet.

## File di folder ini

- `index.html` — halaman voting warga (mobile-friendly, buat dibuka dari WA)
- `Code.gs` — backend Apps Script
- `token_rumah_200.csv` — 200 token, satu per rumah (Rumah 001–200)

## Langkah setup (sekitar 10–15 menit)

1. **Buat Google Sheet baru**, beri nama misal "Voting Ketua RW".
2. **Buka Extensions → Apps Script**, hapus isi Code.gs bawaan,
   paste seluruh isi file `Code.gs` dari folder ini, lalu Save.
3. Di editor Apps Script, jalankan fungsi `setup()` sekali
   (klik Run, izinkan akses). Ini membuat sheet `Daftar_Token`
   dan `Hasil_Suara` dengan header yang benar.
4. **Isi token:** buka file `token_rumah_200.csv`, copy kolom
   Token + Rumah, paste ke sheet `Daftar_Token` di bawah header.
   Pastikan kolom `Sudah_Memilih` masih `BELUM` untuk semua baris.
   > Penting: file token ini adalah daftar pemilih. Jangan dibagikan
   > utuh ke warga — bagikan satu token ke masing-masing rumah saja.
5. **Deploy backend:** di Apps Script klik Deploy → New deployment →
   pilih Web app → Execute as: Me → Who has access: Anyone →
   Deploy. Copy URL Web App-nya (diawali
   `https://script.google.com/macros/s/.../exec`).
6. **Hubungkan halaman voting:** buka `index.html`, cari baris
   `const BACKEND_URL = "";` di bagian atas script, isi dengan URL
   dari langkah 5, lalu simpan.
7. **Hosting halaman:** upload `index.html` ke hosting gratis,
   misal Netlify Drop (drag-and-drop file, langsung dapat link)
   atau GitHub Pages. Link hasil hosting inilah yang dibagikan
   lewat WA ke warga.
8. **Uji dulu dengan 2–3 token dummy** sebelum dibagikan massal:
   voting sekali (harus sukses), voting lagi dengan token yang
   sama (harus ditolak "sudah dipakai"), dan voting dengan token
   salah (harus ditolak "tidak ditemukan").

## Ganti kandidat dummy

- Di `index.html`: ganti nama + visi Kandidat 1–3, dan label di
  `CANDIDATES`.
- Di `Code.gs`: ID kandidat tetap `1`, `2`, `3` — tidak perlu diubah
  kalau jumlah kandidat tetap 3. Kalau kandidat jadi bukan 3 orang,
  ubah juga array `CANDIDATES` di `Code.gs` dan kartu kandidat di
  `index.html`.

## Cara panitia memantau

- **Sudah memilih siapa saja:** lihat sheet `Daftar_Token`,
  kolom `Sudah_Memilih` berubah jadi `YA` beserta waktunya.
- **Hasil suara:** lihat sheet `Hasil_Suara` atau tombol
  "Perbarui Hasil" di halaman voting. Sheet ini sengaja tidak
  berisi token/nama rumah, jadi pilihan tiap rumah tetap anonim.
- **Menutup voting:** setelah waktu voting habis, jangan lagi
  membagikan link. Rekap final diambil dari sheet `Hasil_Suara`.
  Kalau mau menghentikan backend sepenuhnya, di Apps Script
  Deploy → Manage deployments → hapus/nonaktifkan deployment-nya.

## Hal yang harus disepakati panitia sebelum voting asli

- Daftar rumah yang berhak (200 token ini) sudah final.
- Jadwal buka/tutup voting dan cara mengumumkan hasil.
- Apakah hasil sementara boleh dilihat warga selama voting
  berjalan, atau baru dibuka setelah ditutup.
- Tata cara pemilihan RW yang berlaku di kelurahan setempat —
  sistem ini membantu pemungutan suara, bukan menggantikan
  aturan / pengesahan panitia dan kelurahan.
