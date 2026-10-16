# Global ERP

Enterprise-grade double-entry accounting, inventory management, regional compliance, and SaaS multi-tenant platform.

---

## 1. Quick Start & Local Execution

### Prerequisites
- Node.js >= 20.0.0
- pnpm >= 9.0.0
- MongoDB replica set instance (local or MongoDB Atlas)

### Installation
```bash
pnpm install
```

### Environment Configuration
Copy `.env.example` to `.env` and configure your credentials:
```bash
cp .env.example .env
```

---

## 2. Running Services Locally

### Start NestJS Backend API
```bash
# Terminal 1: Backend API (Default Port: 5050)
pnpm --filter @accounting/api run start
```
Health endpoint: `http://localhost:5050/api/health`

### Start Next.js Client Web Application
```bash
# Terminal 2: Client Web App (Default Port: 3000)
pnpm --filter @accounting/web run dev
```
Client URL: `http://localhost:3000`

---

## 3. Dedicated Test Database Configuration

All tests and automated verification scripts strictly enforce test isolation via `assertTestDatabase()`. The database name must end with `_test`:

```bash
# Set test database in shell environment:
$env:DB_NAME="business_accounting_test"    # Windows PowerShell
set DB_NAME=business_accounting_test      # Windows CMD
export DB_NAME=business_accounting_test   # Linux / macOS
```

---

## 4. Administrative CLI Commands

### Bootstrap Initial Super Admin
Creates the bootstrap platform Super Admin account with masked password entry:
```bash
pnpm --filter @accounting/api run seed:admin
```
- Prompts for email, full name, and password.
- Password characters are hidden from terminal display.
- Refuses execution if an active `SUPER_ADMIN` already exists in `super_admin_users`.

### Idempotent Subscription Backfill
Scans all companies and ensures every tenant has an active `Subscription` document:
```bash
pnpm --filter @accounting/api run backfill:subscriptions
```
- Safe and idempotent: existing subscriptions are skipped without modification.
- Assigns default starter tier and maps country to regional pricing.

---

## 5. Verification & Testing

### TypeScript Typecheck (All 5 Packages)
```bash
pnpm -r run typecheck
```

### Automated Monorepo Test Suites
```bash
pnpm -r run test
```

### Production Build Verification
```bash
pnpm run build
```
