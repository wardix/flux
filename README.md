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

## 🚀 Quick Start

### Prerequisites

- [Bun](https://bun.sh/) v1.0+
- [PostgreSQL](https://www.postgresql.org/) v16+
- [Docker](https://www.docker.com/) (optional)

### With Docker (Recommended)

```bash
git clone git@github.com:wardix/flux.git
cd flux
cp .env.example .env

# Start all services (frontend, backend, database)
docker compose up -d

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

> See [`.env.example`](./.env.example) for all available environment variables (OAuth, AI, Unsplash, email inbound, etc.).

## 🛠️ Development

```bash
# Backend tests
cd backend && bun test

# Frontend tests
cd frontend && bun run test

# Lint & format check
bunx biome check ./src

# Auto-fix
bunx biome check --write ./src
```

Interactive OpenAPI documentation is available at `/docs` when the backend is running.

## 📋 Documentation

- [📄 PRD (Product Requirements Document)](./PRD.md)
- [📖 User Stories](./USER-STORIES.md)
- [📐 Code Conventions](./CONVENTIONS.md)

## 📄 License

This project is licensed under the [MIT License](./LICENSE).

---

Built with ❤️ using Bun, React, Hono & PostgreSQL.
