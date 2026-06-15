# ⚡ Flux

> Modern Project Management & Kanban Board — Built with Bun, React, Hono, and PostgreSQL.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
[![CI](https://github.com/wardix/flux/actions/workflows/ci.yml/badge.svg)](https://github.com/wardix/flux/actions/workflows/ci.yml)

## 🎯 Overview

**Flux** is a modern, all-in-one project management tool inspired by the best of Trello, Linear, and Jira. It combines the simplicity of Kanban boards with powerful features like sprint management, real-time collaboration, automations, and AI-powered suggestions.

## ✨ Features

### 📋 Board & Card Management
- **Kanban Board** — Drag & drop cards across columns with real-time sync
- **Multiple Views** — Kanban, Table, Calendar, Timeline, Map, and Workload views
- **Card Covers & Backgrounds** — Custom colors or Unsplash photos for boards and cards
- **Card Dependencies** — Blocking/blocked-by relations with circular dependency detection
- **Card Mirroring** — Mirror cards across boards with bidirectional sync
- **Subtasks** — Nested cards with full properties (assignee, due date, labels)
- **Custom Fields** — Text, number, date, dropdown, and checkbox field types
- **Batch Operations** — Multi-select cards for bulk move, assign, label, archive, delete

### 🏃 Agile & Planning
- **Sprints** — Sprint planning, tracking, and completion workflows
- **Epics** — Group related cards with progress tracking
- **Goals & OKRs** — Objective → Key Results hierarchy with auto-progress calculation
- **Recurring Tasks** — Daily, weekly, monthly, or custom cron schedules
- **Story Points** — Card estimation for velocity tracking

### ⚡ Real-time & Collaboration
- **WebSocket Updates** — Live board changes across all connected users
- **Presence Indicators** — See who's online on each board
- **Team Chat** — Group and direct messaging with mentions and card links
- **Comments** — Threaded discussions with @mentions and markdown support
- **Activity Logs** — Full audit trail of all card and board changes

### 📊 Analytics & Insights
- **Dashboard** — Cards by status (pie), by member (bar), completion rate, velocity charts
- **Workload View** — Per-member capacity indicators (underload/optimal/overload)
- **Burndown Chart** — Sprint progress visualization
- **Time Tracking** — Start/stop timer and manual time entry per card

### 🤖 Automations & AI
- **Automation Rules** — If-This-Then-That engine (trigger → action)
- **AI Smart Suggestions** — Auto-label, smart assign, and card summarization (OpenAI)
- **Approval Workflow** — Configurable approval rules between lists

### 🔗 Integrations
- **GitHub Integration** — Auto-link branches/PRs to cards, auto-move on PR events
- **Webhooks** — Outbound webhooks with HMAC signing for external integrations
- **Personal Access Tokens** — API authentication for third-party tools
- **Email-to-Board** — Create cards by sending emails to board-specific addresses
- **Import** — Trello (JSON) and Jira (CSV) importers with preview
- **Export** — CSV and JSON data export
- **Embeds** — YouTube, Figma, Google Docs, CodeSandbox, Loom in card descriptions

### 🎨 Customization & UX
- **Dark Mode & Theming** — Dark, light, system modes with custom accent colors
- **White-labeling** — Custom branding (logo, colors, domain, CSS) per workspace
- **Rich Text Editor** — Tiptap block editor with slash commands
- **Command Palette** — Cmd+K for quick navigation and actions
- **Keyboard Shortcuts** — Full keyboard navigation with help modal (`?`)
- **Multi-language (i18n)** — Indonesian and English
- **Public Forms** — Anonymous card submission forms with configurable fields

### 🔐 Security & Administration
- **JWT Authentication** — Secure token-based auth
- **Two-Factor Authentication** — TOTP-based 2FA with recovery codes
- **OAuth SSO** — Login with Google and GitHub
- **Role-Based Access** — Admin, member, and observer roles per board
- **Admin Panel** — User management and system overview
- **Rate Limiting** — API rate limiting middleware

### 📱 Platform
- **PWA & Offline** — Service worker with IndexedDB mutation queue and auto-sync
- **Releases & Changelog** — Semver releases with public changelog API
- **Favorites & Pinned Boards** — Quick access to starred boards
- **Search & Filtering** — Global search with assignee, label, and due date filters
- **Board Templates** — Clone boards with all structure
- **Archive & Trash** — Soft delete with restore and auto-cleanup

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Runtime** | [Bun](https://bun.sh/) |
| **Frontend** | React 18 + TypeScript + Vite |
| **Styling** | TailwindCSS + DaisyUI |
| **State** | Zustand (7 stores) |
| **Rich Editor** | Tiptap |
| **Charts** | Recharts |
| **Maps** | Leaflet + react-leaflet |
| **Calendar** | react-big-calendar |
| **Backend** | Hono (47 route modules) |
| **Database** | PostgreSQL 16 (44 tables) |
| **Real-time** | WebSocket (Bun native) |
| **AI** | OpenAI API |
| **Linter** | Biome |
| **CI/CD** | GitHub Actions |
| **Container** | Docker + Docker Compose |

## 📁 Project Structure

```
flux/
├── backend/
│   ├── src/
│   │   ├── db/              # Schema, migrations
│   │   ├── lib/             # Helpers, constants, schemas
│   │   ├── middleware/       # Auth, rate limiter, permissions
│   │   ├── routes/          # 47 route modules (OpenAPI/Zod)
│   │   ├── services/        # Business logic layer
│   │   └── websocket/       # WebSocket event handling
│   └── tests/               # Backend test suites
├── frontend/
│   ├── src/
│   │   ├── components/      # 118 React components
│   │   │   ├── admin/       # Admin panel
│   │   │   ├── auth/        # Login, 2FA, OAuth
│   │   │   ├── board/       # Board, cards, views
│   │   │   ├── chat/        # Team messaging
│   │   │   ├── dashboard/   # Analytics charts
│   │   │   ├── github/      # GitHub integration UI
│   │   │   ├── goals/       # OKR tracking
│   │   │   ├── settings/    # User & workspace settings
│   │   │   └── shared/      # Reusable components
│   │   ├── hooks/           # Custom React hooks
│   │   ├── i18n/            # Translations (id, en)
│   │   ├── lib/             # Types, helpers, constants
│   │   ├── pages/           # Page components
│   │   └── stores/          # 7 Zustand stores
│   └── tests/               # Frontend test suites
├── issues/                  # 59 issue specifications
├── .github/workflows/       # CI + CD pipelines
├── docker-compose.yml       # Production setup
├── docker-compose.dev.yml   # Development setup
└── CONVENTIONS.md           # Code standards
```

## 🚀 Quick Start

### Prerequisites

- [Bun](https://bun.sh/) v1.0+
- [PostgreSQL](https://www.postgresql.org/) v16+
- [Docker](https://www.docker.com/) (optional)

### With Docker (Recommended)

```bash
# Clone the repository
git clone git@github.com:wardix/flux.git
cd flux

# Copy environment file
cp .env.example .env

# Start all services (frontend, backend, database)
docker compose up -d

# Access the application
# Frontend: http://localhost:8080
# Backend API: http://localhost:3000
# API Docs: http://localhost:3000/docs
```

### Development with Docker (Hot-Reload)

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

### Manual Setup

```bash
# 1. Setup database
createdb flux
psql flux < backend/src/db/schema.sql

# 2. Backend
cd backend
cp ../.env.example .env  # Edit with your values
bun install
bun run dev              # http://localhost:3000

# 3. Frontend (new terminal)
cd frontend
bun install
bun run dev              # http://localhost:5173
```

## ⚙️ Environment Variables

```bash
# Required
DATABASE_URL=postgres://flux_user:secret123@localhost:5432/flux
JWT_SECRET=your-jwt-secret-here
PORT=3000

# OAuth (optional)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=

# AI Suggestions (optional)
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini

# Unsplash Backgrounds (optional)
UNSPLASH_ACCESS_KEY=

# Email-to-Board (optional)
INBOUND_EMAIL_DOMAIN=inbound.flux.app
WEBHOOK_EMAIL_SECRET=your-webhook-secret
```

## 🧪 Testing

```bash
# Backend tests
cd backend
bun test

# Frontend tests
cd frontend
bun run test
```

## 🔍 Linting & Formatting

```bash
# Check (lint + format)
bunx biome check ./src

# Auto-fix
bunx biome check --write ./src
```

## 📖 API Documentation

Interactive OpenAPI documentation is available at `/docs` when the backend is running.

The API covers 47 route modules including:

| Category | Endpoints |
|----------|-----------|
| **Auth** | Login, register, 2FA, OAuth, PAT |
| **Boards** | CRUD, members, templates, stars, backgrounds |
| **Cards** | CRUD, move, dependencies, mirrors, batch |
| **Lists** | CRUD, reorder |
| **Labels** | CRUD, card-label associations |
| **Comments** | CRUD with @mentions |
| **Checklists** | Items with assignee & due date |
| **Attachments** | File upload & management |
| **Time Tracking** | Start/stop timer, manual entry |
| **Sprints** | Planning, tracking, completion |
| **Epics** | CRUD, card assignment, progress |
| **Goals** | OKRs, key results, card linking |
| **Custom Fields** | Field definitions & card values |
| **Automations** | Rule engine (trigger → action) |
| **Search** | Global search with filters |
| **Analytics** | Charts, workload, velocity |
| **Chat** | Channels, messages, presence |
| **Notifications** | In-app notification system |
| **Webhooks** | Outbound with HMAC signing |
| **GitHub** | Webhook receiver, installations |
| **AI** | Label, assignee, summarize suggestions |
| **Import/Export** | Trello, Jira, CSV, JSON |
| **Admin** | User management, system stats |

## 🗺️ Roadmap

| Phase | Focus | Status |
|-------|-------|--------|
| Phase 1 | Foundation (Setup, DB, CRUD, Kanban, DnD) | ✅ Complete |
| Phase 2 | Core (Auth, Workspaces, Roles, Labels) | ✅ Complete |
| Phase 3 | Productivity (Search, Notifications, Views) | ✅ Complete |
| Phase 4 | Agile (Sprints, Epics, Automations) | ✅ Complete |
| Phase 5 | Real-time (WebSocket, Chat, Time Tracking) | ✅ Complete |
| Phase 6 | Integrations (Rich Editor, GitHub, Webhooks) | ✅ Complete |
| Phase 7 | Enterprise (SSO, Admin, i18n) | ✅ Complete |
| Phase 8 | Platform (PWA, AI, Import/Export) | ✅ Complete |
| Phase 9 | DevOps (CI/CD, Docker) | ✅ Complete |

## 📋 Project Documentation

- [📄 PRD (Product Requirements Document)](./PRD.md)
- [📖 User Stories](./USER-STORIES.md)
- [📐 Code Conventions](./CONVENTIONS.md)

## 📄 License

This project is licensed under the [MIT License](./LICENSE).

---

Built with ❤️ using Bun, React, Hono & PostgreSQL.
