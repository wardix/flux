# 📐 Flux — Project Conventions

> Dokumen ini menjadi referensi utama untuk semua issue. Coding agent HARUS mengikuti konvensi ini.

---

## 1. Directory Structure

```
flux/
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   │   ├── ui/             # Primitive UI (Button, Modal, Badge, Input)
│   │   │   ├── board/          # Board-related (BoardColumn, CardItem, CardDetail)
│   │   │   ├── layout/         # Layout (Sidebar, Header, MainLayout)
│   │   │   └── shared/         # Shared (Avatar, LoadingSpinner, EmptyState)
│   │   ├── pages/              # Page components (BoardPage, DashboardPage, LoginPage)
│   │   ├── stores/             # Zustand stores (boardStore, authStore, uiStore)
│   │   ├── hooks/              # Custom React hooks (useBoard, useAuth, useWebSocket)
│   │   ├── lib/                # Utilities (api.ts, constants.ts, types.ts, helpers.ts)
│   │   ├── styles/             # Global CSS
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── tests/
│   │   ├── components/         # Component tests
│   │   ├── stores/             # Store tests
│   │   └── setup.ts            # Test setup (vitest)
│   ├── index.html
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   └── package.json
│
├── backend/
│   ├── src/
│   │   ├── routes/             # Hono route handlers (boards.ts, cards.ts, auth.ts)
│   │   ├── middleware/         # Middleware (auth.ts, cors.ts, rateLimit.ts)
│   │   ├── db/                 # Database (index.ts, schema.sql, seed.sql, migrate.ts)
│   │   ├── services/           # Business logic (boardService.ts, cardService.ts)
│   │   ├── lib/                # Utilities (types.ts, constants.ts, helpers.ts)
│   │   ├── websocket/          # WebSocket handlers (index.ts, events.ts)
│   │   └── index.ts            # Entry point (Hono app)
│   ├── tests/
│   │   ├── routes/             # Route handler tests
│   │   ├── services/           # Service tests
│   │   └── setup.ts            # Test setup (bun:test)
│   ├── tsconfig.json
│   └── package.json
│
├── biome.json                  # Shared Biome config
├── docker-compose.yml
├── docker-compose.dev.yml
├── .github/
│   └── workflows/
│       ├── ci.yml
│       └── cd.yml
├── .gitignore
├── .env.example
├── README.md
├── PRD.md
├── USER-STORIES.md
├── CONVENTIONS.md
└── LICENSE
```

---

## 2. Naming Conventions

### Files

| Type | Convention | Example |
|------|-----------|---------|
| React Components | PascalCase | `BoardColumn.tsx`, `CardItem.tsx` |
| Pages | PascalCase + `Page` suffix | `BoardPage.tsx`, `LoginPage.tsx` |
| Zustand Stores | camelCase + `Store` suffix | `boardStore.ts`, `authStore.ts` |
| Custom Hooks | camelCase + `use` prefix | `useBoard.ts`, `useAuth.ts` |
| Backend Routes | camelCase (plural) | `boards.ts`, `cards.ts` |
| Backend Services | camelCase + `Service` suffix | `boardService.ts`, `cardService.ts` |
| Middleware | camelCase | `auth.ts`, `rateLimit.ts` |
| Tests | same name + `.test.ts` | `boards.test.ts`, `boardStore.test.ts` |
| Database | snake_case | `board_members`, `card_labels` |

### Variables & Functions

| Type | Convention | Example |
|------|-----------|---------|
| Variables | camelCase | `boardTitle`, `cardList` |
| Functions | camelCase | `fetchBoard()`, `createCard()` |
| Constants | UPPER_SNAKE_CASE | `API_BASE_URL`, `MAX_FILE_SIZE` |
| Types/Interfaces | PascalCase | `Board`, `Card`, `CreateBoardRequest` |
| DB columns | snake_case | `created_at`, `board_id` |
| API paths | kebab-case (plural) | `/api/boards`, `/api/cards` |

---

## 3. Backend Patterns

### 3.1 Entry Point — `backend/src/index.ts`

```typescript
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { boardRoutes } from './routes/boards'
import { cardRoutes } from './routes/cards'
import { authRoutes } from './routes/auth'

const app = new Hono()

app.use('*', cors())

app.route('/api/auth', authRoutes)
app.route('/api/boards', boardRoutes)
app.route('/api/cards', cardRoutes)

export default {
  port: process.env.PORT || 3000,
  fetch: app.fetch,
}
```

### 3.2 Route Handler Pattern — `backend/src/routes/boards.ts`

```typescript
import { Hono } from 'hono'
import { authMiddleware } from '../middleware/auth'
import * as boardService from '../services/boardService'

const boardRoutes = new Hono()

boardRoutes.use('*', authMiddleware)

// GET /api/boards
boardRoutes.get('/', async (c) => {
  const userId = c.get('userId')
  const boards = await boardService.getAll(userId)
  return c.json({ data: boards })
})

// POST /api/boards
boardRoutes.post('/', async (c) => {
  const body = await c.req.json()
  const userId = c.get('userId')
  const board = await boardService.create(userId, body)
  return c.json({ data: board }, 201)
})

export { boardRoutes }
```

### 3.3 Service Pattern — `backend/src/services/boardService.ts`

```typescript
import { db } from '../db'

export async function getAll(userId: number) {
  const result = await db.query(
    `SELECT * FROM boards WHERE workspace_id IN (
       SELECT workspace_id FROM workspace_members WHERE user_id = $1
     ) ORDER BY created_at DESC`,
    [userId]
  )
  return result
}

export async function create(userId: number, data: CreateBoardRequest) {
  const result = await db.query(
    `INSERT INTO boards (title, description, workspace_id, created_by)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [data.title, data.description, data.workspaceId, userId]
  )
  return result[0]
}
```

### 3.4 Database Connection — `backend/src/db/index.ts`

```typescript
import { SQL } from 'bun'

export const db = new SQL({
  url: process.env.DATABASE_URL || 'postgres://flux_user:secret123@localhost:5432/flux',
})
```

### 3.5 Auth Middleware — `backend/src/middleware/auth.ts`

```typescript
import { Context, Next } from 'hono'
import { verify } from 'hono/jwt'

export async function authMiddleware(c: Context, next: Next) {
  const token = c.req.header('Authorization')?.replace('Bearer ', '')
  if (!token) return c.json({ error: 'Unauthorized' }, 401)

  try {
    const payload = await verify(token, process.env.JWT_SECRET!)
    c.set('userId', payload.sub)
    await next()
  } catch {
    return c.json({ error: 'Invalid token' }, 401)
  }
}
```

---

## 4. Frontend Patterns

### 4.1 Zustand Store Pattern — `frontend/src/stores/boardStore.ts`

```typescript
import { create } from 'zustand'
import { api } from '../lib/api'

interface BoardState {
  boards: Board[]
  activeBoard: Board | null
  isLoading: boolean
  error: string | null

  fetchBoards: () => Promise<void>
  fetchBoard: (id: number) => Promise<void>
  createBoard: (data: CreateBoardRequest) => Promise<void>
  updateBoard: (id: number, data: Partial<Board>) => Promise<void>
  deleteBoard: (id: number) => Promise<void>
}

export const useBoardStore = create<BoardState>((set, get) => ({
  boards: [],
  activeBoard: null,
  isLoading: false,
  error: null,

  fetchBoards: async () => {
    set({ isLoading: true, error: null })
    try {
      const { data } = await api.get('/boards')
      set({ boards: data, isLoading: false })
    } catch (error) {
      set({ error: 'Failed to fetch boards', isLoading: false })
    }
  },

  // ... more actions
}))
```

### 4.2 API Client — `frontend/src/lib/api.ts`

```typescript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem('token')
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...options,
  })
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json()
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  put: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PUT', body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
}
```

### 4.3 Component Pattern

```tsx
// frontend/src/components/board/CardItem.tsx
import { useBoardStore } from '../../stores/boardStore'

interface CardItemProps {
  card: Card
  onDragStart?: () => void
}

export function CardItem({ card, onDragStart }: CardItemProps) {
  const updateCard = useBoardStore((s) => s.updateCard)

  return (
    <div className="card bg-base-100 shadow-sm cursor-pointer hover:shadow-md transition-shadow">
      <div className="card-body p-3">
        <h3 className="text-sm font-medium">{card.title}</h3>
      </div>
    </div>
  )
}
```

---

## 5. API Response Format

### Success Response

```json
{
  "data": { ... },
  "meta": {
    "page": 1,
    "perPage": 20,
    "total": 100
  }
}
```

### Error Response

```json
{
  "error": "Error message",
  "details": { ... }
}
```

### HTTP Status Codes

| Code | Usage |
|------|-------|
| `200` | Success (GET, PUT) |
| `201` | Created (POST) |
| `204` | No Content (DELETE) |
| `400` | Bad Request (validation error) |
| `401` | Unauthorized (no/invalid token) |
| `403` | Forbidden (no permission) |
| `404` | Not Found |
| `409` | Conflict (duplicate) |
| `429` | Too Many Requests (rate limit) |
| `500` | Internal Server Error |

---

## 6. Database Conventions

### Column Standards

| Column | Type | Usage |
|--------|------|-------|
| `id` | `SERIAL PRIMARY KEY` | Auto-increment ID |
| `*_id` | `INTEGER REFERENCES table(id)` | Foreign key |
| `created_at` | `TIMESTAMPTZ DEFAULT NOW()` | Record creation time |
| `updated_at` | `TIMESTAMPTZ DEFAULT NOW()` | Last update time |
| `archived_at` | `TIMESTAMPTZ` (nullable) | Soft archive timestamp |
| `deleted_at` | `TIMESTAMPTZ` (nullable) | Soft delete timestamp |
| `position` | `INTEGER NOT NULL DEFAULT 0` | Sort order |

### Naming

- Table names: **plural snake_case** (`boards`, `card_labels`)
- Column names: **singular snake_case** (`board_id`, `created_at`)
- Index names: `idx_{table}_{column}` (`idx_cards_list_id`)
- Unique constraints: `uq_{table}_{column}` (`uq_users_email`)

---

## 7. Testing Conventions

### Backend (bun:test)

- File: `backend/tests/routes/{resource}.test.ts`
- Pattern: Arrange → Act → Assert
- Use test database (separate from dev)
- Reset DB before each test suite

```typescript
// backend/tests/routes/boards.test.ts
import { describe, test, expect, beforeAll, afterAll } from 'bun:test'
import app from '../../src/index'

describe('POST /api/boards', () => {
  test('should create a new board', async () => {
    const res = await app.request('/api/boards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${testToken}` },
      body: JSON.stringify({ title: 'Test Board' }),
    })
    expect(res.status).toBe(201)
    const { data } = await res.json()
    expect(data.title).toBe('Test Board')
  })

  test('should return 400 if title is missing', async () => {
    const res = await app.request('/api/boards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${testToken}` },
      body: JSON.stringify({}),
    })
    expect(res.status).toBe(400)
  })

  test('should return 401 without auth token', async () => {
    const res = await app.request('/api/boards', { method: 'POST' })
    expect(res.status).toBe(401)
  })
})
```

### Frontend (vitest + @testing-library/react)

- File: `frontend/tests/components/{Component}.test.tsx` or `frontend/tests/stores/{store}.test.ts`

```typescript
// frontend/tests/stores/boardStore.test.ts
import { describe, test, expect, beforeEach } from 'vitest'
import { useBoardStore } from '../../src/stores/boardStore'

describe('boardStore', () => {
  beforeEach(() => {
    useBoardStore.setState({ boards: [], activeBoard: null })
  })

  test('should add board to state', () => {
    // ...
  })
})
```

---

## 8. Environment Variables

### `.env.example`

```bash
# Backend
PORT=3000
DATABASE_URL=postgres://flux_user:secret123@localhost:5432/flux
JWT_SECRET=your-jwt-secret-here-change-in-production
JWT_EXPIRES_IN=7d

# OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
FACEBOOK_CLIENT_ID=
FACEBOOK_CLIENT_SECRET=

# File Storage
UPLOAD_DIR=./uploads
# S3_BUCKET=
# S3_REGION=
# S3_ACCESS_KEY=
# S3_SECRET_KEY=

# Frontend
VITE_API_URL=http://localhost:3000/api
VITE_WS_URL=ws://localhost:3000/ws

# Unsplash
UNSPLASH_ACCESS_KEY=

# AI (Optional)
OPENAI_API_KEY=
```

---

## 9. Package Decisions

### Frontend (`frontend/package.json`)

| Package | Version | Purpose |
|---------|---------|---------|
| `react` | ^19 | UI library |
| `react-dom` | ^19 | React DOM |
| `react-router-dom` | ^7 | Routing |
| `zustand` | ^5 | State management |
| `@dnd-kit/core` | ^6 | Drag and drop (core) |
| `@dnd-kit/sortable` | ^10 | Drag and drop (sortable) |
| `@dnd-kit/utilities` | ^3 | Drag and drop (utilities) |
| `react-markdown` | ^9 | Markdown rendering |
| `react-big-calendar` | ^1 | Calendar view |
| `recharts` | ^2 | Charts & analytics |
| `cmdk` | ^1 | Command palette |
| `@tiptap/react` | ^2 | Rich text editor |
| `react-i18next` | ^15 | Internationalization |
| `idb` | ^8 | IndexedDB wrapper (PWA) |
| `date-fns` | ^4 | Date utilities |

### Backend (`backend/package.json`)

| Package | Version | Purpose |
|---------|---------|---------|
| `hono` | ^4 | Web framework |
| `@hono/jwt` | ^1 | JWT utilities |
| `argon2` | ^0.41 | Password hashing |
| `zod` | ^3 | Request validation |

### Dev Dependencies (root)

| Package | Version | Purpose |
|---------|---------|---------|
| `@biomejs/biome` | ^1 | Linter + Formatter |
| `vitest` | ^3 | Frontend testing |
| `@testing-library/react` | ^16 | React component testing |
| `@testing-library/jest-dom` | ^6 | DOM matchers |

---

## 10. Git Workflow

### Branch Naming

```
main                    # Production branch
├── feat/01-setup       # Feature branch per issue
├── feat/02-db-schema
├── feat/03-backend-api
├── fix/card-drag-bug   # Bug fix
└── chore/update-deps   # Maintenance
```

### Commit Messages

```
feat(#01): initialize frontend and backend projects
feat(#02): create database schema and connection
feat(#03): add CRUD API endpoints for boards, lists, cards
fix(#05): fix card position after drag between lists
test(#03): add unit tests for board API endpoints
chore: update dependencies
docs: update README with setup instructions
```

### PR Flow

```
1. Create branch: feat/XX-issue-name
2. Implement + write tests
3. Run `bunx biome check --write ./src`
4. Run `bun test`
5. Push & create PR referencing issue: "Closes #XX"
6. CI must pass (Biome + Tests)
7. Merge to main
```
