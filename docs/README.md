# KIGALI NUDGE - Situs Sistem (GitHub Pages + Google Spreadsheet)

Situs dashboard statis yang membaca data dari **Google Spreadsheet** (database) melalui
**Google Apps Script** (API JSON). Cocok dihosting gratis di **GitHub Pages**.

```
Google Form  →  Google Spreadsheet (database)  →  Apps Script (API JSON)  →  Situs GitHub Pages (tampilan)
```

## Struktur berkas

```
index.html            → halaman dashboard
assets/styles.css      → desain
assets/app.js          → logika: ambil data dari API (JSONP) lalu tampilkan
config.js              → tempel URL API kamu di sini
apps-script/Code_API.gs→ ditempel ke proyek Apps Script (bukan ke GitHub)
```

## Langkah pasang (sekali)

### 1. Backend - Spreadsheet + API
1. Unggah workbook `KIGALI_NUDGE_Sistem_MVP_v0.9.xlsx` ke Google Sheets (jaga nama tab).
2. Extensions → Apps Script. Pastikan `Code.gs` (pembuat Form + trigger) sudah ada.
3. Tambah file baru, tempel isi `apps-script/Code_API.gs`. Simpan.
4. Deploy → New deployment → **Web app**: *Execute as: Me*, *Who has access: Anyone*. Deploy, izinkan, **salin URL `/exec`**.
5. Uji: buka URL itu di browser → harus muncul JSON.

### 2. Frontend - GitHub Pages
1. Buka `config.js`, ganti `apiUrl` dengan URL `/exec` tadi. (Isi juga nama sekolah.)
2. Buat repo GitHub, unggah semua berkas ini (kecuali folder `apps-script/`).
3. Repo → Settings → Pages → Source: `main` / root → Save.
4. Tunggu ±1 menit, buka `https://<username>.github.io/<repo>/`. Dashboard tampil dan terisi otomatis dari Spreadsheet.

## Cara kerja koneksi (tanpa masalah CORS)
`app.js` memanggil API lewat **JSONP** (`?callback=...`), jadi situs GitHub bisa membaca
Apps Script lintas-domain tanpa setelan tambahan. Bila `config.js` belum diisi atau API
gagal dihubungi, situs otomatis menampilkan **mode contoh** (angka ilustrasi) supaya tetap bisa dipresentasikan.

## Privasi
API hanya mengirim **data agregat** (KPI, papan skor, ringkasan energi & mutu data).
Nama siswa dan baris log mentah tidak pernah dikirim ke situs publik.

## Memperbarui tampilan
Situs mengambil data terbaru setiap dibuka atau saat tombol **Perbarui** ditekan.
Untuk auto-refresh, isi `autoRefreshDetik` di `config.js` (mis. `60`).

## Catatan
Situs ini lapisan presentasi, bukan inti riset. Kebaruan tetap pada *nudge* + protokol
pengukuran murah; dashboard adalah bukti yang menjalankannya.
