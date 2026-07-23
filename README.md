# Evaluasi Mingguan — Pondok Pesantren Jalaluddin Ar-Rumi Jatisari

Aplikasi web untuk laporan program kerja **harian** dan **mingguan** seluruh divisi pondok,
mengikuti format Form Laporan Program Kerja Divisi (kolom Prosentase A/Kuantitatif dan
B/Kualitatif, Keterangan, Kendala, Solusi/Langkah Konkrit, serta Nama Santri yang Tidak
Mengikuti Kegiatan).

## Alamat Aplikasi (Online)

**https://evaluasi-ja.vercel.app** (utama, Vercel — akun `agfahimam-1153`)

Cadangan: https://faiqhimam95.github.io/evaluasi-ja/ (GitHub Pages)

Kode ada di repo GitHub `faiqhimam95/evaluasi-ja`; push ke branch `main` otomatis
ter-deploy ke keduanya. Seluruh data tersimpan terpusat di **Supabase** — semua
koordinator dapat mengisi dari HP/laptop masing-masing dan datanya langsung
tergabung.

Untuk pengembangan lokal: `npx http-server "E:\Evaluasi JA" -p 8347` lalu buka
`http://localhost:8347`. Setiap perubahan kode di-push ke branch `main` akan
otomatis ter-deploy ulang oleh GitHub Pages (± 1 menit).

Skema database ada di `supabase-setup.sql`. **Penting:** file ini baru saja bertambah
4 tabel untuk fitur Kewaliasuhan (bagian "Tambahan: Kewaliasuhan" di akhir file) —
**jalankan ulang seluruh isi file ini** di Supabase Dashboard → SQL Editor → Run
(aman, seluruh perintah bersifat idempotent) agar fitur tersebut aktif. Sebelum
langkah ini dijalankan, tab Kewaliasuhan akan menampilkan pesan "tabel belum
dibuat" — 8 divisi lain tidak terpengaruh.

## Aplikasi Android

Tersedia sebagai **aplikasi Android asli (APK)**, bukan sekadar situs web:

- **Unduh**: tombol **📱 Unduh Aplikasi Android** di navbar, atau langsung
  https://evaluasi-ja.vercel.app/downloads/evaluasi-ja.apk
- Setelah diunduh, buka file APK-nya di HP untuk memasang. Karena tidak berasal
  dari Play Store, Android akan meminta izin **"Instal dari sumber tidak dikenal"**
  — izinkan khusus untuk file ini saja.
- Aplikasi berjalan **layar penuh tanpa address bar** (bukan sekadar tab
  browser) karena sudah diverifikasi kepemilikan domainnya (Digital Asset Links).
- Karena aplikasi ini merender langsung dari situs live, **setiap pembaruan web
  app otomatis tampil di aplikasi Android** tanpa perlu memasang APK baru — APK
  baru hanya dibutuhkan bila ikon/nama aplikasinya sendiri yang berubah.
- Source project Android ada di folder `android/` (dibuat dengan Bubblewrap/TWA).
  File kunci penandatanganan (`android/android.keystore`) **sengaja tidak
  disertakan** di repo karena bersifat rahasia — simpan cadangannya di tempat
  aman; kalau hilang, pembaruan APK berikutnya tidak bisa memakai identitas yang
  sama dan pengguna harus copot-pasang ulang aplikasinya.

Alternatif tanpa mengunduh APK: buka situs di Chrome Android → menu (⋮) →
**"Tambahkan ke layar Utama" / "Instal aplikasi"** — hasilnya serupa (ikon di
layar utama, tanpa address bar) dan otomatis selalu versi terbaru.

## Akun & Hak Akses

- **Publik (tanpa login)**: hanya dapat *melihat* Laporan Harian dan Rekap Mingguan
  sebagai data statis. Tidak bisa mengisi atau mengubah apa pun.
- **Koordinator divisi** (8 divisi selain Kewaliasuhan): setelah masuk lewat tombol
  **🔑 Masuk**, hanya dapat mengisi laporan dan mengelola program **divisinya sendiri**.
- **Wali Asuh** (khusus Kewaliasuhan): hanya dapat mengisi nilai & catatan santri
  **kelompok asuhannya sendiri**. Tidak bisa menambah/menghapus santri, aspek
  penilaian, atau akun wali lain — itu wewenang Admin.
- **Sekretaris Pesantren**: mengisi Catatan Rapat Evaluasi mingguan (halaman
  Evaluasi Mingguan). Tidak dapat mengubah laporan divisi.
- **Pengasuh**: memberikan catatan/arahan langsung pada tiap program per divisi
  (kartu "🖋️ Catatan Pengasuh" di tab Rekap Mingguan setiap divisi; ikut tercetak
  pada form mingguan). Tidak dapat mengubah laporan divisi.
- **Admin / Pengurus Harian**: dapat mengisi semua divisi, menulis Catatan Rapat
  Evaluasi dan Catatan Pengasuh, mereset kata sandi akun, serta mengelola daftar
  santri, aspek penilaian, dan **akun Wali Asuh** (tambah/ganti nama/hapus) di
  Kewaliasuhan — lihat bagian Fitur di bawah.

Akun bawaan (kata sandi awal = nama akun + 2026, **segera ganti** lewat menu akun 👤):

| Akun | Kata sandi awal |
|---|---|
| Koordinator Pendidikan (`pendidikan`) | `pendidikan2026` |
| Koordinator Ubudiyah (`ubudiyah`) | `ubudiyah2026` |
| Koordinator Tahfidz (`tahfidz`) | `tahfidz2026` |
| Koordinator Keamanan (`keamanan`) | `keamanan2026` |
| Koordinator Kesejahteraan (`kesejahteraan`) | `kesejahteraan2026` |
| Koordinator Kebersihan (`kebersihan`) | `kebersihan2026` |
| Koordinator Kesehatan (`kesehatan`) | `kesehatan2026` |
| Koordinator Sarana dan Prasarana (`sarpras`) | `sarpras2026` |
| Wali Asuh 1–11 (`wali1` s.d. `wali11`, bisa bertambah) | `wali12026` s.d. `wali112026` |
| Sekretaris Pesantren (`sekretaris`) | `sekretaris2026` |
| Pengasuh (`pengasuh`) | `pengasuh2026` |
| Admin / Pengurus Harian (`admin`) | `admin2026` |

> Catatan keamanan: aplikasi ini berjalan sepenuhnya di browser (tanpa server),
> sehingga proteksi akun bersifat praktis untuk mencegah salah isi antar divisi —
> bukan keamanan tingkat server. Orang yang paham teknis dan memegang perangkat
> tetap bisa membuka datanya. Untuk keamanan penuh dibutuhkan versi ber-backend.

## Fitur

- **9 divisi**: Pendidikan, Ubudiyah, Tahfidz, Keamanan, Kesejahteraan, Kebersihan,
  Kesehatan, Sarana dan Prasarana, Kewaliasuhan.
- **Pendidikan & Ubudiyah** sudah terisi program sesuai form contoh (termasuk jadwal
  per hari, mis. Pembacaan Tahlil hanya Kamis, Muhadoroh hanya Sabtu).
- Divisi lain (kecuali Kewaliasuhan): koordinator mengisi sendiri daftar program +
  hari pelaksanaannya di tab **Kelola Program**.
- **Kewaliasuhan** memakai format berbeda: **daftar nama santri × aspek penilaian**
  (skala 0–100 per aspek + catatan), bukan program kerja harian. Nilai yang diisi
  otomatis diwarnai seperti rapor sekolah (merah <60, kuning 60–74, hijau 75–89,
  hijau tua ≥90). Admin mengelola daftar aspek, santri tiap kelompok, serta akun
  Wali Asuh itu sendiri (tambah wali baru, ganti nama, atau hapus bila sudah
  tidak ada santri di kelompoknya) di tab **⚙️ Kelola Santri & Aspek** — jumlah
  wali tidak dibatasi 11, admin bebas menambah sesuai kebutuhan.
- **Laporan Harian**: pekan dimulai **Sabtu** s.d. Jum'at; isian tersimpan otomatis.
- **Rekap Mingguan**: terisi otomatis dari laporan harian, lengkap dengan rata-rata dan
  rangkuman kendala.
- **Evaluasi Mingguan Gabungan**: ringkasan semua divisi + catatan rapat, untuk bahan
  rapat evaluasi.
- **Cetak**: form harian, form mingguan, dan rekap evaluasi bisa dicetak (atau "Save as
  PDF") dengan tata letak menyerupai form kertas, termasuk kolom tanda tangan.
- **Aplikasi Android**: bisa dipasang sebagai APK asli — lihat bagian di atas.

## Penyimpanan Data

Seluruh data (laporan, program, akun, catatan) tersimpan terpusat di **Supabase**,
sehingga otomatis tergabung dari semua perangkat — baik yang mengakses lewat
browser maupun lewat aplikasi Android.
