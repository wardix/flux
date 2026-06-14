# ⚡ Flux

> Modern Project Management & Kanban Board — Built with Bun, React, Hono, and PostgreSQL.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
[![CI](https://github.com/wardix/flux/actions/workflows/ci.yml/badge.svg)](https://github.com/wardix/flux/actions/workflows/ci.yml)

## 🎯 Overview

**Flux** is a modern, all-in-one project management tool inspired by the best of Trello, Linear, and Jira. It combines the simplicity of Kanban boards with powerful features like sprint management, real-time collaboration, automations, and AI-powered suggestions.

### ✨ Key Features

- 🗂️ **Kanban Board** — Drag & drop cards across columns
- 📊 **Multiple Views** — Kanban, Table, Calendar, Timeline
- ⚡ **Real-time Collaboration** — Live updates via WebSocket
- 🤖 **Automations** — If-This-Then-That rule engine
- 🏃 **Sprints & Epics** — Full agile workflow support
- 🎨 **Dark Mode** — Beautiful dark & light themes
- 📱 **PWA & Offline** — Works without internet
- 🧠 **AI Suggestions** — Smart labels, assignments & summaries
- ⌨️ **Keyboard-first** — Command palette (Cmd+K), shortcuts
- 🐳 **Docker Ready** — One command setup

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React + TypeScript + Vite |
| **Styling** | TailwindCSS + DaisyUI |
| **State** | Zustand |
| **Backend** | Hono (Bun runtime) |
| **Database** | PostgreSQL 16 |
| **Linter/Formatter** | Biome |
| **CI/CD** | GitHub Actions |
| **Container** | Docker + Docker Compose |

## 🚀 Quick Start

### Prerequisites

- [Bun](https://bun.sh/) (v1.0+)
- [PostgreSQL](https://www.postgresql.org/) (v16+)
- [Docker](https://www.docker.com/) (optional)

### With Docker (Recommended)

```bash
# Start all services (frontend, backend, database)
docker compose up -d

# Check logs
docker compose logs -f

# Stop services
docker compose down
```

### Development with Docker (Hot-Reload)

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

### Manual Setup

```bash
# Frontend
cd frontend
bun install
bun run dev

# Backend
cd backend
bun install
bun run dev
```

### Linting & Formatting

```bash
# Check all (lint + format)
bunx biome check ./src

# Auto-fix
bunx biome check --write ./src
```

## 📋 Project Documentation

- [📄 PRD (Product Requirements Document)](./PRD.md)
- [📖 User Stories](./USER-STORIES.md)
- [📁 Issues](./issues/)

## 🗺️ Roadmap

| Phase | Focus | Status |
|-------|-------|--------|
| Phase 1 | Foundation (Setup, DB, CRUD, Kanban, DnD) | 🔲 Not started |
| Phase 2 | Core (Auth, Workspaces, Roles, Labels) | 🔲 Not started |
| Phase 3 | Productivity (Search, Notifications, Views) | 🔲 Not started |
| Phase 4 | Agile (Sprints, Epics, Automations) | 🔲 Not started |
| Phase 5 | Real-time (WebSocket, Chat, Time Tracking) | 🔲 Not started |
| Phase 6 | Integrations (Rich Editor, GitHub, Webhooks) | 🔲 Not started |
| Phase 7 | Enterprise (SSO, Admin, i18n) | 🔲 Not started |
| Phase 8 | Platform (PWA, AI, Import/Export) | 🔲 Not started |
| Phase 9 | DevOps (CI/CD, Docker) | 🔲 Not started |

## 📄 License

This project is licensed under the [MIT License](./LICENSE).

---

Built with ❤️ using Bun, React, Hono & PostgreSQL.
