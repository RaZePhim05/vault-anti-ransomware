Markdown
# Sistem Arsip Anti-Ransomware (Vault)
**Zero-Trust Cryptographic Data Dispersal System**

Sistem Arsip Anti-Ransomware (Vault) adalah aplikasi keamanan penyimpanan dokumen tingkat lanjut yang dirancang untuk memitigasi risiko kehilangan data akibat serangan *ransomware*. Sistem ini menerapkan prinsip *Zero-Trust* dengan memadukan algoritma enkripsi simetrik dan teknik pemecahan kunci rahasia (*Secret Sharing*), sehingga tidak ada satu pun *node* penyimpanan yang memiliki akses penuh terhadap dokumen utuh.

## Fitur Utama

* **Enkripsi Sisi Klien (Client-Side Encryption):** Dokumen dienkripsi langsung di perangkat pengguna menggunakan algoritma **AES-256-GCM** sebelum dikirim ke server.
* **Shamir's Secret Sharing (SSS):** Kunci utama (Master Key) dipecah menjadi beberapa bagian (shares). Dibutuhkan setidaknya 2 dari 3 pecahan kunci (Threshold: 2/3) untuk merekonstruksi dokumen.
* **Distribusi Multi-Node:** Pecahan file dan kunci didistribusikan secara terpisah ke 3 lingkungan *node* yang berbeda:
  * Node Lokal
  * Node PDN (Pusat Data Nasional)
  * Node Cloud
* **Dashboard Pemantauan Integritas:** Dilengkapi dengan *Scanner Real-time* untuk mendeteksi ketersediaan data di masing-masing *node*.
* **Audit Trail (Log Keamanan):** Sistem pelacakan aktivitas (*Accountability*) yang mencatat setiap proses unggah, unduh, penghapusan parsial/total, dan peringatan kritis secara persisten.
* **Simulasi Serangan:** Fitur demonstrasi untuk mensimulasikan hilangnya integritas pada Node Lokal (Ransomware Attack) dan menguji keandalan rekonstruksi data dari *node* yang tersisa.

## Teknologi yang Digunakan

* **Framework:** Next.js / React
* **Styling:** Tailwind CSS
* **Database & Storage:** Supabase
* **Kriptografi:** Web Crypto API (AES-256-GCM)
* **Secret Sharing:** `secrets.js-grempe`

## Panduan Instalasi (Development)

1. **Kloning repositori ini:**
   ```bash
   git clone [https://github.com/USERNAME-ANDA/vault-anti-ransomware.git](https://github.com/USERNAME-ANDA/vault-anti-ransomware.git)
   cd vault-anti-ransomware
Instal dependensi:

Bash
npm install
Konfigurasi Environment:
Buat file .env.local di root direktori dan masukkan konfigurasi Supabase Anda:

Code snippet
NEXT_PUBLIC_SUPABASE_URL=url_supabase_anda
NEXT_PUBLIC_SUPABASE_ANON_KEY=kunci_anon_supabase_anda
Jalankan server pengembangan:

Bash
npm run dev
Buka http://localhost:3000 di browser Anda untuk melihat hasilnya.

Tim Pengembang / Penyusun
Proyek kriptografi ini disusun oleh Zefanya Raditya Pratama

Lisensi
Proyek ini dibuat untuk tujuan akademis dan demonstrasi keamanan sistem.

Dibuat untuk memenuhi tugas/proyek Kriptografi dan Keamanan Data.
