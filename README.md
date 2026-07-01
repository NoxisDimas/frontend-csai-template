# Customer Support AI Bot - Admin Dashboard

Dashboard administrasi modern untuk mengelola dan memonitor interaksi Customer Support (CS) AI Bot. Dibangun dengan fokus pada performa tinggi, UI/UX yang dinamis, dan skalabilitas.

## 🚀 Fitur Utama

- **Live Inbox**: Monitor dan ambil alih (takeover) percakapan AI dengan pelanggan secara real-time.
- **Conversation History**: Lihat kembali riwayat percakapan yang telah selesai beserta transkrip detail.
- **Knowledge Base**: Manajemen dokumen yang menjadi basis pengetahuan AI (Upload, Sync dari platform eksternal).
- **Escalation Tickets**: Manajemen tiket dukungan untuk percakapan yang membutuhkan penanganan khusus dari agen manusia.
- **Product & Integration Management**: Atur data produk dan integrasi sistem eksternal (Shopify, dll).
- **User Management**: Manajemen pengguna dashboard dan akses perannya.
- **Simulasi AI**: Fitur Chat Simulator untuk menguji respon AI berdasarkan Knowledge Base terbaru.

## 🛠 Tech Stack

- **Framework**: React 19 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS v4 + Radix UI Primitives
- **Routing**: React Router v7
- **Icons**: Lucide React
- **HTTP Client**: Axios
- **State Management**: React Context API
- **Deployment**: Docker + Nginx (Multi-stage build)

## 📦 Struktur Folder

```text
frontend-cs-ai/
├── src/
│   ├── components/    # Komponen UI reusable (layout, buttons, cards, dll)
│   ├── contexts/      # React Context untuk state management (Auth, dll)
│   ├── lib/           # Utility dan konfigurasi (konfigurasi API Axios, dll)
│   ├── pages/         # Halaman utama aplikasi (Overview, Inbox, Tickets, dll)
│   ├── styles/        # Global CSS, tema Tailwind
│   ├── App.tsx        # Entry point komponen React
│   └── routes.tsx     # Konfigurasi routing aplikasi
├── public/            # Aset statis publik (favicon, gambar)
├── docs/              # Dokumentasi teknis proyek
├── .env.example       # Contoh environment variables
├── Dockerfile         # Konfigurasi Multi-stage build Docker
├── nginx.conf         # Konfigurasi Nginx untuk Docker
└── package.json       # Konfigurasi project NPM
```

## 💻 Pengembangan Lokal (Local Development)

### Prasyarat
- Node.js (versi 20 atau terbaru)
- npm atau yarn

### Instalasi

1. Clone repositori ini.
2. Masuk ke direktori proyek:
   ```bash
   cd frontend-cs-ai
   ```
3. Salin file environment:
   ```bash
   cp .env.example .env
   ```
4. Sesuaikan `VITE_API_BASE_URL` di file `.env` dengan endpoint backend Anda.
5. Install dependencies:
   ```bash
   npm install
   ```
6. Jalankan mode pengembangan:
   ```bash
   npm run dev
   ```
Aplikasi akan berjalan di `http://localhost:5173`.

## 🐳 Deployment (VPS / Docker)

Aplikasi ini sudah dipersiapkan untuk lingkungan *production* menggunakan **Docker Multi-stage Build** yang sangat ringan (Nginx alpine). Cara paling mudah untuk men-deploy aplikasi ini adalah menggunakan **Docker Compose**.

### 1. Menjalankan dengan Docker Compose (Direkomendasikan)
Cukup jalankan satu perintah ini di root direktori proyek:
```bash
docker-compose up -d --build
```
Perintah ini akan secara otomatis:
- Mem-build image berdasarkan `Dockerfile`.
- Menjalankan container dengan nama `cs-dashboard-frontend`.
- Membuka aplikasi di port `3005`.

*Untuk menghentikan aplikasi, gunakan perintah: `docker-compose down`*

### 2. Menjalankan Manual (Opsional)
Jika Anda tidak menggunakan docker-compose:
```bash
# Build image
docker build -t frontend-cs-ai .

# Run container
docker run -d -p 3005:80 --name cs-dashboard frontend-cs-ai
```

### 3. Konfigurasi Reverse Proxy (Opsional)
Jika Anda menggunakan Nginx di server VPS utama, atur *Reverse Proxy* untuk meneruskan *traffic* ke port yang telah ditentukan:
```nginx
server {
    listen 80;
    server_name dashboard.domainanda.com;

    location / {
        proxy_pass http://localhost:3005;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

> **Catatan:** Routing SPA di dalam container sudah ditangani oleh file `nginx.conf` bawaan Docker image, sehingga Anda tidak perlu khawatir tentang error 404 saat melakukan refresh halaman.

## 📄 License
Hak cipta dilindungi. Penggunaan internal perusahaan.
