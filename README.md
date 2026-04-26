# 🧠 Zaneva AI Content Intelligence Platform

Platform internal untuk analisis konten Instagram/TikTok Zaneva dengan AI multi-provider.

## 🚀 Quick Start (Development)

### 1. Backend
```bash
cd zaneva-ai-platform
npm install
npx prisma generate
npx prisma db push
npm run dev
```

Backend runs on `http://localhost:3000`
- Health: `GET /health`

### 2. Frontend
```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:5173` (proxies API to backend)

### 3. Docker (Production-like)
```bash
docker-compose up -d
npx prisma db push
```

## 📋 Features

**Backend:**
- ✅ Prisma PostgreSQL ORM + full schema (Content, Metrics, Brands, Users, AI Analyses, Tasks)
- ✅ JWT Auth + RBAC (Owner/PIC_Brand) + Brand isolation middleware
- ✅ REST API (Auth, Brands, Contents, Tasks, AI, Upload)
- ✅ CSV/XLSX upload/parser service (Instagram & TikTok format)
- ✅ AI Provider adapters (Gemini, OpenAI) with structured output
- ✅ Content CRUD with pagination + metrics
- ✅ Task management with Kanban status
- ✅ Docker + docker-compose (Postgres + Node)
- ✅ TypeScript + ESLint + Prettier

**Frontend:**
- ✅ React 18 + Vite + TypeScript
- ✅ TailwindCSS + Glassmorphism design
- ✅ React Router + Protected routes
- ✅ Dark mode with premium purple palette
- ✅ Dashboard overview with stats
- ✅ Brand management (CRUD)
- ✅ Content table with metrics display
- ✅ Kanban task board
- ✅ CSV/XLSX upload with drag & drop
- ✅ Zustand state management
- ✅ Responsive sidebar layout
- ✅ Smooth animations & transitions

## 🛠 Tech Stack
```
Frontend: React 18 + Vite + TS + Tailwind + Zustand
Backend:  Node + Express + TS + Prisma + PostgreSQL
Auth:     JWT + bcrypt + RBAC
Deploy:   Docker + docker-compose (EasyPanel ready)
AI:       Multi-provider adapter (Gemini, OpenAI)
```

## 🔧 Environment Variables
Copy `.env.example` to `.env` and update:
```
DATABASE_URL=postgresql://user:pass@localhost:5432/zanevadb
JWT_SECRET=your-super-secret-key
GEMINI_API_KEY=your-gemini-key
```

## 📊 API Endpoints
```
GET    /health                  - Health check
POST   /api/auth/login          - Login
GET    /api/auth/me             - Get current user
POST   /api/auth/register       - Register user (Owner only)
GET    /api/brands              - List brands
POST   /api/brands              - Create brand (Owner only)
GET    /api/brands/:id          - Get brand
PUT    /api/brands/:id          - Update brand (Owner only)
DELETE /api/brands/:id          - Delete brand (Owner only)
GET    /api/contents            - List contents (paginated)
GET    /api/contents/stats      - Content statistics
GET    /api/contents/:id        - Get content detail
DELETE /api/contents/:id        - Delete content
POST   /api/upload/file         - Upload CSV/XLSX data
GET    /api/tasks               - List tasks
POST   /api/tasks               - Create task
PUT    /api/tasks/:id           - Update task
DELETE /api/tasks/:id           - Delete task
POST   /api/ai/analyze          - Run AI analysis
GET    /api/ai                  - List analyses
GET    /api/ai/:id              - Get analysis detail
```

## 📄 License
ISC - Internal Use Only
