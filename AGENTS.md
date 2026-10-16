# Engineering Rules & Agent Operating Guidelines
**Global ERP**  
*Repository Root: `D:\business-accounting` | Status: Active Engineering Policy*

---

## 1. PURPOSE & APPLICABILITY

This document establishes the mandatory engineering rules, architectural invariants, security policies, and operational boundaries for all developers and AI coding agents working on this codebase. These rules are non-negotiable and strictly enforced.

---

## 2. MANDATORY ENGINEERING RULES

### Rule 1: Repository Stack & Monorepo Structure
- The repository is organized as a strict `pnpm` monorepo:
  - `apps/web`: Next.js frontend (App Router), Vanilla CSS design tokens (`globals.css`), Lucide icons, Recharts, Framer Motion, cmdk, sonner.
  - `apps/api`: NestJS backend (Express engine), TypeScript, bcryptjs, jsonwebtoken.
  - `packages/core`: Zero-dependency domain kernel (Decimal.js high-precision arithmetic, currency exchange rates, i18n formatters).
  - `packages/contracts`: Zod validation schemas and shared data transfer contracts.
  - `packages/database`: MongoDB Mongoose models, connection manager with DNS fallback, and tenant isolation primitives.
- Code must reside in the appropriate workspace package. Never create ad-hoc root folders or write application logic outside package boundaries.
- Adhere to the established TypeScript configuration and ES module output targets (`.js` import extensions in compiled TypeScript where configured).

### Rule 2: Vertical Slice Delivery (One Slice at a Time)
- Work must proceed strictly in single, approved vertical slices.
- A phase or feature is only complete when its **complete vertical slice** is realized:
  1. Contracts / Zod schemas (`packages/contracts`)
  2. Database models & tenant filters (`packages/database`)
  3. API services, guards, and controllers (`apps/api`)
  4. Real frontend screens and hooks (`apps/web`)
  5. Automated unit/integration tests
  6. End-to-end verification and successful workspace build
- Never jump ahead to implement subsequent phases until the current phase is fully verified, typechecked, and approved.

### Rule 3: Zero Mock Data in Production Flows & Explicit "Coming Soon" States
- Never label simulated, hardcoded, or mock data as functional live data.
- As each vertical slice lands, any previously mock UI components must be replaced with real API calls and database persistence.
- Any genuinely unimplemented button, tab, or screen must be either:
  - Omitted from the UI if premature, OR
  - Explicitly badged as `"Coming soon"` with a disabled state and an explanatory tooltip.
- Dead buttons, phantom clicks, and misleading UI representations are strictly prohibited.

### Rule 4: Mandatory Multi-Tenant & Multi-Branch Isolation
- Every database query and mutation that accesses company-scoped data must enforce tenant isolation at the server level.
- Multi-tenancy is enforced through `TenantGuard`, validating that the authenticated user (`req.user.sub`) possesses an active membership in the target company (`x-company-id` header).
- Every Mongoose query for tenant data must apply `createTenantScopedFilter(tenantContext)` or equivalent explicit `companyId` scoping.
- Client-supplied `companyId` parameters in HTTP request bodies or query strings must never override the server-validated tenant context.
- Branch access restrictions (`branchAccess: string[] | 'all'`) must be verified on the server for all branch-level operations.

### Rule 5: Strict Monetary Math & Persistence Policy
- **Zero Floating-Point Arithmetic**: JavaScript native `Number` (`+`, `-`, `*`, `/`) must never be used for financial arithmetic, currency conversions, tax computations, or account balances.
- **Single Source of Truth**: All financial calculations must strictly use `@accounting/core` `Decimal.js` helpers (`toDecimal`, `roundHalfEven`, `validateJournalLines`).
- **Banker's Rounding**: Rounding must strictly employ Round-Half-Even (`Decimal.ROUND_HALF_EVEN`) to eliminate statistical bias in transaction batches.
- **Database Storage**: Monetary values in MongoDB must be stored as `mongoose.Schema.Types.Decimal128` (or exact minor integer units). Never store monetary values as IEEE-754 double/float numbers.

### Rule 6: Immutable Double-Entry, Audit Log & Period Locking
- **Double-Entry Balance**: In every voucher and journal transaction, total debits must exactly equal total credits:
  $$\sum \text{Debits} \equiv \sum \text{Credits}$$
- **Zero Hard Deletes on Posted Vouchers**: Once a voucher is in `POSTED` status, it cannot be deleted or mutated. Corrections must be executed via an explicit reversing voucher (`VOID` / `REVERSED`).
- **Atomic Posting**: Voucher creation, ledger line updates, account balance adjustments, and audit log generation must occur inside a single MongoDB multi-document ACID transaction (`session.startTransaction()`).
- **Period Locking**: The posting service must reject any voucher with a posting date falling within a locked financial accounting period, regardless of user role.

### Rule 7: Data-Driven Taxation (Zero Hardcoded Tax Rates)
- Statutory tax rates (such as UAE 5% VAT, KSA 15% VAT, India 18% GST, Bangladesh 15% VAT) must never be hardcoded into business logic or UI calculations.
- All tax computations must be dynamically derived from versioned `TaxCode` and `TaxRate` entities loaded per tenant regime.
- Country-specific and industry-specific rules must reside in modular Country Packs and Industry Modules, not in the core financial kernel.

### Rule 8: Admin Area Design Consistency & Super Admin Data Privacy
- **Zero "Plain Admin" Styling**: Both Company Admin and Platform Super Admin must strictly use the unified Navy & Gold design tokens, typography, and shared components (`DataTable`, `FormField`, `Modal`, `StatusPill`, `EmptyState`, `Skeleton`). No unstyled or third-party template look is permitted.
- **Two Distinct Admin Surfaces**:
  1. **Company Admin**: Scoped strictly within the tenant boundary (`/settings`, `/company-admin`). Manages users, roles, permissions, fiscal year, tax config, numbering series, module toggles, and backups. Integrated with Phase A.
  2. **Platform Super Admin**: Resides in an isolated route group (`/admin` or `admin.` subdomain). Governed by a dedicated `SUPER_ADMIN` role with mandatory Multi-Factor Authentication (MFA). Scheduled after Core accounting engine stability.
- **Strict Financial Privacy Invariant**: Platform Super Admin must never read company general ledgers, vouchers, invoices, or customer data without an explicit, time-bounded, and cryptographically logged **Support-Access Grant** approved by the tenant owner. Never rely on UI hiding alone for authorization.

### Rule 9: SaaS Billing, Entitlements & Data Retention Policy
- **Central Entitlement Service**: Entitlement checks must never be scattered across frontend components. A single backend entitlement service acts as the authoritative source of truth.
- **Seat Model Enforcement**: Enforces `full` vs `read_only` (auditor/viewer) seats upon user invitation and membership activation. When seat limits are reached, the operation is safely rejected with an upgrade path.
- **Non-Destructive Subscription Suspension**: Customer financial data must **NEVER** be deleted due to subscription expiration, non-payment, suspension, or cancellation. Suspended accounts enter a read-only state where historical data and statutory exports remain accessible.
- **Provider-Agnostic Payment Boundary**: Core billing logic must interface with an abstract payment adapter so Stripe, Paddle, or Lemon Squeezy can be connected without vendor lock-in.
- **Web-Only Billing UI**: Mobile APK and Windows desktop applications must not sell subscriptions or host checkout flows. They may display subscription status and direct users to the web billing interface.

### Rule 10: Security, Credentials & Operational Governance
- Never log, commit, or expose database connection strings, JWT secrets, API keys, or plain-text passwords.
- Passwords must be hashed using `bcrypt` (work factor $\ge 10$) prior to persistence.
- Pre-flight checks on database topology, replica sets, and network connectivity must be executed and reported before architectural changes.
- **Strict Prohibition**: Never run destructive database commands (e.g., `dropDatabase()`, `deleteMany({})` outside tests), never commit, push to GitHub, or trigger deployments without explicit user confirmation.

### Rule 11: Evidence-Based Verification Before Completion
- Before declaring any task, phase, or fix complete:
  1. Run automated test suites across affected packages (`pnpm test`).
  2. Run TypeScript typecheck across all workspace packages (`pnpm typecheck`).
  3. Verify production compilation (`pnpm build`).
  4. Report actual pass/fail counts, duration, and output directly to the user.

---

## 3. OPEN ARCHITECTURAL QUESTIONS (REQUIRING APPROVAL)

The following items are recognized architectural decision points that require explicit user review and approval prior to implementation:

1. **E-Invoicing Cryptographic Signing Architecture**:
   - Whether ZATCA Phase 2 (ECDSA secp256k1) and UAE FTA e-invoicing signatures should be processed synchronously inside the API service or asynchronously via a dedicated signing worker.
2. **Offline-First POS Synchronization Strategy**:
   - Whether POS clients should synchronize shifts and sales via bidirectional delta synchronization (CRDT/CouchDB) or batch replay of signed JSON payloads.
3. **Multi-Currency Real-Time Feed**:
   - Selection of official exchange rate feed provider (Central Bank of UAE API vs Open Exchange Rates) for daily automated foreign currency revaluations.
4. **Support-Access Grant Workflow**:
   - Formal approval mechanism for tenant owners granting temporary support access (in-app authorization modal vs time-limited email approval token).
