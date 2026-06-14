# 📖 User Stories — Flux

> Format: *"Sebagai [role], saya ingin [aksi], agar [manfaat]."*
>
> Prioritas: 🔴 Critical | 🟠 High | 🟡 Medium | 🟢 Low

---

## Phase 1 — Foundation

### #01 Project Setup

| ID | User Story | Prioritas |
|----|-----------|:---------:|
| US-001 | Sebagai **developer**, saya ingin menjalankan `bun run dev` di folder frontend dan backend, agar saya bisa mulai mengembangkan aplikasi dengan environment yang siap pakai. | 🔴 |
| US-002 | Sebagai **developer**, saya ingin project menggunakan monorepo sederhana (frontend + backend terpisah), agar struktur code terorganisir dan mudah di-maintain. | 🔴 |

### #02 Database Schema & Connection

| ID | User Story | Prioritas |
|----|-----------|:---------:|
| US-003 | Sebagai **developer**, saya ingin database PostgreSQL terhubung dengan backend Hono, agar data bisa disimpan secara persisten. | 🔴 |
| US-004 | Sebagai **developer**, saya ingin tabel `boards`, `lists`, dan `cards` terbentuk dengan relasi foreign key yang benar, agar integritas data terjaga. | 🔴 |
| US-005 | Sebagai **developer**, saya ingin ada skrip seed untuk dummy data, agar saya bisa melakukan testing dengan mudah. | 🟡 |

### #03 Backend API Endpoints (CRUD)

| ID | User Story | Prioritas |
|----|-----------|:---------:|
| US-006 | Sebagai **user**, saya ingin membuat board baru, agar saya bisa memulai project baru. | 🔴 |
| US-007 | Sebagai **user**, saya ingin menambahkan list/kolom ke board, agar saya bisa mengorganisir tahapan kerja (To Do, In Progress, Done). | 🔴 |
| US-008 | Sebagai **user**, saya ingin membuat, mengedit, dan menghapus card, agar saya bisa mengelola tugas-tugas saya. | 🔴 |
| US-009 | Sebagai **user**, saya ingin memindahkan card ke list lain via API, agar status tugas bisa diperbarui. | 🔴 |

### #06 Kanban UI (Static & State)

| ID | User Story | Prioritas |
|----|-----------|:---------:|
| US-010 | Sebagai **user**, saya ingin melihat board dalam tampilan Kanban (kolom horizontal), agar saya bisa memahami status seluruh tugas secara visual. | 🔴 |
| US-011 | Sebagai **user**, saya ingin melihat kartu-kartu di setiap kolom yang sesuai dengan data di database, agar informasi yang ditampilkan akurat. | 🔴 |
| US-012 | Sebagai **user**, saya ingin ada tombol "Tambah Kartu" di setiap kolom, agar saya bisa membuat tugas baru dengan cepat. | 🔴 |

### #09 Drag and Drop

| ID | User Story | Prioritas |
|----|-----------|:---------:|
| US-013 | Sebagai **user**, saya ingin menarik (drag) card dari satu kolom ke kolom lain, agar saya bisa memperbarui status tugas secara intuitif. | 🔴 |
| US-014 | Sebagai **user**, saya ingin perubahan posisi card langsung terlihat (optimistic update), agar pengalaman terasa responsif tanpa menunggu server. | 🔴 |
| US-015 | Sebagai **user**, saya ingin urutan card tersimpan di server setelah drag, agar perubahan persist saat halaman di-refresh. | 🔴 |

### #05 Dark Mode & Theming

| ID | User Story | Prioritas |
|----|-----------|:---------:|
| US-016 | Sebagai **user**, saya ingin beralih antara mode gelap (dark) dan terang (light), agar saya bisa bekerja nyaman sesuai preferensi dan kondisi pencahayaan. | 🟡 |
| US-017 | Sebagai **user**, saya ingin memilih opsi "System" yang mengikuti pengaturan OS, agar tema otomatis menyesuaikan. | 🟡 |
| US-018 | Sebagai **user**, saya ingin memilih accent color custom, agar tampilan aplikasi terasa personal. | 🟢 |
| US-019 | Sebagai **user**, saya ingin preferensi tema tersimpan dan tetap ada saat refresh/login ulang, agar saya tidak perlu mengatur ulang. | 🟡 |

### #10 Archive & Trash

| ID | User Story | Prioritas |
|----|-----------|:---------:|
| US-020 | Sebagai **user**, saya ingin meng-archive card/list/board yang sudah tidak aktif, agar board tetap bersih tanpa kehilangan data. | 🟠 |
| US-021 | Sebagai **user**, saya ingin me-restore item dari archive, agar saya bisa mengembalikan item yang ternyata masih dibutuhkan. | 🟠 |
| US-022 | Sebagai **user**, saya ingin item yang dihapus masuk ke Trash terlebih dahulu, agar saya punya kesempatan untuk membatalkan penghapusan. | 🟠 |
| US-023 | Sebagai **user**, saya ingin item di Trash otomatis terhapus permanen setelah 30 hari, agar storage tidak membengkak. | 🟡 |

---

## Phase 2 — Core Features

### #04 Authentication & JWT

| ID | User Story | Prioritas |
|----|-----------|:---------:|
| US-024 | Sebagai **visitor**, saya ingin mendaftarkan akun baru dengan email dan password, agar saya bisa mulai menggunakan Flux. | 🔴 |
| US-025 | Sebagai **user**, saya ingin login dengan email dan password, agar saya bisa mengakses board dan data saya. | 🔴 |
| US-026 | Sebagai **user**, saya ingin sesi saya tetap aktif (JWT/cookie), agar saya tidak perlu login ulang setiap membuka aplikasi. | 🔴 |
| US-027 | Sebagai **developer**, saya ingin route API yang sensitif dilindungi middleware auth, agar data user aman dari akses tidak sah. | 🔴 |

### #07 Workspaces & Board Privacy

| ID | User Story | Prioritas |
|----|-----------|:---------:|
| US-028 | Sebagai **user**, saya ingin membuat workspace untuk mengelompokkan board, agar proyek-proyek saya terorganisir. | 🔴 |
| US-029 | Sebagai **user**, saya ingin mengatur visibilitas board (public/private/workspace-only), agar saya bisa mengontrol siapa yang bisa melihat board. | 🔴 |
| US-030 | Sebagai **user**, saya ingin mengundang anggota ke workspace, agar tim bisa berkolaborasi dalam satu ruang kerja. | 🔴 |

### #18 Collaboration & Roles

| ID | User Story | Prioritas |
|----|-----------|:---------:|
| US-031 | Sebagai **admin**, saya ingin mengundang member ke board dengan role tertentu (Admin/Observer), agar hak akses bisa dikontrol. | 🔴 |
| US-032 | Sebagai **admin**, saya ingin Observer hanya bisa melihat (read-only) tanpa bisa mengedit, agar data terlindungi dari perubahan yang tidak diinginkan. | 🔴 |
| US-033 | Sebagai **user**, saya ingin meng-assign card ke anggota tim, agar jelas siapa yang bertanggung jawab atas tugas tersebut. | 🟠 |
| US-034 | Sebagai **user**, saya ingin melihat avatar assignee di setiap card, agar saya tahu siapa yang mengerjakan tanpa membuka card. | 🟠 |

### #17 Smart Mention & Markdown

| ID | User Story | Prioritas |
|----|-----------|:---------:|
| US-035 | Sebagai **user**, saya ingin menulis deskripsi card dalam format Markdown, agar saya bisa membuat deskripsi yang terstruktur (heading, list, code block). | 🟠 |
| US-036 | Sebagai **user**, saya ingin menyebut (mention) card atau user lain dalam deskripsi, agar referensi antar item mudah di-navigate. | 🟠 |

### #08 Card Labels & Due Dates

| ID | User Story | Prioritas |
|----|-----------|:---------:|
| US-037 | Sebagai **user**, saya ingin menambahkan label berwarna ke card, agar saya bisa mengkategorikan tugas secara visual (bug, feature, urgent). | 🟠 |
| US-038 | Sebagai **user**, saya ingin menetapkan tanggal jatuh tempo (due date) pada card, agar saya tahu deadline setiap tugas. | 🟠 |
| US-039 | Sebagai **user**, saya ingin melihat indikator visual saat card sudah melewati due date (overdue), agar tugas yang terlambat langsung terlihat. | 🟠 |

### #15 Checklists & File Attachments

| ID | User Story | Prioritas |
|----|-----------|:---------:|
| US-040 | Sebagai **user**, saya ingin menambahkan checklist (sub-item) di dalam card, agar saya bisa memecah tugas menjadi langkah-langkah kecil. | 🟠 |
| US-041 | Sebagai **user**, saya ingin melihat progress bar checklist di card preview, agar saya tahu seberapa banyak sub-item yang sudah selesai tanpa membuka card. | 🟠 |
| US-042 | Sebagai **user**, saya ingin mengunggah file (gambar, dokumen) ke card, agar referensi dan aset tersimpan di tempat yang sama dengan tugasnya. | 🟠 |
| US-043 | Sebagai **user**, saya ingin menjadikan gambar sebagai cover card, agar card lebih visual dan mudah dikenali. | 🟡 |

### #16 Activity Log & Comments

| ID | User Story | Prioritas |
|----|-----------|:---------:|
| US-044 | Sebagai **user**, saya ingin menambahkan komentar di card, agar saya bisa berdiskusi tentang tugas dengan tim. | 🟠 |
| US-045 | Sebagai **user**, saya ingin melihat activity log (riwayat perubahan) pada card, agar saya tahu siapa melakukan apa dan kapan. | 🟠 |

### #19 Favorites & Pinned Boards

| ID | User Story | Prioritas |
|----|-----------|:---------:|
| US-046 | Sebagai **user**, saya ingin menandai board sebagai favorit (star), agar board yang sering saya akses mudah ditemukan. | 🟡 |
| US-047 | Sebagai **user**, saya ingin melihat board favorit di section khusus di sidebar, agar akses ke board penting lebih cepat. | 🟡 |

---

## Phase 3 — Productivity

### #41 Search & Filtering

| ID | User Story | Prioritas |
|----|-----------|:---------:|
| US-048 | Sebagai **user**, saya ingin mencari card berdasarkan judul atau deskripsi, agar saya bisa menemukan tugas dengan cepat. | 🟠 |
| US-049 | Sebagai **user**, saya ingin memfilter card di board berdasarkan assignee, label, atau status due date, agar saya bisa fokus pada tugas tertentu. | 🟠 |

### #43 In-App Notifications

| ID | User Story | Prioritas |
|----|-----------|:---------:|
| US-050 | Sebagai **user**, saya ingin menerima notifikasi saat di-assign ke card, agar saya tahu ada tugas baru untuk saya. | 🟠 |
| US-051 | Sebagai **user**, saya ingin menerima notifikasi saat di-mention di komentar, agar saya bisa merespon dengan cepat. | 🟠 |
| US-052 | Sebagai **user**, saya ingin menerima notifikasi saat due date mendekat, agar saya tidak melewatkan deadline. | 🟠 |
| US-053 | Sebagai **user**, saya ingin melihat notifikasi di ikon lonceng (bell) dengan badge jumlah unread, agar saya tahu ada hal yang perlu perhatian. | 🟠 |

### #25 Custom Fields

| ID | User Story | Prioritas |
|----|-----------|:---------:|
| US-054 | Sebagai **admin**, saya ingin membuat custom field (text, number, date, dropdown) di board, agar saya bisa melacak informasi spesifik yang tidak tersedia secara default. | 🟡 |
| US-055 | Sebagai **user**, saya ingin mengisi nilai custom field di setiap card, agar data tambahan tersimpan bersama tugasnya. | 🟡 |

### #42 Multiple Views

| ID | User Story | Prioritas |
|----|-----------|:---------:|
| US-056 | Sebagai **user**, saya ingin melihat data board dalam tampilan **Table** (grid/spreadsheet), agar saya bisa melihat banyak card sekaligus dengan detailnya. | 🟠 |
| US-057 | Sebagai **user**, saya ingin melihat card di tampilan **Calendar** berdasarkan due date, agar saya bisa merencanakan jadwal secara visual. | 🟠 |
| US-058 | Sebagai **user**, saya ingin melihat card di tampilan **Timeline/Gantt**, agar saya bisa memahami durasi dan overlap antar tugas. | 🟡 |

### #46 Keyboard Shortcuts

| ID | User Story | Prioritas |
|----|-----------|:---------:|
| US-059 | Sebagai **power user**, saya ingin menekan `/` untuk langsung fokus ke search bar, agar saya bisa mencari tanpa menggunakan mouse. | 🟡 |
| US-060 | Sebagai **power user**, saya ingin menekan `c` untuk archive card dan `Space` untuk self-assign, agar saya bisa bekerja lebih cepat. | 🟡 |
| US-061 | Sebagai **user**, saya ingin navigasi board menggunakan Tab dan Enter, agar aplikasi accessible bagi pengguna keyboard-only. | 🟡 |

### #47 Command Palette

| ID | User Story | Prioritas |
|----|-----------|:---------:|
| US-062 | Sebagai **power user**, saya ingin menekan `Cmd+K` untuk membuka command palette, agar saya bisa mencari card dan menjalankan aksi dengan cepat. | 🟡 |
| US-063 | Sebagai **user**, saya ingin command palette mendukung fuzzy search, agar saya bisa menemukan item meskipun mengetik sebagian kata. | 🟡 |

### #38 Batch Operations

| ID | User Story | Prioritas |
|----|-----------|:---------:|
| US-064 | Sebagai **user**, saya ingin memilih beberapa card sekaligus (multi-select), agar saya bisa melakukan aksi massal. | 🟡 |
| US-065 | Sebagai **user**, saya ingin memindahkan, memberi label, atau meng-assign beberapa card sekaligus, agar pekerjaan repetitif lebih efisien. | 🟡 |
| US-066 | Sebagai **user**, saya ingin meng-archive atau menghapus beberapa card sekaligus, agar membersihkan board lebih cepat. | 🟡 |

---

## Phase 4 — Agile & Advanced

### #26 Automations

| ID | User Story | Prioritas |
|----|-----------|:---------:|
| US-067 | Sebagai **admin**, saya ingin membuat aturan otomasi (jika card dipindah ke "Done", maka set due date sebagai completed), agar workflow berulang terotomasi. | 🟠 |
| US-068 | Sebagai **admin**, saya ingin membuat trigger berbasis event (card created, moved, assigned), agar aksi otomatis berjalan tanpa intervensi manual. | 🟠 |

### #27 Sprints & Cycles

| ID | User Story | Prioritas |
|----|-----------|:---------:|
| US-069 | Sebagai **project manager**, saya ingin membuat Sprint/Cycle dengan periode waktu tertentu, agar tim bekerja dalam iterasi yang terstruktur. | 🟠 |
| US-070 | Sebagai **project manager**, saya ingin melihat burndown chart per sprint, agar saya bisa memantau progress dan kecepatan tim. | 🟠 |
| US-071 | Sebagai **project manager**, saya ingin melihat Active Sprint view yang hanya menampilkan card dalam sprint berjalan, agar fokus tim terjaga. | 🟠 |

### #28 Epics & Task Hierarchy

| ID | User Story | Prioritas |
|----|-----------|:---------:|
| US-072 | Sebagai **project manager**, saya ingin mengelompokkan card ke dalam Epic, agar inisiatif besar bisa dilacak lintas board. | 🟡 |
| US-073 | Sebagai **project manager**, saya ingin melihat progress Epic otomatis berdasarkan status card-card di dalamnya, agar saya tahu seberapa jauh inisiatif ini berjalan. | 🟡 |

### #11 Issue Estimations

| ID | User Story | Prioritas |
|----|-----------|:---------:|
| US-074 | Sebagai **user**, saya ingin memberikan estimasi story points (Fibonacci: 1, 2, 3, 5, 8, 13) pada card, agar kompleksitas tugas bisa diukur. | 🟡 |
| US-075 | Sebagai **project manager**, saya ingin melihat total story points per kolom/list, agar saya bisa menilai beban kerja setiap tahapan. | 🟡 |

### #50 Card Dependencies

| ID | User Story | Prioritas |
|----|-----------|:---------:|
| US-076 | Sebagai **user**, saya ingin menandai card A sebagai "blocking" card B, agar urutan pengerjaan jelas. | 🟡 |
| US-077 | Sebagai **user**, saya ingin melihat indikator visual "blocked" pada card yang memiliki dependensi belum selesai, agar saya tahu card mana yang belum bisa dikerjakan. | 🟡 |
| US-078 | Sebagai **user**, saya ingin melihat garis dependensi di Timeline view, agar hubungan antar tugas terlihat secara visual. | 🟡 |
| US-079 | Sebagai **user**, saya ingin mendapat warning saat mencoba memindahkan card yang masih blocked, agar saya tidak melewatkan dependensi. | 🟡 |

### #12 Sub-tasks (Nested Cards)

| ID | User Story | Prioritas |
|----|-----------|:---------:|
| US-080 | Sebagai **user**, saya ingin membuat sub-task (child card) di dalam sebuah card, agar tugas kompleks bisa dipecah lebih detail dari sekadar checklist. | 🟡 |
| US-081 | Sebagai **user**, saya ingin sub-task memiliki assignee, due date, dan label sendiri, agar setiap sub-task bisa dikelola secara independen. | 🟡 |
| US-082 | Sebagai **user**, saya ingin melihat progress sub-tasks (misal "3/5") di card preview, agar saya tahu status tanpa membuka card detail. | 🟡 |

### #29 Recurring Tasks

| ID | User Story | Prioritas |
|----|-----------|:---------:|
| US-083 | Sebagai **user**, saya ingin membuat card yang berulang secara otomatis (harian/mingguan/bulanan), agar tugas rutin tidak perlu dibuat manual setiap kali. | 🟡 |
| US-084 | Sebagai **user**, saya ingin melihat badge "recurring" pada card yang dihasilkan otomatis, agar saya bisa membedakan dari card biasa. | 🟡 |

### #54 Dashboard & Analytics

| ID | User Story | Prioritas |
|----|-----------|:---------:|
| US-085 | Sebagai **project manager**, saya ingin melihat dashboard dengan grafik distribusi card per status, agar saya bisa memahami bottleneck. | 🟠 |
| US-086 | Sebagai **project manager**, saya ingin melihat grafik cards per member, agar saya tahu distribusi beban kerja. | 🟠 |
| US-087 | Sebagai **project manager**, saya ingin memfilter data dashboard berdasarkan waktu (minggu/bulan/sprint), agar saya bisa menganalisis tren. | 🟠 |
| US-088 | Sebagai **project manager**, saya ingin melihat summary metrics (total cards, completed, overdue, avg completion time), agar KPI tim bisa dipantau. | 🟠 |

### #56 Workload View

| ID | User Story | Prioritas |
|----|-----------|:---------:|
| US-089 | Sebagai **project manager**, saya ingin melihat workload setiap member dalam bar chart, agar saya bisa mengidentifikasi siapa yang overload. | 🟡 |
| US-090 | Sebagai **project manager**, saya ingin melihat indikator kapasitas berwarna (hijau/biru/merah), agar status beban kerja terlihat sekilas. | 🟡 |

### #52 Approval Workflow

| ID | User Story | Prioritas |
|----|-----------|:---------:|
| US-091 | Sebagai **admin**, saya ingin mengatur aturan approval antar list (misal: "Review" → "Done" butuh approval), agar ada quality gate sebelum card pindah tahap. | 🟡 |
| US-092 | Sebagai **reviewer**, saya ingin menerima notifikasi dan melakukan approve/reject pada card, agar proses review terstruktur. | 🟡 |
| US-093 | Sebagai **user**, saya ingin card tidak bisa dipindahkan tanpa approval yang cukup, agar proses kerja terjaga kualitasnya. | 🟡 |

---

## Phase 5 — Collaboration & Real-time

### #20 Real-time Collaboration

| ID | User Story | Prioritas |
|----|-----------|:---------:|
| US-094 | Sebagai **user**, saya ingin perubahan yang dilakukan user lain langsung muncul di layar saya tanpa refresh, agar kolaborasi terasa real-time. | 🔴 |
| US-095 | Sebagai **user**, saya ingin melihat siapa saja yang sedang online di board (presence indicator), agar saya tahu siapa yang sedang aktif. | 🟡 |
| US-096 | Sebagai **user**, saya ingin koneksi WebSocket otomatis reconnect jika terputus, agar pengalaman tidak terganggu oleh masalah jaringan sesaat. | 🟠 |

### #21 Time Tracking

| ID | User Story | Prioritas |
|----|-----------|:---------:|
| US-097 | Sebagai **user**, saya ingin memulai/menghentikan timer pada sebuah card, agar waktu kerja tercatat secara akurat. | 🟡 |
| US-098 | Sebagai **user**, saya ingin menginput waktu secara manual, agar saya bisa mencatat waktu yang lupa di-track. | 🟡 |
| US-099 | Sebagai **project manager**, saya ingin melihat total waktu per card dan per member, agar estimasi project lebih akurat di kemudian hari. | 🟡 |

### #45 In-App Chat

| ID | User Story | Prioritas |
|----|-----------|:---------:|
| US-100 | Sebagai **user**, saya ingin mengirim pesan langsung (DM) ke anggota tim di dalam aplikasi, agar komunikasi tidak perlu pindah ke tools lain. | 🟡 |
| US-101 | Sebagai **user**, saya ingin membuat group chat per board atau custom, agar diskusi per konteks bisa terpisah. | 🟡 |
| US-102 | Sebagai **user**, saya ingin mention user (@nama) dan link card (#card) dalam chat, agar referensi mudah di-navigate. | 🟡 |

### #49 Advanced Checklists

| ID | User Story | Prioritas |
|----|-----------|:---------:|
| US-103 | Sebagai **user**, saya ingin meng-assign checklist item ke anggota tim, agar setiap sub-item punya penanggung jawab. | 🟡 |
| US-104 | Sebagai **user**, saya ingin menambahkan due date ke checklist item, agar deadline sub-item bisa dilacak. | 🟡 |

### #22 Voting System

| ID | User Story | Prioritas |
|----|-----------|:---------:|
| US-105 | Sebagai **user**, saya ingin memberikan vote (upvote/downvote) pada card, agar tim bisa memprioritaskan berdasarkan voting. | 🟢 |
| US-106 | Sebagai **user**, saya ingin mengurutkan card berdasarkan jumlah vote, agar card yang paling banyak didukung terlihat di atas. | 🟢 |

---

## Phase 6 — Content & Integrations

### #48 Rich Document Editor

| ID | User Story | Prioritas |
|----|-----------|:---------:|
| US-107 | Sebagai **user**, saya ingin menulis deskripsi card dengan editor blok ala Notion (heading, list, code, image), agar deskripsi lebih kaya dan terstruktur. | 🟠 |
| US-108 | Sebagai **user**, saya ingin menggunakan slash command (`/`) di editor untuk menyisipkan blok, agar penulisan lebih cepat. | 🟠 |

### #30 Board Templates & Cloning

| ID | User Story | Prioritas |
|----|-----------|:---------:|
| US-109 | Sebagai **user**, saya ingin membuat board dari template yang sudah tersedia (Agile Sprint, Marketing, CRM), agar saya bisa mulai dengan cepat tanpa setup dari nol. | 🟡 |
| US-110 | Sebagai **user**, saya ingin menduplikasi/clone board beserta seluruh list dan card, agar saya bisa membuat salinan board untuk project baru. | 🟡 |

### #31 Integrations & Webhooks

| ID | User Story | Prioritas |
|----|-----------|:---------:|
| US-111 | Sebagai **developer**, saya ingin membuat Personal Access Token untuk mengakses API secara programmatic, agar saya bisa mengintegrasikan Flux dengan tools lain. | 🟡 |
| US-112 | Sebagai **admin**, saya ingin mengatur webhook yang mengirim POST request ke URL tertentu saat event terjadi (card created, moved), agar sistem eksternal bisa bereaksi. | 🟡 |

### #36 Card Covers & Board Backgrounds

| ID | User Story | Prioritas |
|----|-----------|:---------:|
| US-113 | Sebagai **user**, saya ingin mengatur background board menggunakan gambar dari Unsplash, agar board terlihat menarik dan personal. | 🟡 |
| US-114 | Sebagai **user**, saya ingin menambahkan cover color/image ke card, agar card penting lebih mencolok secara visual. | 🟡 |

### #53 GitHub Automation

| ID | User Story | Prioritas |
|----|-----------|:---------:|
| US-115 | Sebagai **developer**, saya ingin card otomatis pindah ke "In Progress" saat branch terkait dibuat di GitHub, agar board selalu sinkron dengan aktivitas coding. | 🟡 |
| US-116 | Sebagai **developer**, saya ingin card otomatis pindah ke "Done" saat PR di-merge, agar status card terupdate tanpa manual. | 🟡 |

### #57 Embeds

| ID | User Story | Prioritas |
|----|-----------|:---------:|
| US-117 | Sebagai **user**, saya ingin paste URL YouTube di deskripsi card dan otomatis menjadi embedded video, agar referensi visual bisa dilihat langsung. | 🟡 |
| US-118 | Sebagai **designer**, saya ingin paste URL Figma di card dan otomatis menampilkan preview design, agar tim bisa review tanpa membuka tab baru. | 🟡 |

### #35 Goals & OKRs

| ID | User Story | Prioritas |
|----|-----------|:---------:|
| US-119 | Sebagai **leader**, saya ingin membuat Objective dengan Key Results, agar strategi bisnis bisa dilacak secara terstruktur. | 🟡 |
| US-120 | Sebagai **leader**, saya ingin me-link card ke Key Result, agar progress OKR otomatis terupdate berdasarkan penyelesaian tugas. | 🟡 |

### #55 Changelog & Release Notes

| ID | User Story | Prioritas |
|----|-----------|:---------:|
| US-121 | Sebagai **project manager**, saya ingin men-generate release notes dari card yang sudah completed, agar changelog terdokumentasi dengan rapi. | 🟢 |
| US-122 | Sebagai **stakeholder**, saya ingin melihat halaman changelog publik, agar saya bisa mengikuti perkembangan project. | 🟢 |

---

## Phase 7 — Enterprise & Security

### #23 Admin Controls & Security

| ID | User Story | Prioritas |
|----|-----------|:---------:|
| US-123 | Sebagai **super admin**, saya ingin mengelola semua user (activate, deactivate, reset password), agar kontrol akses terpusat. | 🟠 |
| US-124 | Sebagai **user**, saya ingin meng-export data board ke JSON atau CSV, agar saya punya backup data atau bisa memproses data di luar Flux. | 🟠 |
| US-125 | Sebagai **admin**, saya ingin rate limiting pada API, agar sistem terlindungi dari abuse dan DDoS. | 🟠 |

### #14 2FA & SSO

| ID | User Story | Prioritas |
|----|-----------|:---------:|
| US-126 | Sebagai **user**, saya ingin mengaktifkan 2FA (Google Authenticator), agar akun saya lebih aman. | 🟠 |
| US-127 | Sebagai **user**, saya ingin login menggunakan akun Google, agar proses login lebih cepat dan mudah. | 🟠 |
| US-128 | Sebagai **user**, saya ingin login menggunakan akun GitHub, agar saya bisa langsung masuk tanpa registrasi manual. | 🟠 |
| US-129 | Sebagai **user**, saya ingin login menggunakan akun Facebook, agar saya punya lebih banyak opsi login. | 🟡 |
| US-130 | Sebagai **user**, saya ingin mendapatkan recovery codes saat setup 2FA, agar saya bisa login meskipun kehilangan perangkat authenticator. | 🟠 |

### #40 White-labeling

| ID | User Story | Prioritas |
|----|-----------|:---------:|
| US-131 | Sebagai **enterprise admin**, saya ingin mengganti logo dan nama aplikasi, agar Flux terlihat seperti tools internal perusahaan. | 🟢 |
| US-132 | Sebagai **enterprise admin**, saya ingin memetakan custom domain ke workspace, agar user mengakses lewat domain perusahaan. | 🟢 |

### #13 API Documentation

| ID | User Story | Prioritas |
|----|-----------|:---------:|
| US-133 | Sebagai **developer**, saya ingin membaca dokumentasi API yang lengkap di `/api/docs`, agar saya bisa mengintegrasikan sistem eksternal dengan Flux. | 🟡 |
| US-134 | Sebagai **developer**, saya ingin mencoba API langsung dari Swagger UI, agar saya bisa test endpoint tanpa tools tambahan. | 🟡 |

### #24 Multi-language (i18n)

| ID | User Story | Prioritas |
|----|-----------|:---------:|
| US-135 | Sebagai **user**, saya ingin menggunakan aplikasi dalam Bahasa Indonesia, agar lebih nyaman bagi yang tidak fasih berbahasa Inggris. | 🟡 |
| US-136 | Sebagai **user**, saya ingin mengubah bahasa di settings dan preferensi tersimpan, agar saya tidak perlu mengatur ulang setiap login. | 🟡 |

---

## Phase 8 — Platform & AI

### #37 PWA & Offline Mode

| ID | User Story | Prioritas |
|----|-----------|:---------:|
| US-137 | Sebagai **user**, saya ingin meng-install Flux sebagai aplikasi di perangkat saya (PWA), agar bisa diakses seperti native app. | 🟠 |
| US-138 | Sebagai **user**, saya ingin tetap bisa melihat dan mengedit board saat offline, agar pekerjaan tidak terhenti oleh koneksi internet. | 🟠 |
| US-139 | Sebagai **user**, saya ingin perubahan saat offline otomatis tersinkronisasi saat koneksi kembali, agar data tidak hilang. | 🟠 |

### #39 AI Smart Suggestions

| ID | User Story | Prioritas |
|----|-----------|:---------:|
| US-140 | Sebagai **user**, saya ingin AI menyarankan label yang sesuai berdasarkan judul dan deskripsi card, agar pengkategorian lebih cepat. | 🟡 |
| US-141 | Sebagai **user**, saya ingin AI meringkas activity log dan comments menjadi summary, agar saya bisa memahami konteks card dengan cepat. | 🟡 |
| US-142 | Sebagai **project manager**, saya ingin AI menyarankan assignee berdasarkan workload dan history, agar distribusi tugas lebih optimal. | 🟡 |

### #44 Email-to-Board

| ID | User Story | Prioritas |
|----|-----------|:---------:|
| US-143 | Sebagai **user**, saya ingin mengirim email ke alamat khusus board dan otomatis menjadi card baru, agar saya bisa membuat tugas dari email tanpa membuka aplikasi. | 🟢 |
| US-144 | Sebagai **user**, saya ingin subject email menjadi judul card dan body menjadi deskripsi, agar informasi ter-mapping dengan benar. | 🟢 |

### #32 Import dari Trello/Jira

| ID | User Story | Prioritas |
|----|-----------|:---------:|
| US-145 | Sebagai **user baru**, saya ingin meng-import data dari Trello (JSON export), agar saya bisa migrasi ke Flux tanpa kehilangan data. | 🟡 |
| US-146 | Sebagai **user baru**, saya ingin meng-import data dari Jira (CSV export), agar transisi ke Flux berjalan mulus. | 🟡 |
| US-147 | Sebagai **user**, saya ingin melihat preview data sebelum konfirmasi import, agar saya bisa memastikan mapping data benar. | 🟡 |

### #33 Public Forms

| ID | User Story | Prioritas |
|----|-----------|:---------:|
| US-148 | Sebagai **admin**, saya ingin membuat form publik yang terhubung ke board, agar pihak eksternal bisa submit request tanpa akun Flux. | 🟢 |
| US-149 | Sebagai **external user**, saya ingin mengisi form dan submit, agar request saya tercatat sebagai card di board yang ditentukan. | 🟢 |

### #34 Card Mirroring

| ID | User Story | Prioritas |
|----|-----------|:---------:|
| US-150 | Sebagai **user**, saya ingin menampilkan satu card di beberapa board (mirror), agar card lintas-project bisa dilacak dari masing-masing board. | 🟢 |
| US-151 | Sebagai **user**, saya ingin perubahan di card asli otomatis terefleksi di semua mirror, agar data selalu konsisten. | 🟢 |

### #51 Map View

| ID | User Story | Prioritas |
|----|-----------|:---------:|
| US-152 | Sebagai **field team member**, saya ingin melihat card di tampilan peta berdasarkan lokasi, agar tugas berbasis lokasi mudah dikelola. | 🟢 |
| US-153 | Sebagai **user**, saya ingin menambahkan lokasi ke card via search atau klik peta, agar card bisa ditampilkan di Map View. | 🟢 |

---

## Phase 9 — DevOps

### #58 CI/CD Pipeline

| ID | User Story | Prioritas |
|----|-----------|:---------:|
| US-154 | Sebagai **developer**, saya ingin setiap push otomatis menjalankan build dan test, agar bug terdeteksi sebelum merge. | 🟠 |
| US-155 | Sebagai **developer**, saya ingin PR menampilkan status CI (pass/fail), agar saya tahu apakah code aman untuk di-merge. | 🟠 |
| US-156 | Sebagai **developer**, saya ingin merge ke `main` otomatis men-trigger deployment, agar proses release tidak manual. | 🟠 |

### #59 Docker & Docker Compose

| ID | User Story | Prioritas |
|----|-----------|:---------:|
| US-157 | Sebagai **developer baru**, saya ingin menjalankan `docker compose up` dan seluruh stack (frontend, backend, database) langsung berjalan, agar onboarding cepat tanpa setup manual. | 🟠 |
| US-158 | Sebagai **developer**, saya ingin hot-reload berfungsi di Docker development mode, agar saya bisa edit code dan langsung melihat hasilnya tanpa rebuild. | 🟠 |
| US-159 | Sebagai **DevOps engineer**, saya ingin Docker image production berukuran minimal (multi-stage build), agar deployment lebih cepat dan hemat resource. | 🟡 |

---

## Ringkasan

| Metrik | Jumlah |
|--------|:------:|
| **Total User Stories** | 159 |
| 🔴 Critical | 18 |
| 🟠 High | 52 |
| 🟡 Medium | 66 |
| 🟢 Low | 23 |
| **Total Issues** | 59 |
| **Total Phases** | 9 |

---

> *Dokumen ini adalah living document dan akan diupdate seiring perkembangan project Flux.*
