# CompIntel — Compensation Intelligence System

> Level-standardized salary data for Indian tech. Structured → Comparable → Decision-ready.

Inspired by Levels.fyi, built for the Indian tech market.

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | Next.js 14, TypeScript, Tailwind CSS, Recharts |
| Backend | Node.js, Express, TypeScript |
| ORM | Prisma |
| Database | PostgreSQL |
| Deploy (FE) | Vercel |
| Deploy (BE) | Railway / Render |

---

## Project Structure

```text
compensation-intel/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma       # DB schema
│   │   └── seed.ts             # 60+ seed records
│   ├── src/
│   │   ├── index.ts            # Express server
│   │   └── routes/salary.ts    # All API routes
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
└── frontend/
    ├── src/
    │   ├── app/
    │   │   ├── page.tsx
    │   │   ├── salaries/page.tsx
    │   │   ├── company/
    │   │   │   ├── page.tsx
    │   │   │   └── [company]/page.tsx
    │   │   └── compare/page.tsx
    │   ├── components/
    │   │   └── Navbar.tsx
    │   └── lib/
    │       └── api.ts
    ├── tailwind.config.js
    └── package.json
```

---

## Important

- Run backend commands inside `/backend`
- Run frontend commands inside `/frontend`
- PostgreSQL must be installed and running

---

## Local Setup

### 1. Create PostgreSQL Database

```sql
CREATE DATABASE compensation_intel;
```

---

### 2. Backend Setup

```bash
cd backend
cp .env.example .env
```

Update `.env`:

```env
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/compensation_intel"
```

If password contains special characters, encode them:

| Character | Replace With |
|-----------|---------------|
| `@` | `%40` |
| `#` | `%23` |
| `$` | `%24` |

Example:

```env
DATABASE_URL="postgresql://postgres:janmada%402006@localhost:5432/compensation_intel"
```

Install dependencies and setup database:

```bash
npm install
npm run db:generate
npm run db:push
npm run db:seed
npm run dev
```

Backend runs on:

```text
http://localhost:4000
```

Verify backend:

```text
http://localhost:4000/api/salaries
```

If JSON salary data appears, backend and database are working correctly.

Note:

Opening only:

```text
http://localhost:4000
```

will return:

```json
{"error":"Route not found"}
```

because only API routes are implemented.

---

### 3. Frontend Setup

Open a new terminal:

```bash
cd frontend
cp .env.example .env.local
```

Update `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

Install dependencies and start frontend:

```bash
npm install
npm run dev
```

Frontend runs on:

```text
http://localhost:3000
```

IMPORTANT:

After changing `.env.local`, restart the frontend server.

---

## Recommended Startup Order

### Terminal 1

```bash
cd backend
npm run dev
```

### Terminal 2

```bash
cd frontend
npm run dev
```

---

## API Reference

### POST `/api/ingest-salary`

Submit a new salary record.

```json
{
  "company": "Google",
  "role": "Software Engineer",
  "level": "L4",
  "location": "Bangalore",
  "experience_years": 3,
  "base_salary": 3500000,
  "bonus": 700000,
  "stock": 1500000,
  "confidence": 0.9
}
```

### Validations

- All required fields must be present
- `experience_years` must be 0–50
- `base_salary` must be positive
- `bonus` and `stock` default to 0 if missing
- `total_compensation` auto-computed
- Company names normalized
- Duplicate entries rejected with `409 Conflict`

---

### GET `/api/salaries`

Query:

```text
?company=&role=&level=&location=&sort=total_compensation&order=desc&page=1&limit=20
```

---

### GET `/api/company/:company`

Returns:
- salary list
- median compensation
- average compensation
- level distribution

---

### GET `/api/compare?id1=xxx&id2=yyy`

Returns side-by-side comparison.

---

### GET `/api/companies`

Returns companies ranked by average compensation.

---

### GET `/api/filters`

Returns available roles, levels, and locations.

---

### GET `/api/stats`

Returns platform-level statistics.

---

## Edge Cases Handled

| Case | Handling |
|------|----------|
| Missing bonus/stock | Default to 0 |
| `"google"` vs `" GOOGLE "` | Normalized |
| Duplicate entries | 409 Conflict |
| Invalid data | 400 validation error |
| Empty filter results | Empty UI state |
| Company not found | 404 |
| Compare same ID twice | 400 |
| Pagination overflow | Clamped |

---

## Common Issues

### Prisma Authentication Failed

Error:

```text
P1000: Authentication failed
```

Fix:
- Verify PostgreSQL password
- Check `DATABASE_URL`
- Encode special characters in password
- Ensure PostgreSQL is running

Example:

```env
@ → %40
```

---

### npm ERR! enoent package.json

Cause:
Running commands in wrong folder.

Fix:

```bash
cd backend
```

or

```bash
cd frontend
```

before running npm commands.

---

### Frontend Shows No Data

Check:
- Backend running on port `4000`
- `NEXT_PUBLIC_API_URL` correct
- Frontend restarted after env changes
- `/api/salaries` working

---

## Deployment

### Frontend → Vercel

```bash
# Root directory: frontend
# Build command: npm run build
# Env:
NEXT_PUBLIC_API_URL=https://your-backend-url/api
```

### Backend → Railway / Render

```bash
# Root directory: backend
# Start command:
npm run build && npm start
```

Environment variable:

```env
DATABASE_URL=your_postgresql_url
```

After deployment:

```bash
npm run db:push
npm run db:seed
```

---

## Core Design Principle: Levels > Titles

This system is built around the insight that job titles are meaningless without level context.

Examples:

- `"Senior Engineer"` at TCS ≠ `"Senior Engineer"` at Google
- `L4` at Google ≈ `SDE2` at Microsoft ≈ `E4` at Meta

Most salary platforms fail because they index by title instead of level.

This system stores:
- role
- level
- compensation structure

as separate standardized dimensions.