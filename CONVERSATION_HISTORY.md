# Fishline - Riwayat Percakapan & Daftar Fitur per Commit

Dokumentasi ini merangkum seluruh alur percakapan, instruksi pengguna, dan implementasi fitur secara berurutan. Setiap fitur disimpan dalam commit terpisah agar Anda dapat melakukan **undo**, **review**, atau **checkout** ke tahapan manapun jika diperlukan.

---

## 🗺️ Peta Commit & Riwayat Percakapan

| No | Commit | User Prompt (Asli) | Ringkasan Fitur & Perubahan Teknis |
|---|---|---|---|
| **Base** | `a514372` | *https://github.com/LingDong-/fishdraw clone ini* | Clone repositori dasar dari LingDong-/fishdraw (generator gambar ikan SVG statis). |
| **01** | `e288c61` | *peljari dan bisa ngak ya draw animasi ikan juga? jadi 1 jenis ikan yang acak tapi ada animasi nya animasi idle gerak makan mati gitu* | Ekstraksi polyline fishdraw menjadi komponen anatomi terpisah (`fish_structured`: head, jaw, eye, dorsal, pectoral, pelvic, anal, tail, body, shading) beserta anchor points kinematika (`jaw_hinge`, `eye_center`, `pectoral_root`, dll.). |
| **02** | `d7b31a2` | *(lanjutan prompt di atas)* | Mesin deformasi 2D tulang belakang sinusoidal (`fish_animator.js`), kepakan sirip dada, riak sirip punggung/anal, dan state machine (`idle`, `swim`, `eat`, `die`, `revive`). |
| **03** | `4de9c8b` | *(lanjutan prompt di atas)* | Antarmuka Canvas HTML5 interaktif bergaya sumi-e washi parchment (`index.html`), jatuhan pelet makanan & efek riak air saat klik, tombol aksi (Feed, Die, Revive, New Species, Speed slider), dan telemetry HUD. |
| **04** | `9de2bfe` | *masih ada bug saat makan dia point mulut nya ngak langsung nyasar pelet nya* | Perbaikan navigasi makan: ikan mengarahkan ujung moncong/bibir (`getMouthWorldPosition()`) langsung ke pelet, koreksi simetri pitch saat hadap kiri/kanan, dan histeresis bodyDx agar tidak bolak-balik saat posisi vertikal. |
| **05** | `38ad709` | *sirip sampingkan bergerak tapi di badan nya jadi ngak ad amotif nya tolong buat ada motif nya saat sirip samping nya bergerak* | Menghapus pemotongan/lubang sisik di bawah sirip samping (`arg.clip_pectoral_hole = false`), mengekspor kontur sirip samping, dan menerapkan dynamic paper mask di `fish_animator.js` agar sisik dan motif tubuh tetap utuh saat sirip berkepak. |
| **06** | `6a73df1` | *saat makan bibir bawah nutup pls* & *pas makan bibir bawah nya nutup banget rapet* | Bibir bawah mengatup rapat sempurna (`jawAngle = -0.10 rad`) saat menyentuh pelet makanan, dilengkapi durasi gigit (0.35s) sebelum kembali ke idle. |
| **07** | `c265562` | *ok coba run lagi* | Server HTTP statis mandiri tanpa dependensi luar (`server.js` pada port 3000) dengan MIME types lengkap untuk pengujian browser lokal bebas batasan CORS. |
| **08** | `d027807` | *bibir nya biasa pas idle jangan nutup rapet magap magap gitu* & *bibir nyya terlalu mingkem ya tolong buat natural* | Postur bibir istirahat alami (`params.jaw_open = 0.25`) agar garis bibir tidak saling tumpang tindih atau gepeng (mingkem), ditambah osilasi pernapasan lembut ("magap-magap") saat berenang santai (idle). |
| **09** | `95fa063` | *kenapa saat saya kasih umpan tepat di dean kepala ikan nya dia jadi nge glicth kayak patah patah gtiu* | Menghilangkan getaran / glitch flip hadap kiri-kanan ketika pelet jatuh persis di depan moncong ikan menggunakan deadband histeresis jarak badan (`bodyDx`) dan pitch damping halus. |
| **10** | `e1918ac` | *https://github.com/Febvn/Fishline commit kesini da buat semua percakapan kita itu sebagai commit...* | Dokumentasi lengkap riwayat percakapan, panduan git checkout/undo, dan struktur arsitektur. |
| **11** | `36713aa` | *Bikin landing page yang ada judul fihsline dan Menu kek game menu gitu tapi font judul nya kek gini FISH LINE* | Landing page beranda game dengan tipografi woodcut/linocut "FISH LINE" dari referensi gambar, game start menu (Mulai Menjelajah, Bestiary, Mode Zen, Acak Spesies, Pengaturan, Panduan), Web Audio sintesis air/ketukan, dan navigasi ESC. |
| **12** | `b2c9830` | *anda ngecrop gambar nya masih salah* | Perbaikan isolasi crop tipografi: memotong setiap huruf (F, I, S, H, L, I, N, E) tepat pada batas isolasi piksel bebas kebocoran huruf tetangga (D, G, J, K, M, X), mempertahankan warna tinta asli dari gambar, dan menyatukannya dalam banner presisi. |
| **13** | `6c23978` | *kalau generate font yang milih jad ngak usah pakai img* | Generator tipografi woodcut/linocut prosedural murni berbasis kode JavaScript & HTML5 Canvas tanpa berkas gambar eksternal (2-pass distance transform, organic displacement wave, dan interaksi riak air saat hover kursor). |

---

## 🛠️ Panduan Berpindah Antar Fitur & Undo (Git Commands)

### 1. Melihat Riwayat Commit
```bash
git log --oneline --graph --decorate
```

### 2. Menguji / Mencoba Versi Tertentu (Checkout Sementara)
Jika Anda ingin melihat kondisi aplikasi pada commit tertentu (misalnya pada Commit 05):
```bash
git checkout 38ad709
```
Jalankan server untuk mencoba:
```bash
node server.js
```
Buka di browser: `http://localhost:3000`

Untuk kembali ke versi terbaru (`main`):
```bash
git checkout main
```

### 3. Mengurungkan (Undo) Satu Commit Tertentu Tanpa Merusak Commit Lain
Gunakan `git revert` jika ingin membatalkan perubahan dari commit tertentu:
```bash
git revert <commit-hash>
```

### 4. Mereset / Mengembalikan Cabang ke Titik Tertentu
Jika Anda ingin membatalkan semua perubahan setelah commit tertentu:
```bash
# Peringatan: commit setelah target-hash akan dihapus dari history cabang saat ini
git reset --hard <target-commit-hash>
```

---

## 🚀 Menjalankan Proyek Secara Lokal

```bash
node server.js
```
Buka browser di:
```
http://localhost:3000
```
- Klik di area air untuk menjatuhkan pelet makanan.
- Gunakan tombol **Feed**, **Kill (Belly-up)**, **Revive**, dan **New Species** untuk berinteraksi.
- Atur kecepatan renang dan gerakan melalui slider.
