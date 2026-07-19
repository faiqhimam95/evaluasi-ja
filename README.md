# Evaluasi Mingguan — Pondok Pesantren Jalaluddin Ar-Rumi Jatisari

Aplikasi web untuk laporan program kerja **harian** dan **mingguan** seluruh divisi pondok,
mengikuti format Form Laporan Program Kerja Divisi (kolom Prosentase A/Kuantitatif dan
B/Kualitatif, Keterangan, Kendala, Solusi/Langkah Konkrit, serta Nama Santri yang Tidak
Mengikuti Kegiatan).

## Cara Menjalankan

Aplikasi ini statis — tidak butuh instalasi apa pun.

**Cara termudah:** klik dua kali `index.html` (terbuka di Chrome/Edge).

**Lewat server lokal** (disarankan bila ingin diakses HP lain dalam satu Wi-Fi):

```
npx http-server "E:\Evaluasi JA" -p 8347
```

lalu buka `http://localhost:8347` — atau dari HP: `http://<IP-laptop>:8347`.

## Akun & Hak Akses

- **Publik (tanpa login)**: hanya dapat *melihat* Laporan Harian dan Rekap Mingguan
  sebagai data statis. Tidak bisa mengisi atau mengubah apa pun.
- **Koordinator divisi**: setelah masuk lewat tombol **🔑 Masuk**, hanya dapat mengisi
  laporan dan mengelola program **divisinya sendiri**.
- **Sekretaris Pesantren**: mengisi Catatan Rapat Evaluasi mingguan (halaman
  Evaluasi Mingguan). Tidak dapat mengubah laporan divisi.
- **Pengasuh**: memberikan catatan/arahan langsung pada tiap program per divisi
  (kartu "🖋️ Catatan Pengasuh" di tab Rekap Mingguan setiap divisi; ikut tercetak
  pada form mingguan). Tidak dapat mengubah laporan divisi.
- **Admin / Pengurus Harian**: dapat mengisi semua divisi, menulis Catatan Rapat
  Evaluasi dan Catatan Pengasuh, mengimpor data, dan mereset kata sandi akun.

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
| Koordinator Kewaliasuhan (`kewaliasuhan`) | `kewaliasuhan2026` |
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
- Divisi lain: koordinator mengisi sendiri daftar program + hari pelaksanaannya di tab
  **Kelola Program**.
- **Laporan Harian**: pekan dimulai **Sabtu** s.d. Jum'at; isian tersimpan otomatis.
- **Rekap Mingguan**: terisi otomatis dari laporan harian, lengkap dengan rata-rata dan
  rangkuman kendala.
- **Evaluasi Mingguan Gabungan**: ringkasan semua divisi + catatan rapat, untuk bahan
  rapat evaluasi.
- **Cetak**: form harian, form mingguan, dan rekap evaluasi bisa dicetak (atau "Save as
  PDF") dengan tata letak menyerupai form kertas, termasuk kolom tanda tangan.
- **💾 Data**: ekspor/impor JSON untuk cadangan atau pindah perangkat.

## Penting: Penyimpanan Data

Data tersimpan di **browser masing-masing perangkat** (localStorage). Artinya:

- Data laptop A tidak otomatis muncul di laptop B / HP.
- Jangan hapus data browsing (site data) untuk situs ini.
- Rutin lakukan **Ekspor Data** dari menu 💾 Data sebagai cadangan.
- Untuk menggabungkan laporan antar perangkat, gunakan ekspor → impor,
  atau jalankan lewat satu server yang diakses bersama dari HP koordinator.
