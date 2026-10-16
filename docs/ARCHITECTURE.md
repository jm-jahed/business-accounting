# System Architecture & Technical Specifications
**Global ERP**  
*Document Status: Core Architectural Reference | Last Updated: October 2026*

---

## 1. ARCHITECTURAL CLASSIFICATION LEGEND

To maintain complete transparency and technical integrity across the codebase, every architectural component in this document is labeled with one of the following statuses:

- `[Verified existing implementation]`: Fully implemented in code, covered by automated tests, and verified in active operation.
- `[Approved architectural decision]`: Formally agreed upon as the engineering standard for upcoming phases; models and contracts are defined, but full vertical execution is pending.
- `[Proposed future design]`: Documented technical blueprint for future modular expansion; pending formal scheduling and approval.

---

## 2. THREE-LAYER SYSTEM TOPOLOGY

```
┌────────────────────────────────────────────────────────────────────────┐
│                   LAYER 3: INDUSTRY WORKFLOW MODULES                   │
│   [Retail/Supermarket POS]  [Restaurant F&B]  [Manufacturing / BOM]    │
│   [Import-Export / Landed]  [Project Services] [Fixed Assets / Payroll] │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │ Events & Dimensioned Transactions
┌────────────────────────────────────▼───────────────────────────────────┐
│                    LAYER 2: COUNTRY COMPLIANCE PACKS                   │
│   [UAE FTA] [KSA ZATCA] [India GST] [BD NBR] [EU/UK VAT] [US Sales Tax]│
│   - CoA Templates  - Tax Rules/Codes  - E-Invoice / QR  - Audit Files │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │ Validated Vouchers & Tax Postings
┌────────────────────────────────────▼───────────────────────────────────┐
│                  LAYER 1: CORE FINANCIAL & PLATFORM KERNEL             │
│   - Double-Entry Engine (Debits = Credits)                             │
│   - Decimal128 / Decimal.js High-Precision Math (Banker's Rounding)    │
│   - Multi-Tenant & Multi-Branch Boundary Enforcement                   │
│   - Dynamic Financial Dimensions (Branch, Warehouse, Cost Center, Dept)│
│   - Immutable Audit Log & Period Lock Engine                           │
│   - Dynamic Currency & Exchange Rate Revaluation                       │
└────────────────────────────────────────────────────────────────────────┘
```

### 2.1 Layer Responsibilities & Integration Boundaries
1. **Layer 1: Core Financial Kernel** `[Verified existing implementation]` / `[Approved architectural decision]`
   - Acts as the immutable general ledger engine.
   - Enforces double-entry equality ($\sum \text{Debits} = \sum \text{Credits}$), Banker's Rounding, multi-tenant isolation, period locks, and audit logging.
   - Completely agnostic of regional tax rules or industry workflows.

2. **Layer 2: Country Compliance Packs** `[Approved architectural decision]`
   - Pluggable modules implementing the `ICountryPack` contract.
   - Supplies regional Chart of Accounts templates, tax regime definitions, e-invoicing cryptographic algorithms (e.g., ZATCA Phase 2, UAE FTA), and statutory tax filing reports.

3. **Layer 3: Industry Vertical Modules** `[Proposed future design]`
   - Encapsulates vertical operational workflows (e.g., POS cashier shifts, restaurant kitchen order tickets, manufacturing production runs).
   - **Operational Isolation Invariant**: Operational records never directly update account balances. Instead, they emit standardized domain events that invoke the Posting Adapter to generate balanced, dimensioned vouchers in Layer 1.

---

## 3. MULTI-TENANCY & DATA ISOLATION

### 3.1 Company and Branch Data Isolation `[Verified existing implementation]`
- Multi-tenancy is enforced strictly at the database boundary:
  - Every tenant-scoped entity (`Account`, `Branch`, `Voucher`, `CompanyInvitation`) stores a `companyId` indexed as `mongoose.Schema.Types.ObjectId`.
  - The NestJS `TenantGuard` intercepts requests, extracts the active `x-company-id` header, verifies the caller's active record in `CompanyMembership`, and injects `TenantContext` into `request.tenant`.
  - Service queries apply `createTenantScopedFilter(tenantContext)` to guarantee queries never cross tenant boundaries.
  - Branch access is controlled via `membership.branchAccess` (`'all'` or specific array of `branchId` strings).

### 3.2 Locale, Timezone, Fiscal Year, and Base Currency `[Verified existing implementation]`
- Stored directly in the `Company` schema:
  - `currency`: 3-letter ISO code (`AED`, `SAR`, `USD`, `BDT`, `INR`), default `AED`.
  - `countryCode`: 2-letter ISO code, default `AE`.
  - `fiscalYearStartMonth`: Integer (1–12), determining the start of the 12-month accounting cycle.
  - `industryType`: `'retail' | 'supermarket' | 'restaurant' | 'trading' | 'manufacturing' | 'services' | 'general'`.
  - `localeSettings`: Timezone (`Asia/Dubai`), date format (`YYYY-MM-DD`), and number formatting locale.

---

## 4. MONETARY STORAGE & ARITHMETIC POLICY

### 4.1 Single Source of Truth Calculation Engine `[Verified existing implementation]`
- Implemented in `packages/core/src/math/decimal.ts`:
  - Built on `decimal.js` configured with precision 20 and Round-Half-Even (Banker's rounding) to prevent statistical penny bias:
    ```typescript
    Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_EVEN });
    ```
  - Standard helper functions: `toDecimal()`, `roundHalfEven()`, `validateJournalLines()`.
  - Native JavaScript floating-point arithmetic (`+`, `-`, `*`, `/`) is strictly prohibited in financial pathways.

### 4.2 Exact Database Persistence `[Verified existing implementation]`
- In MongoDB, all monetary fields must be declared as `mongoose.Schema.Types.Decimal128` (or exact minor integer units).
- Conversion between Mongoose `Decimal128` and `@accounting/core` `Decimal` instances occurs exclusively at the database service layer via `Decimal(doc.amount.toString())`.

---

## 5. GENERAL LEDGER, VOUCHER ENGINE & AUDIT TRAIL

### 5.1 Chart of Accounts (CoA) `[Verified existing implementation]`
- Modeled in `packages/database/src/models/Account.ts`:
  - Standard account types: `asset`, `liability`, `equity`, `revenue`, `expense`.
  - Normal balance conventions:
    - Assets & Expenses: Normal balance is **Debit** ($Balance = Debits - Credits$).
    - Liabilities, Equity, Revenue: Normal balance is **Credit** ($Balance = Credits - Debits$).
  - System locks: Core accounts required by automated posting engines are protected by `isSystemLocked: true` to prevent accidental deletion.

### 5.2 Atomic Voucher Posting Engine `[Approved architectural decision]`
- Supported voucher types: `Journal`, `Payment`, `Receipt`, `Contra`.
- Posting sequence is executed inside a MongoDB multi-document ACID transaction (`session.startTransaction()`):
  1. Validate that the posting date does not fall within a locked accounting period.
  2. Compute total debits and total credits using `validateJournalLines()`. Reject if unbalanced.
  3. Atomically increment the sequential voucher counter for the company and fiscal year.
  4. Write the immutable `Voucher` record with status `POSTED`.
  5. Atomically increment account running balances using `$inc` with `Decimal128`.
  6. Write an immutable `AuditLog` entry in the same transaction.

### 5.3 Voucher Reversal & Period Locking `[Approved architectural decision]`
- **No Hard Deletes**: Deletion of posted vouchers is forbidden. To reverse an entry, a compensating voucher is posted with inverted debits and credits, referencing `reversalOfVoucherId`.
- **Period Locking**: An administrative entity `FinancialPeriod` maintains `status: 'open' | 'locked'`. The posting engine verifies the period status before committing any voucher.

### 5.4 Financial Dimensions on Journal Lines `[Approved architectural decision]`
- To support cost accounting, project profitability, and departmental reporting without cluttering the Chart of Accounts, each journal line accepts an optional `dimensions` container:
  ```typescript
  dimensions?: {
    branchId?: Types.ObjectId;
    costCenterId?: Types.ObjectId;
    projectId?: Types.ObjectId;
    warehouseId?: Types.ObjectId;
    departmentId?: Types.ObjectId;
  }
  ```

---

## 6. DATA-DRIVEN TAX ENGINE & E-INVOICING

### 6.1 Data-Driven Versioned Tax Configuration `[Approved architectural decision]`
- Dynamic tax architecture (zero hardcoded VAT percentages):
  - `TaxRegime`: Defines regional statutory regime, effective dates, RCM, and withholding flags.
  - `TaxCode`: Standard rated, zero-rated, exempt, out of scope, reverse charge, withholding.
  - `TaxRate`: Numerical percentage linked to effective date ranges.
  - `TaxAccountMapping`: Maps tax codes to output tax payable, input tax recoverable, and RCM accrual accounts.
- Supports both **Tax Exclusive** and **Tax Inclusive** calculations with Banker's Rounding.

### 6.2 Invoicing & E-Invoicing Extension Points `[Approved architectural decision]`
- Invoices support an extensible `eInvoiceMeta` structure:
  - `uuid`: Universally unique electronic invoice identifier.
  - `invoiceHash`: Cryptographic SHA-256 hash of invoice content.
  - `previousInvoiceHash`: Chained cryptographic hash from previous invoice (ZATCA requirement).
  - `qrCodePayload`: Base64 TLV-encoded payload (ZATCA) or FTA-compliant invoice verification QR.
  - `submissionStatus`: `'not_submitted' | 'cleared' | 'reported' | 'failed'`.

---

## 7. FEATURE FLAGS & PER-COMPANY MODULE ENTITLEMENTS

### 7.1 Module Entitlements `[Verified existing implementation]`
- Stored on the `Company` record via `enabledModules: string[]` (e.g., `['accounting', 'inventory', 'pos']`).
- Evaluated on both server and client:
  - **API**: Endpoints belonging to disabled modules return `403 Forbidden` (`ModuleNotEnabledException`).
  - **Web**: UI navigation items, routes, and dashboard widgets for disabled modules are hidden; heavy components are lazy-loaded via `next/dynamic`.

---

## 8. BACKUP, MIGRATIONS & DATA INTEGRITY PRINCIPLES

### 8.1 Transaction Boundaries & Idempotency `[Verified existing implementation]` / `[Approved architectural decision]`
- **Replica Set Prerequisite**: Multi-document ACID transactions require a MongoDB replica set. Verified active on MongoDB Atlas Dedicated Cluster (`atlas-dnsc2k-shard-0`, MongoDB 8.0.34).
- **Idempotency Keys**: Financial posting endpoints accept an optional `Idempotency-Key` header stored in MongoDB with a unique index to prevent duplicate posting upon network retries.

### 8.2 Safe Schema Evolution `[Approved architectural decision]`
- Additive schema modifications only. Never remove or rename existing fields without a formal multi-phase migration script.
- Ensure all forward-compatible hooks (`dimensions`, `enabledModules`, `localeSettings`, `plan`, `subscriptionStatus`) exist to avoid data restructuring migrations later.

---

## 9. ADMIN TOPOGRAPHY: COMPANY ADMIN VS PLATFORM SUPER ADMIN

```
┌────────────────────────────────────────────────────────────────────────┐
│                        TWO DISTINCT ADMIN SURFACES                     │
├───────────────────────────────────┬────────────────────────────────────┤
│         COMPANY ADMIN             │       PLATFORM SUPER ADMIN         │
│  - Route: /settings, /company     │  - Route: /admin (separate group)  │
│  - Scope: Single tenant only      │  - Scope: Platform & tenants       │
│  - Roles: 'owner', 'admin'        │  - Role: 'SUPER_ADMIN' (global)    │
│  - MFA: Optional / Recommended    │  - MFA: MANDATORY (Time-based TOTP)│
│  - Data Access: Own company       │  - Data Access: ZERO financial data│
│    vouchers & accounts            │    without explicit Support Grant  │
└───────────────────────────────────┴────────────────────────────────────┘
```

### 9.1 Company Admin `[Approved architectural decision]`
- **Location**: In-app under `/settings` or `/company-admin`.
- **Authorization**: Governed by `CompanyMembership.role` (`'owner'` or `'admin'`). Enforced on server via `TenantGuard` and `RolesGuard`.
- **Responsibilities**:
  - User and membership management (invitations, role assignments, seat allocations).
  - Company profile and legal entity details (TRN, tax registration).
  - Fiscal year configuration and period locking.
  - Document numbering sequences (Invoices, Journals, Receipts).
  - Module toggles (enabling/disabling permitted vertical modules).
  - Backup creation and export downloads.

### 9.2 Platform Super Admin `[Approved architectural decision]`
- **Location**: Dedicated route group `/admin` (or `admin.` subdomain) with distinct layout and auth middleware.
- **Authorization**:
  - Global `SUPER_ADMIN` system role, completely decoupled from tenant `CompanyMembership`.
  - **Mandatory Multi-Factor Authentication (MFA)** required before accessing any super admin endpoint.
  - Server-side authorization check on every request; never rely on UI hiding.
- **Responsibilities**:
  - Tenant lifecycle (manual provisioning, plan assignment, subscription overrides).
  - Plan entitlements and seat limit configurations.
  - Platform usage telemetry (tenant counts, transaction volumes, storage consumption).
  - System-wide backup status monitoring.
  - Platform audit logs.
- **Support-Access Grant Security Model (`[Approved architectural decision]`)**:
  - **Strict Financial Privacy Invariant**: Super Admin has **ZERO read access** to tenant financial ledgers, vouchers, bills, invoices, or customer lists by default.
  - If a tenant requests support troubleshooting, access to financial records requires an explicit, cryptographically logged **Support-Access Grant**:
    ```typescript
    interface ISupportAccessGrant {
      grantId: Types.ObjectId;
      companyId: Types.ObjectId;
      superAdminUserId: Types.ObjectId;
      reason: string;               // e.g. "Customer ticket #8942 - journal balance discrepancy"
      approvedByOwnerId: Types.ObjectId;
      permissions: Array<'read_vouchers' | 'read_ledger' | 'read_tax_returns'>;
      validFrom: Date;
      validUntil: Date;             // Max 4-hour window
      revokedAt?: Date;
      auditLogId: Types.ObjectId;
    }
    ```
  - Any read attempt without an active, unexpired, and unrevoked grant returns `403 Forbidden`. Every query executed under a grant is written to the immutable security audit log.

---

## 10. SAAS BILLING & ENTITLEMENT ARCHITECTURE

### 10.1 Central Entitlement Service `[Approved architectural decision]`
- **Single Source of Truth**: All entitlement evaluations (checking whether a company can add another user, create a branch, or access a module) pass through `EntitlementService`.
- Frontend code never inspects plan names directly. Instead, it queries `useEntitlements()` which resolves boolean capabilities (e.g., `canAccessInventory`, `canAddFullSeat`).
- The backend API verifies entitlements at the controller and domain layer.

### 10.2 Seat Model & Reservation Rules `[Approved architectural decision]`
- Two seat classes:
  - `full`: Accounting, operational, and managerial staff who record transactions and configure systems.
  - `read_only`: Auditors, external tax consultants, and viewers with read-only access.
- **Seat Counting Formula**:
  $$\text{AllocatedFullSeats} = \text{ActiveFullMemberships} + \text{PendingFullInvitations}$$
- When $\text{AllocatedFullSeats} \ge \text{SeatLimit}$, further invitations for `full` seats are blocked with `402 Payment Required` / `UpgradeRequiredException`.

### 10.3 Subscription Lifecycle & Read-Only Suspension `[Approved architectural decision]`
- Lifecycle states:
  - `trial`: Full access for limited duration (`trialEndsAt`).
  - `active`: Fully paid, normal operational read-write state.
  - `past_due`: Payment failure retry window (14-day grace period; full read-write maintained with banner).
  - `grace_period`: Extended grace period with notifications.
  - `read_only_suspended`: Writing new vouchers, invoices, and records is blocked. **Historical records, ledgers, statements, and statutory exports remain 100% readable and exportable**.
  - `cancelled`: Subscription terminated. Read-only data retention maintained.
- **Non-Destructive Retention Rule**: Customer financial data is **never deleted** due to subscription status.

### 10.4 Provider-Agnostic Payment Adapter `[Approved architectural decision]`
- Defined by the `IPaymentProviderAdapter` interface:
  ```typescript
  export interface IPaymentProviderAdapter {
    readonly providerName: 'stripe' | 'paddle' | 'lemon_squeezy';
    createCheckoutSession(input: CheckoutSessionInput): Promise<CheckoutSessionResult>;
    createCustomerPortalSession(input: PortalSessionInput): Promise<PortalSessionResult>;
    handleWebhookEvent(rawPayload: Buffer, signature: string): Promise<WebhookProcessingResult>;
  }
  ```
- Core billing logic remains 100% agnostic of specific payment vendors.
- **Web-Only Billing UI**: Checkout and subscription management flows are hosted exclusively on the web application. Mobile APK and desktop applications display subscription status only and direct users to the web app for upgrades.
