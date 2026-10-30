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
| **13** | `b525cf8` | *kalau generate font yang milih jad ngak usah pakai img* | Eksperimen generator tipografi linocut prosedural murni berbasis kode JavaScript & HTML5 Canvas tanpa gambar eksternal. |
| **14** | `6e01628` | *aneh bener jing* | Menghapus generator prosedural sintetis canvas yang kaku/aneh, mengembalikan tipografi otentik cukil kayu asli dari gambar referensi dengan isolasi piksel presisi (connected component analysis, border-free moat margin di setiap huruf F, I, S, H, L, I, N, E, zero neighbor leakage, dan proporsi cap-height serasi). |
| **15** | `552996c` | *@[Alfabet Topografis Hitam Putih.png] pakai yang ini aaj coba untuk font nya* | Ekstraksi tipografi judul "FISH LINE" resolusi tinggi (2x retina) dari lembar 'Alfabet Topografis Hitam Putih.png' murni tanpa watermark. Setiap huruf (F, I, S, H, L, I, N, E) diisolasi dengan margin bersih 4 sisi tanpa kebocoran tetangga dan dirakit menjadi banner 1302x240 yang sangat tajam dan presisi. |
| **16** | `9572687` | *bikin landing page sebelah kiri itu menu nya sebelah kakan nya fish line tapi di spasi jadi fish di atas line nya di bawah* | Layout 2-kolom asimetris beranda game: kolom kiri memuat navigasi menu game lengkap beserta statistik telemetri, sedangkan kolom kanan menampilkan tipografi cukil kayu 'FISH LINE' bersusun vertikal ('FISH' di atas dan 'LINE' di bawah) dengan spasi vertikal proporsional, serta responsif terhadap desktop dan mobile. |
| **17** | `a9aeed1` | *jadi saya mau bikin mekanisme kalau mau dapat ikan baru ghaca harus bayar dulu gitu atau nonton iklan* | Sistem Gacha Pemanggilan Ikan Baru: pemain dapat memanggil spesies ikan baru menggunakan tiket gacha, yang dapat diperoleh secara gratis dengan menonton iklan sponsor (simulasi rewarded ad 5 detik) atau dengan pembayaran instan via QRIS (simulator payment gateway native siap integrasi backend PHP/Midtrans). Dilengkapi animasi Ensō summoning, kalkulasi kelangkaan (Biasa, Langka, Legendaris), dan sintesis audio koin & lonceng kuil. |
| **18** | `d383dbf` | *bikin js kek fishdraw.js tapi untuk tanaman hias aquarium nya jadi kek rumput laut gitu semua dari perhitungan mtk* | Mesin Prosedural Tanaman Hias & Rumput Laut (`plantdraw.js`): generasi matematis murni tanaman air (rumput pita *Vallisneria*, kelp berdaun *Laminaria*, dll.) berbasis kurva Bézier, osilasi gelombang harmonik, fisika fluida lentur (menyibak saat dilalui ikan atau riak air), venasi kuas sumi-e, dan koloni ekosistem dasar kolam. |
| **19** | 30fe714 | *pakai sskill anti slop untuk ui/ux landing page nya* | Refaktor UI/UX Bebas Slop (Anti-Slop Crafting) berbasis panduan `antislop`, `antislop-ui`, dan `taste-skill`: eliminasi 100% ornamen emoji dekoratif, integrasi cap stempel Hanko (`目`, `券`, `静`), indeks nomor tipografis cukil kayu (`01`–`06`), penghapusan statistik fabrikasi AI (`~4,29 Miliar Spesies`) digantikan kolofon kuratorial jujur, portal Ensō kaligrafi `魚`, serta umpan balik taktil fisik (`:active`). |
| **20** | 759a208 | *ngak mau di tekan enter dia* | Perbaikan runtime bug JavaScript TDZ (Temporal Dead Zone ReferenceError pada inisialisasi `plantColony` saat `resizeCanvas` awal), penambahan autofocus pada tombol Mulai Menjelajah saat halaman dimuat dan menu dibuka, penanganan tombol keyboard `Enter` yang komprehensif (`e.key`, `e.code`, `keyCode 13`), serta dukungan navigasi tombol panah keyboard (`ArrowUp` / `ArrowDown`). |
| **21** | 956b6fc | *oh iya karen ini masih uji coba bikin juga page buat uji coba rumput dan ikan pisahin page nya uji coba ini jadi generate beda beda bebeas* | Pembuatan 2 halaman laboratorium pengujian mandiri: lab_fish.html (workbench biomekanik ikan: kustomisasi seed, inspeksi layer tulang spine/mouth point, slider rahang, kontrol siklus animasi, dan ekspor PNG) dan lab_plant.html (workbench botani tanaman: mode rumpun tunggal vs koloni dasar kolam, seleksi morfologi pita/kelp/campuran, slider geometri bilah, simulasi arus ambien, interaksi probe sentuhan kursor/ikan virtual, dan ekspor PNG), serta integrasi tautan lab di top bar dan menu index.html. |
| **22** | c408ad0 | *Jenis bentuk vegetasi bawah air: 1. Seagrass, 2. Kelp, 3. Branching algae, 4. Sheet algae, 5. Bubble algae, 6. Aquatic moss, buat karakter nya berbagai macam ini: American Pondweed, Cabomba, Coontail, Curly-leaf Pondweed, Hydrilla, Elodea, Watermilfoil, Water Wisteria, dll. ngak cuman kelp ribbon atau bersirip aja* | Ekspansi arsitektur vegetasi air `plantdraw.js`: implementasi 7 morfologi botani komprehensif (Seagrass, Giant Kelp, Branching Algae, Sheet/Ulva, Bubble Algae Valonia, Aquatic Moss, Whorled/Cabomba/Coontail) dan katalog 40 spesies botani akuatik riil beserta parameter matematis unik; peremajaan workbench `lab_plant.html` dengan pemilih 40 spesies, kartu taksonomi, dan kontrol morfologi 7 arsitektur. |
| **23** | 321be7d | *lebar nya bisa di buat acak juga ngak untuk ini ? jumlah vegetasi terus lebar nya lalu tinggi nya gitu biar natural dan juga yang udah saya suka design nya cuman nomor 6 , 3,1 yang lain kategori selain 3 ini perbaiki design nya* | Desain ulang total 4 kategori arsitektur botani (Kelp berombak kerut dengan pneumatocyst, Sheet tirai folia multilobe tipis, Bubble mutiara zamrud hierarkis dengan highlight specular ganda, Whorled batang sinusoidal renda beruas), mempertahankan kategori favorit pengguna (1 Seagrass, 3 Branching, 6 Moss), serta integrasi variasi acak alami intra-helai (lebar, tinggi, kelengkungan, kerapatan) di `plantdraw.js` dan kontrol interaktif di `lab_plant.html`. |
| **24** | 4e602b8 | *buat ada pengaturan terapatan anytarar daun dan saya mau dia agar berjarak tapi adaperubahan derajat gitu* | Implementasi sistem pengaturan jarak pangkal daun (`bladeSpacing` 4–45px) dan variasi sudut derajat mekar daun (`spreadAngleDeg` 0°–110°) pada seluruh arsitektur botani `plantdraw.js`: formulasi vektor kemiringan $(s \cdot L \sin\theta, -s \cdot L \cos\theta)$, 3 mode distribusi derajat (Kipas Progresif, Berselang-seling, Spiral Filotaksis), penyesuaian dinamis batu jangkar holdfast, serta kontrol slider dan tombol preset cepat di `lab_plant.html`. |
| **25** | 741e212 | *untuk kelp nomor 3 hapus bulat bulat nya* | Penghapusan ornamen kantung gas apung (*pneumatocysts* / tonjolan gelembung bulat lonjong) pada bilah Kelp (`KelpBlade`) di `plantdraw.js`: menghasilkan morfologi bilah kelp murni yang bersih, mengalir anggun dengan pelepah stipe lentur, gelombang tepi berkerut (*crinkled frills*), dan venasi sumi-e tanpa bulatan samping. |
| **26** | 11f01e2 | *hapus aja tampilan batu jangkar dasar kolam nya* | Penghapusan tampilan batu jangkar (*holdfast anchor rock*) pada dasar rumpun tanaman air di `plantdraw.js` dan `lab_plant.html`: tanaman kini tumbuh langsung secara alami dari dasar kolam substrat pasir tanpa elips batu jangkar buatan. |
| **27** | `89f7a9f` | *ok sekarang bikin draw.js peddle batu batu di danau gitu random juga pakai mtk juga bermacam macam juga* | Pembuatan mesin batu kerikil danau prosedural `pebbledraw.js` (6 arsitektur geologi: smooth river pebble, craggy boulder, stratified shale, mossy rock, karst taihu, riverbed cluster; 24 katalog varietas danau riil; deformasi Fourier harmonik, kontur topografi chiaroscuro, garis strata sedimen, rekahan fissure, dan spora lumut air), laboratorium uji coba mandiri `lab_pebble.html`, integrasi hamparan batu dasar danau di `index.html`, serta penyelarasan tautan navigasi antarlab di semua halaman (`index.html`, `lab_fish.html`, `lab_plant.html`, `lab_pebble.html`). |

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
