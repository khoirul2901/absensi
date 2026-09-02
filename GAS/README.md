# Google Apps Script Backend (GAS) - SIAS

Folder ini berisi kode backend Google Apps Script (`Kode.gs`) yang dapat Anda gunakan jika ingin menghubungkan aplikasi **Sistem Informasi Presensi & Jadwal Sekolah (SIAS)** secara langsung ke database **Google Sheets**.

---

## 📁 Isi File
- **`Kode.gs`**: Kode Apps Script lengkap yang mengelola sheet `JamPelajaran`, `JadwalPelajaran`, `AbsensiMengajar`, `Kelas`, `HariLibur`, `Pengaturan`, `Presensi`, `Siswa`, dan `Guru`.

---

## 🚀 Langkah-langkah Pasang Backend Google Apps Script:

1. **Buka Google Spreadsheet** tempat Anda menyimpan data sekolah.
2. Klik menu **Ekstensi** -> **Apps Script** di bagian atas menu Spreadsheet.
3. Hapus semua kode bawaan `Code.gs`, lalu **salin seluruh isi dari file `/GAS/Kode.gs`** ke editor Apps Script.
4. Klik tombol **Simpan** (Ikon Disket) atau tekan `Ctrl + S`.
5. Klik **Terapkan** (Deploy) di kanan atas -> **Penerapan Baru** (New deployment).
6. Pada jenis penerapan, klik ikon roda gigi dan pilih **Aplikasi Web** (Web App).
7. Konfigurasikan:
   - **Deskripsi**: SIAS Backend
   - **Jalankan sebagai**: *Saya* (Me - akun Google Anda)
   - **Yang memiliki akses**: *Siapa Saja* (Anyone / Anyone even anonymous)
8. Klik **Terapkan**, lalu klik **Beri Izin** (Grant Access) jika Google meminta konfirmasi keamanan.
9. **Salin URL Aplikasi Web** yang dihasilkan (dimulai dengan `https://script.google.com/macros/s/.../exec`).
10. Buka aplikasi **SIAS** -> masuk ke menu **Pengaturan / System** -> tempelkan URL tersebut ke kolom **URL Web App Google Apps Script**, lalu klik **Simpan Pengaturan Sync**.

---

## ✨ Fitur Otomatis Kode.gs Ini:
- **Auto-Create Sheet & Header**: Begitu Web App dipanggil, `initSheets()` akan otomatis membuat tab `JamPelajaran`, `JadwalPelajaran`, `AbsensiMengajar`, `Kelas`, `HariLibur`, `Pengaturan`, `Presensi`, `Siswa`, dan `Guru` beserta judul kolomnya di Google Sheets jika belum ada.
- **Dukungan Penuh Slot Jam Pelajaran & Jadwal**: Mendukung aksi `getJamPelajaran`, `simpanJamPelajaran`, `hapusJamPelajaran`, `getJadwalPelajaranSemua`, `tambahJadwalPelajaran`, `simpanAbsensiMengajarGuru`, dan lainnya.
- **Fallback Keamanan**: Jika terdapat koneksi internet yang lambat atau URL belum dikonfigurasi, aplikasi SIAS akan otomatis menggunakan penyimpanan lokal tanpa merusak alur kerja user.
