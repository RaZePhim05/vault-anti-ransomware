# 🛡️ Sistem Arsip Anti-Ransomware (Vault)
**Zero-Trust Cryptographic Data Dispersal System**

<p align="left">
  <img src="https://img.shields.io/badge/Next-black?style=for-the-badge&logo=next.js&logoColor=white" alt="Next JS" />
  <img src="https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB" alt="React" />
  <img src="https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase" />
  <img src="https://img.shields.io/badge/javascript-%23323330.svg?style=for-the-badge&logo=javascript&logoColor=%23F7DF1E" alt="JavaScript" />
</p>

Sistem Arsip Anti-Ransomware (Vault) adalah aplikasi keamanan penyimpanan dokumen tingkat lanjut yang dirancang untuk memitigasi risiko kehilangan data akibat serangan *ransomware*. Sistem ini menerapkan prinsip *Zero-Trust* dengan memadukan algoritma enkripsi simetrik dan teknik pemecahan kunci rahasia (*Secret Sharing*), sehingga tidak ada satu pun *node* penyimpanan yang memiliki akses penuh terhadap dokumen utuh.

## ✨ Fitur Utama

* **Enkripsi Sisi Klien (Client-Side Encryption):** Dokumen dienkripsi langsung di perangkat pengguna menggunakan algoritma **AES-256-GCM** sebelum dikirim ke server.
* **Shamir's Secret Sharing (SSS):** Kunci utama (Master Key) dipecah menjadi beberapa bagian (shares). Dibutuhkan setidaknya 2 dari 3 pecahan kunci (Threshold: 2/3) untuk merekonstruksi dokumen.
* **Distribusi Multi-Node:** Pecahan file dan kunci didistribusikan secara terpisah ke 3 lingkungan *node* yang berbeda:
  * Node Lokal
  * Node PDN (Pusat Data Nasional)
  * Node Cloud
* **Dashboard Pemantauan Integritas:** Dilengkapi dengan *Scanner Real-time* untuk mendeteksi ketersediaan data di masing-masing *node*.
* **Audit Trail (Log Keamanan):** Sistem pelacakan aktivitas (*Accountability*) yang mencatat setiap proses unggah, unduh, penghapusan parsial/total, dan peringatan kritis secara persisten.
* **Simulasi Serangan:** Fitur demonstrasi untuk mensimulasikan hilangnya integritas pada Node Lokal (Ransomware Attack) dan menguji keandalan rekonstruksi data dari *node* yang tersisa.

## 🛠️ Teknologi yang Digunakan

* **Framework:** Next.js / React
* **Styling:** Tailwind CSS
* **Database & Storage:** Supabase
* **Kriptografi:** Web Crypto API (AES-256-GCM)
* **Secret Sharing:** `secrets.js-grempe`

## ⚙️ Panduan Instalasi (Development)

1. **Kloning repositori ini:**
   ```bash
   git clone [https://github.com/RaZePhim05/vault-anti-ransomware.git](https://github.com/RaZePhim05/vault-anti-ransomware.git)
   cd vault-anti-ransomware
2. Instal dependensi:
Bash
npm install

4. Konfigurasi Environment:
Buat file .env.local di root direktori dan masukkan konfigurasi Supabase Anda:
NEXT_PUBLIC_SUPABASE_URL=url_supabase_anda
NEXT_PUBLIC_SUPABASE_ANON_KEY=kunci_anon_supabase_anda

5. Jalankan server pengembangan:
npm run dev
Buka http://localhost:3000 di browser Anda untuk melihat hasilnya.

👥 Tim Pengembang / Penyusun
Proyek kriptografi ini disusun oleh:

Zefanya Raditya Pratama

📝 Lisensi
Proyek ini dibuat untuk tujuan akademis dan demonstrasi keamanan sistem.
