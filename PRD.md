# 📄 Product Requirements Document (PRD)

## **Flux** — Modern Project Management & Kanban Board

| Field | Detail |
|-------|--------|
| **Nama Produk** | Flux |
| **Versi Dokumen** | 1.0 |
| **Tanggal** | 14 Juni 2026 |
| **Status** | Draft |

---

## 1. Executive Summary

**Flux** adalah aplikasi manajemen proyek berbasis Kanban Board yang modern, powerful, dan kolaboratif — dirancang untuk menggantikan kebutuhan tim terhadap tools seperti Trello, Linear, dan Jira dalam satu platform terintegrasi.

Flux menggabungkan kesederhanaan visual Kanban dengan fitur-fitur enterprise seperti automasi, multiple views, sprint management, real-time collaboration, dan AI-powered suggestions — semuanya dalam interface yang cepat, responsif, dan bisa diakses secara offline (PWA).

---

## 2. Product Vision

> *"Menjadi platform manajemen proyek all-in-one yang intuitif, cepat, dan cerdas — memberdayakan tim dari skala kecil hingga enterprise untuk mengorganisir, melacak, dan menyelesaikan pekerjaan dengan efisien."*

### 2.1 Tujuan Utama

1. **Simplicity** — Onboarding dalam hitungan menit, tanpa training khusus.
2. **Speed** — Performa tinggi dengan optimistic updates dan offline-first architecture.
3. **Flexibility** — Mendukung berbagai metodologi (Kanban, Scrum, Custom Workflow).
4. **Collaboration** — Real-time sync, comments, mentions, dan notifications.
5. **Intelligence** — AI-assisted task management untuk produktivitas lebih tinggi.

### 2.2 Problem Statement

| Masalah | Solusi Flux |
|---------|------------|
| Trello terlalu sederhana untuk tim besar | Multiple views, sprints, epics, custom fields |
| Jira terlalu kompleks dan lambat | Interface ringan, performa tinggi dengan Bun runtime |
| Butuh banyak tools terpisah (PM + Chat + Docs) | All-in-one: kanban + rich editor + chat + analytics |
| Setup dan deploy ribet | Docker Compose satu perintah, PWA tanpa install |
| Tidak ada automation | Rule-based engine (If-This-Then-That) |

---

## 3. Target Users

### 3.1 User Personas

#### 👩‍💻 Persona 1: Developer / Software Engineer
- **Kebutuhan**: Sprint planning, GitHub integration, keyboard shortcuts, command palette
- **Pain Point**: Tools PM yang lambat dan mengganggu flow coding
- **Fitur Kunci**: #05 Drag & Drop, #20 Keyboard Shortcuts, #27 Command Palette, #30 GitHub Automation

#### 👨‍💼 Persona 2: Project Manager
- **Kebutuhan**: Overview proyek, timeline, workload management, reporting
- **Pain Point**: Sulit melacak progress dan distribusi kerja tim
- **Fitur Kunci**: #16 Multiple Views, #28 Sprints, #29 Epics, #38 Dashboard & Analytics, #45 Workload View

#### 👩‍🎨 Persona 3: Designer / Creative Team
- **Kebutuhan**: Visual board, file attachments, embed Figma
- **Pain Point**: Kolaborasi visual yang terbatas di tools existing
- **Fitur Kunci**: #11 Attachments, #22 Card Covers, #51 Embeds, #31 Rich Editor

#### 🏢 Persona 4: Enterprise Admin
- **Kebutuhan**: Security, SSO, audit log, white-labeling
- **Pain Point**: Compliance dan kontrol akses yang ketat
- **Fitur Kunci**: #21 Admin Security, #49 2FA & SSO, #55 White-labeling, #46 Approval Workflow

### 3.2 Target Market

| Segment | Ukuran Tim | Tier |
|---------|-----------|------|
| Freelancer / Solo | 1 orang | Free |
| Startup / Small Team | 2–15 orang | Pro |
| Medium Business | 15–100 orang | Business |
| Enterprise | 100+ orang | Enterprise |

---

## 4. Tech Stack

### 4.1 Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                      Client (Browser)                    │
│  ┌─────────────────────────────────────────────────┐    │
│  │  React + TypeScript + Vite                       │    │
│  │  ├── TailwindCSS + DaisyUI (Styling)            │    │
│  │  ├── Zustand (State Management)                  │    │
│  │  ├── @dnd-kit (Drag & Drop)                      │    │
│  │  ├── TipTap / Lexical (Rich Text Editor)         │    │
│  │  └── PWA + IndexedDB (Offline Support)           │    │
│  └──────────────────────┬──────────────────────────┘    │
│                         │ REST API + WebSocket           │
└─────────────────────────┼───────────────────────────────┘
                          │
┌─────────────────────────┼───────────────────────────────┐
│                    Backend Server                         │
│  ┌──────────────────────┴──────────────────────────┐    │
│  │  Hono Framework (Bun Runtime)                    │    │
│  │  ├── REST API Endpoints                          │    │
│  │  ├── WebSocket Server (Real-time)                │    │
│  │  ├── JWT Authentication + OAuth 2.0              │    │
│  │  ├── Automation Engine                           │    │
│  │  ├── Background Jobs (Cron / Recurring)          │    │
│  │  └── File Upload Handler                         │    │
│  └──────────────────────┬──────────────────────────┘    │
│                         │ Raw SQL (Bun built-in)         │
└─────────────────────────┼───────────────────────────────┘
                          │
┌─────────────────────────┼───────────────────────────────┐
│  ┌──────────────────────┴──────────────────────────┐    │
│  │  PostgreSQL 16                                   │    │
│  │  ├── Boards, Lists, Cards                        │    │
│  │  ├── Users, Workspaces, Roles                    │    │
│  │  ├── Activity Logs, Notifications                │    │
│  │  └── Custom Fields, Automations                  │    │
│  └─────────────────────────────────────────────────┘    │
│                       Database                           │
└─────────────────────────────────────────────────────────┘
```

### 4.2 Technology Choices

| Layer | Teknologi | Justifikasi |
|-------|-----------|-------------|
| **Runtime** | Bun | Performa tinggi, built-in test runner, native TypeScript |
| **Frontend Framework** | React + TypeScript | Ekosistem terbesar, type-safe |
| **Bundler** | Vite | Build cepat, HMR instan |
| **Styling** | TailwindCSS + DaisyUI | Rapid development, konsisten, komponen siap pakai |
| **State Management** | Zustand | Ringan, simple API, no boilerplate |
| **Linter + Formatter** | Biome | All-in-one (menggantikan ESLint + Prettier), 10-100x lebih cepat, zero config. Style: indent space, single quote, semicolons asNeeded |
| **Backend Framework** | Hono | Ultra-ringan, edge-ready, API mirip Express |
| **Database** | PostgreSQL 16 | Reliable, fitur lengkap (JSONB, Full-text search) |
| **Query** | Raw SQL (Bun built-in) | Kontrol penuh, tanpa ORM overhead |
| **Auth** | JWT + OAuth 2.0 | Stateless, scalable |
| **Real-time** | WebSocket (Bun native) | Low-latency, bidirectional |
| **Container** | Docker + Docker Compose | Portabel, konsisten across environments |
| **CI/CD** | GitHub Actions | Terintegrasi dengan repository |

---

## 5. Feature Requirements

### 5.1 Phase 1 — Foundation (MVP)

> **Goal**: Kanban board fungsional dengan CRUD dasar dan drag & drop.

| Issue | Fitur | Prioritas | Estimasi |
|:-----:|-------|:---------:|:--------:|
| #01 | Project Setup (Frontend + Backend) | 🔴 Critical | 1 hari |
| #02 | Database Schema & Connection | 🔴 Critical | 1 hari |
| #03 | Backend API Endpoints (CRUD) | 🔴 Critical | 2 hari |
| #04 | Kanban UI (Static & State) | 🔴 Critical | 2 hari |
| #05 | Drag and Drop (dnd-kit) | 🔴 Critical | 2 hari |
| #37 | Dark Mode & Theming | 🟡 Medium | 1 hari |
| #42 | Archive & Trash | 🟠 High | 1 hari |

**Deliverable**: User bisa membuat board, menambah/mengedit/menghapus list dan card, serta drag & drop card antar kolom.

---

### 5.2 Phase 2 — Core Features

> **Goal**: Autentikasi, kolaborasi tim, dan fitur card yang kaya.

| Issue | Fitur | Prioritas | Estimasi |
|:-----:|-------|:---------:|:--------:|
| #07 | Authentication & JWT | 🔴 Critical | 2 hari |
| #08 | Workspaces & Board Privacy | 🔴 Critical | 2 hari |
| #09 | Collaboration & Roles (RBAC) | 🔴 Critical | 2 hari |
| #06 | Smart Mention & Markdown | 🟠 High | 1 hari |
| #10 | Card Labels & Due Dates | 🟠 High | 1 hari |
| #11 | Checklists & File Attachments | 🟠 High | 2 hari |
| #12 | Activity Log & Comments | 🟠 High | 2 hari |
| #41 | Favorites & Pinned Boards | 🟡 Medium | 0.5 hari |

**Deliverable**: Multi-user system dengan workspace, role-based access, dan card yang kaya fitur (labels, dates, checklists, comments, attachments).

---

### 5.3 Phase 3 — Productivity

> **Goal**: Search, notifikasi, custom fields, dan multiple views.

| Issue | Fitur | Prioritas | Estimasi |
|:-----:|-------|:---------:|:--------:|
| #13 | Search & Filtering | 🟠 High | 1 hari |
| #14 | In-App Notifications | 🟠 High | 2 hari |
| #15 | Custom Fields | 🟡 Medium | 2 hari |
| #16 | Multiple Views (Table, Calendar, Timeline) | 🟠 High | 3 hari |
| #20 | Keyboard Shortcuts & Accessibility | 🟡 Medium | 1 hari |
| #27 | Command Palette (Cmd+K) | 🟡 Medium | 1 hari |
| #39 | Batch Operations | 🟡 Medium | 1 hari |

**Deliverable**: Pengalaman produktivitas yang lengkap — cari apapun, navigasi cepat, dan lihat data dalam berbagai format.

---

### 5.4 Phase 4 — Agile & Advanced

> **Goal**: Sprint management, automasi, dan fitur project management lanjutan.

| Issue | Fitur | Prioritas | Estimasi |
|:-----:|-------|:---------:|:--------:|
| #17 | Automations (Rule-based Engine) | 🟠 High | 3 hari |
| #28 | Sprints & Cycles | 🟠 High | 2 hari |
| #29 | Epics & Task Hierarchy | 🟡 Medium | 2 hari |
| #32 | Issue Estimations (Story Points) | 🟡 Medium | 1 hari |
| #36 | Card Dependencies | 🟡 Medium | 2 hari |
| #40 | Sub-tasks (Nested Cards) | 🟡 Medium | 1 hari |
| #35 | Recurring Tasks | 🟡 Medium | 1 hari |
| #38 | Dashboard & Analytics | 🟠 High | 2 hari |
| #45 | Workload View | 🟡 Medium | 1 hari |
| #46 | Approval Workflow | 🟡 Medium | 2 hari |

**Deliverable**: Full agile workflow — sprint planning, velocity tracking, epics, story points, dan dashboard analytics.

---

### 5.5 Phase 5 — Collaboration & Real-time

> **Goal**: Real-time sync, chat, dan notifikasi canggih.

| Issue | Fitur | Prioritas | Estimasi |
|:-----:|-------|:---------:|:--------:|
| #33 | Real-time Collaboration (WebSocket) | 🔴 Critical | 3 hari |
| #34 | Time Tracking | 🟡 Medium | 2 hari |
| #53 | In-App Chat | 🟡 Medium | 3 hari |
| #24 | Advanced Checklists | 🟡 Medium | 1 hari |
| #26 | Voting System | 🟢 Low | 1 hari |

**Deliverable**: Kolaborasi real-time — perubahan instan antar user, chat terintegrasi, dan time tracking.

---

### 5.6 Phase 6 — Content & Integrations

> **Goal**: Rich editor, integrasi eksternal, dan template.

| Issue | Fitur | Prioritas | Estimasi |
|:-----:|-------|:---------:|:--------:|
| #31 | Rich Document Editor (Block-based) | 🟠 High | 3 hari |
| #18 | Board Templates & Cloning | 🟡 Medium | 1 hari |
| #19 | Integrations & Webhooks | 🟡 Medium | 2 hari |
| #22 | Card Covers & Board Backgrounds | 🟡 Medium | 1 hari |
| #30 | GitHub Automation | 🟡 Medium | 2 hari |
| #51 | Embeds (External Content) | 🟡 Medium | 1 hari |
| #52 | Goals & OKRs | 🟡 Medium | 2 hari |
| #57 | Changelog & Release Notes | 🟢 Low | 1 hari |

**Deliverable**: Editor kaya konten ala Notion, integrasi GitHub, webhook system, dan board templates.

---

### 5.7 Phase 7 — Enterprise & Security

> **Goal**: Fitur enterprise-grade — security, admin, SSO, dan compliance.

| Issue | Fitur | Prioritas | Estimasi |
|:-----:|-------|:---------:|:--------:|
| #21 | Admin Controls, Security & Export | 🟠 High | 2 hari |
| #49 | 2FA & SSO (Google, GitHub, Facebook) | 🟠 High | 2 hari |
| #55 | White-labeling | 🟢 Low | 2 hari |
| #54 | API Documentation (OpenAPI) | 🟡 Medium | 1 hari |
| #47 | Multi-language (i18n) | 🟡 Medium | 2 hari |

**Deliverable**: Enterprise-ready — SSO, 2FA, admin dashboard, data export, API docs, dan multi-bahasa.

---

### 5.8 Phase 8 — Platform & AI

> **Goal**: PWA, offline mode, AI, dan fitur platform lanjutan.

| Issue | Fitur | Prioritas | Estimasi |
|:-----:|-------|:---------:|:--------:|
| #25 | PWA & Offline Mode | 🟠 High | 3 hari |
| #48 | AI Smart Suggestions | 🟡 Medium | 3 hari |
| #23 | Email-to-Board | 🟢 Low | 2 hari |
| #43 | Import dari Trello/Jira | 🟡 Medium | 2 hari |
| #44 | Public Forms | 🟢 Low | 1 hari |
| #50 | Card Mirroring | 🟢 Low | 1 hari |
| #56 | Map View | 🟢 Low | 1 hari |

**Deliverable**: Aplikasi bisa diakses offline, AI membantu produktivitas, dan migrasi mudah dari tools lain.

---

### 5.9 Phase 9 — DevOps

> **Goal**: Infrastructure otomatis dan reliable.

| Issue | Fitur | Prioritas | Estimasi |
|:-----:|-------|:---------:|:--------:|
| #58 | CI/CD Pipeline (GitHub Actions) | 🟠 High | 1 hari |
| #59 | Docker & Docker Compose Setup | 🟠 High | 1 hari |

**Deliverable**: Pipeline CI/CD otomatis dan deployment via Docker.

---

## 6. Database Schema (High-Level)

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│    users      │     │  workspaces  │     │    boards     │
├──────────────┤     ├──────────────┤     ├──────────────┤
│ id           │     │ id           │     │ id           │
│ email        │◄───┐│ name         │◄───┐│ title        │
│ password_hash│    ││ owner_id ────┘    ││ workspace_id─┘
│ avatar_url   │    │└──────────────┘    │├──────────────┤
│ created_at   │    │                     ││ visibility   │
└──────┬───────┘    │ ┌──────────────┐    ││ background   │
       │            │ │  members     │    ││ created_at   │
       │            │ ├──────────────┤    │└──────┬───────┘
       │            ├─│ user_id      │    │       │
       │            │ │ workspace_id─┘    │       │
       │            │ │ role         │    │  ┌────┴───────┐
       │            │ └──────────────┘    │  │   lists     │
       │            │                     │  ├────────────┤
       │            │                     │  │ id         │
       │            │                     │  │ board_id───┘
       │            │                     │  │ title      │
       │            │                     │  │ position   │
       │            │                     │  └────┬───────┘
       │            │                     │       │
       │            │                ┌────┴───────┴──┐
       │            │                │    cards       │
       │            │                ├───────────────┤
       │            │                │ id            │
       │            │                │ list_id       │
       │            │                │ title         │
       │            │                │ description   │
       │            │                │ position      │
       │            │                │ due_date      │
       │            │                │ assignee_id───┤
       │            │                │ parent_card_id│
       │            │                │ story_points  │
       │            │                │ archived_at   │
       │            │                │ created_at    │
       │            │                └───────────────┘
       │            │
       │            │  ┌───────────────────────────────────┐
       │            │  │ Tabel Pendukung                    │
       │            │  ├───────────────────────────────────┤
       │            │  │ labels, card_labels                │
       │            │  │ checklists, checklist_items        │
       │            │  │ comments, activity_logs            │
       │            │  │ attachments, notifications         │
       │            │  │ custom_fields, custom_field_values │
       │            │  │ automations, automation_rules      │
       │            │  │ sprints, epics, goal_card_links    │
       │            │  │ card_dependencies, card_mirrors    │
       │            │  │ time_logs, recurring_rules         │
       │            │  │ user_favorites, approval_votes     │
       │            │  │ chat_channels, chat_messages       │
       │            │  │ board_forms, releases              │
       │            │  │ workspace_branding                 │
       │            │  └───────────────────────────────────┘
       │            │
       └────────────┘
```

---

## 7. Non-Functional Requirements

### 7.1 Performance

| Metrik | Target |
|--------|--------|
| First Contentful Paint (FCP) | < 1.5 detik |
| Time to Interactive (TTI) | < 3 detik |
| API Response Time (p95) | < 200ms |
| WebSocket Latency | < 100ms |
| Lighthouse Score | > 90 |
| Concurrent Users per Instance | 500+ |

### 7.2 Security

| Requirement | Implementasi |
|-------------|-------------|
| Authentication | JWT + OAuth 2.0 (Google, GitHub, Facebook) |
| Authorization | Role-Based Access Control (RBAC) |
| 2FA | TOTP (Google Authenticator compatible) |
| Data in Transit | HTTPS / WSS |
| Data at Rest | PostgreSQL encryption |
| Input Validation | Server-side validation semua endpoint |
| Rate Limiting | Per-IP dan per-user rate limiting |
| CORS | Whitelist origin yang diizinkan |
| XSS Prevention | Content Security Policy + sanitize input |
| SQL Injection | Parameterized queries (prepared statements) |

### 7.3 Scalability

| Aspek | Strategi |
|-------|---------|
| Horizontal Scaling | Stateless backend, bisa multi-instance |
| Database | Connection pooling, indexing, query optimization |
| File Storage | S3-compatible object storage |
| Caching | In-memory cache untuk hot data |
| CDN | Static assets via CDN |

### 7.4 Reliability

| Aspek | Target |
|-------|--------|
| Uptime | 99.9% |
| Data Backup | Daily automated backup |
| Disaster Recovery | RTO < 1 jam, RPO < 1 jam |
| Offline Support | PWA + IndexedDB queue |

### 7.5 Testing Strategy

| Tipe Test | Tool | Coverage Target |
|-----------|------|:---------------:|
| Unit Test (Backend) | `bun test` | > 80% |
| Unit Test (Frontend) | Vitest + Testing Library | > 70% |
| Integration Test | `bun test` + Test DB | Semua API endpoint |
| E2E Test | Playwright | Critical user flows |
| Methodology | **TDD** (Test-Driven Development) | Backend logic |

---

## 8. Roadmap & Timeline

```
2026
 Q3 (Jul-Sep)                Q4 (Oct-Dec)
 ┌─────────────────────────┐ ┌─────────────────────────┐
 │ Phase 1: Foundation     │ │ Phase 4: Agile          │
 │ Phase 2: Core Features  │ │ Phase 5: Real-time      │
 │ Phase 3: Productivity   │ │ Phase 6: Integrations   │
 └─────────────────────────┘ └─────────────────────────┘

2027
 Q1 (Jan-Mar)                Q2 (Apr-Jun)
 ┌─────────────────────────┐ ┌─────────────────────────┐
 │ Phase 7: Enterprise     │ │ Phase 9: DevOps Polish  │
 │ Phase 8: Platform & AI  │ │ Launch v1.0 🚀          │
 └─────────────────────────┘ └─────────────────────────┘
```

### Milestones

| Milestone | Target | Deliverable |
|-----------|--------|-------------|
| **Alpha** | Akhir Phase 2 | Kanban board + auth + kolaborasi dasar |
| **Beta** | Akhir Phase 5 | Feature-complete, real-time, sprints |
| **RC** | Akhir Phase 8 | Semua fitur, PWA, AI, enterprise |
| **v1.0** | Akhir Phase 9 | Production-ready, CI/CD, Docker |

---

## 9. Success Metrics (KPI)

### 9.1 Product Metrics

| Metrik | Target (6 bulan post-launch) |
|--------|------------------------------|
| Monthly Active Users (MAU) | 1,000+ |
| Daily Active Users (DAU) | 300+ |
| Boards Created | 5,000+ |
| Cards Created | 50,000+ |
| User Retention (30-day) | > 40% |
| NPS Score | > 50 |

### 9.2 Technical Metrics

| Metrik | Target |
|--------|--------|
| Test Coverage | > 80% |
| Build Success Rate | > 95% |
| Deploy Frequency | Daily |
| Mean Time to Recovery | < 1 jam |
| Bug Escape Rate | < 5% |

---

## 10. Competitive Analysis

| Fitur | Trello | Linear | Jira | ClickUp | **Flux** |
|-------|:------:|:------:|:----:|:-------:|:--------:|
| Kanban Board | ✅ | ✅ | ✅ | ✅ | ✅ |
| Multiple Views | ❌ | ✅ | ✅ | ✅ | ✅ |
| Real-time Sync | ✅ | ✅ | ✅ | ✅ | ✅ |
| Sprint Management | ❌ | ✅ | ✅ | ✅ | ✅ |
| Automations | ✅ | ✅ | ✅ | ✅ | ✅ |
| Command Palette | ❌ | ✅ | ❌ | ✅ | ✅ |
| Rich Editor | ❌ | ✅ | ❌ | ✅ | ✅ |
| Offline/PWA | ❌ | ❌ | ❌ | ❌ | ✅ |
| AI Suggestions | ✅ | ✅ | ✅ | ✅ | ✅ |
| Self-hosted | ❌ | ❌ | ✅ | ❌ | ✅ |
| Open Architecture | ❌ | ❌ | ❌ | ❌ | ✅ |
| Time Tracking | ❌ | ❌ | ✅ | ✅ | ✅ |
| In-App Chat | ❌ | ❌ | ❌ | ✅ | ✅ |
| Goals/OKRs | ❌ | ✅ | ✅ | ✅ | ✅ |
| Harga | Freemium | $8/user | $7.75/user | $7/user | **TBD** |

### Keunggulan Kompetitif Flux

1. **Self-hosted & Open** — Full kontrol atas data, bisa di-deploy di infrastruktur sendiri.
2. **Offline-first (PWA)** — Satu-satunya yang mendukung offline mode penuh.
3. **Ultra-fast** — Bun runtime memberikan performa superior.
4. **All-in-one** — Menggabungkan fitur terbaik dari Trello (simplicity), Linear (speed), dan Jira (completeness).
5. **Docker-ready** — Setup dalam hitungan menit dengan `docker compose up`.

---

## 11. Risks & Mitigations

| Risk | Impact | Probability | Mitigation |
|------|:------:|:-----------:|------------|
| Scope creep (59 issues) | 🔴 High | 🟠 Medium | Strict phase-based delivery, MVP first |
| Performance degradation at scale | 🟠 Medium | 🟡 Low | Load testing, database indexing, caching |
| WebSocket complexity | 🟠 Medium | 🟠 Medium | Start with SSE fallback, gradual rollout |
| AI cost (LLM API calls) | 🟡 Low | 🟠 Medium | Rate limiting, caching, optional feature |
| Security vulnerabilities | 🔴 High | 🟡 Low | Security audit, penetration testing, OWASP checklist |
| Browser compatibility | 🟡 Low | 🟡 Low | Target evergreen browsers, progressive enhancement |

---

## 12. Issue Tracker Summary

| Fase | Issues | Total |
|------|--------|:-----:|
| Phase 1 — Foundation | #01, #02, #03, #04, #05, #37, #42 | 7 |
| Phase 2 — Core | #06, #07, #08, #09, #10, #11, #12, #41 | 8 |
| Phase 3 — Productivity | #13, #14, #15, #16, #20, #27, #39 | 7 |
| Phase 4 — Agile | #17, #28, #29, #32, #35, #36, #38, #40, #45, #46 | 10 |
| Phase 5 — Real-time | #24, #26, #33, #34, #53 | 5 |
| Phase 6 — Integrations | #18, #19, #22, #30, #31, #51, #52, #57 | 8 |
| Phase 7 — Enterprise | #21, #47, #49, #54, #55 | 5 |
| Phase 8 — Platform & AI | #23, #25, #43, #44, #48, #50, #56 | 7 |
| Phase 9 — DevOps | #58, #59 | 2 |
| **Total** | | **59** |

---

## Appendix

### A. Glossary

| Term | Definisi |
|------|---------|
| **Board** | Papan proyek yang berisi daftar kolom dan kartu |
| **List** | Kolom vertikal dalam board (misal: To Do, In Progress, Done) |
| **Card** | Unit kerja/tugas individual dalam sebuah list |
| **Epic** | Grup besar yang mencakup banyak card lintas board |
| **Sprint** | Periode waktu tetap (1-4 minggu) untuk mengerjakan sekelompok card |
| **Workspace** | Ruang kerja yang menampung beberapa board dan anggota tim |
| **Automation** | Aturan otomatis: jika trigger terjadi, maka action dieksekusi |
| **PWA** | Progressive Web App — aplikasi web yang bisa diinstall dan bekerja offline |

### B. Referensi

- [Trello](https://trello.com) — Inspirasi Kanban UI
- [Linear](https://linear.app) — Inspirasi speed & keyboard-first UX
- [Jira](https://www.atlassian.com/software/jira) — Inspirasi fitur enterprise
- [Notion](https://notion.so) — Inspirasi rich document editor
- [ClickUp](https://clickup.com) — Inspirasi all-in-one approach

---

> **Dokumen ini adalah living document dan akan diupdate seiring perkembangan project Flux.**
