# Product & Engineering Delivery Roadmap (V1 to V4)
**Global ERP**  
*Document Status: Active Engineering Roadmap | Delivery Model: Dependency-Aware Phasing*

---

## 1. ROADMAP PHILOSOPHY & DELIVERY RULES

- **Strict Dependency Order**: Upstream dependencies must be verified, tested, and approved before downstream modules are started.
- **Evidence-Based Progression**: Progression to the next phase requires passing automated unit/integration tests, end-to-end happy-path verification, clean TypeScript typechecks, and zero production build errors.
- **No Estimated Dates Without Signed Estimates**: Timeline commitments are based on phased milestone deliverables rather than speculative calendar dates.

---

## 2. PHASED OVERVIEW (V1 TO V4)

```
┌────────────────────────────────────────────────────────────────────────┐
│  VERSION 1 (CURRENT): CORE ENTERPRISE ACCOUNTING & UAE LOCALIZATION    │
│  - Phase A: Auth, Tenant Guards, Company Onboarding & Company Admin    │
│  - Phase B: Live Chart of Accounts & UAE Standard Template Seed        │
│  - Phase C: Atomic Voucher Engine, Period Lock & Immutable Audit Log   │
│  - Phase D: General Ledger, Trial Balance, P&L, Balance Sheet          │
│  - Phase E: Sales, Tax Invoicing, UAE 5% VAT & AR Aging                │
│  - Phase F: Purchases, Bills, Input VAT & AP Aging                     │
│  - Phase G: Cash, Bank Accounts & Transfers                            │
│  - Phase H: UAE FTA Form VAT201, PDF/Excel Exports & Backups           │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │
┌────────────────────────────────────▼───────────────────────────────────┐
│  VERSION 2: COMMERCE, SUPER ADMIN & GCC E-INVOICING                    │
│  - Multi-Warehouse Inventory with FIFO & Weighted Average Costing      │
│  - Retail & Supermarket POS (Cashier Shifts, Floats, Barcode Scanners) │
│  - Platform Super Admin (Tenant management, MFA, Audit, Support Grants)│
│  - Landed Cost Engine & Import-Export (Letter of Credit Tracking)      │
│  - Saudi Arabia (ZATCA Phase 2 E-Invoicing & UBL 2.1 XML Clearance)    │
│  - Bangladesh Tax Compliance (Mushak 6.3, VDS/AIT, Mushak 9.1 Return)  │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │
┌────────────────────────────────────▼───────────────────────────────────┐
│  VERSION 3: PRODUCTION, PROJECTS & BILLING INTEGRATION                 │
│  - SaaS Billing Provider Integration (Stripe / Paddle Webhook Adapter) │
│  - Manufacturing & Multi-Level BOM (WIP, Labor & Overhead Absorption)  │
│  - Project Accounting & Time Tracking (Milestone & Retainer Billing)   │
│  - India GST Localization (CGST/SGST/IGST, HSN Codes, GSTR-1/3B)       │
│  - Automated Bank Reconciliation & OFX/MT940 Statement Parser          │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │
┌────────────────────────────────────▼───────────────────────────────────┐
│  VERSION 4: COMPLETE GLOBAL ERP & EXTENSIONS                           │
│  - Hospitality & Restaurant F&B (Floor Tables, KOT, Recipe Depletion)  │
│  - Advanced Payroll & Wages Protection System (UAE WPS SIF Generator)  │
│  - Fixed Assets Register & Automated Monthly Depreciation              │
│  - EU / UK MTD VAT & US Multi-Tier Sales Tax Nexus Integration         │
│  - Open REST API & EDI Integrations                                    │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. VERSION 1: DETAILED PHASING & ACCEPTANCE CRITERIA

### Phase A: Auth, Company Onboarding, Tenant Guard & Company Admin
- **Status**: Complete / In Verification
- **Dependencies**: Database Connection Manager (`packages/database`).
- **Scope**:
  - JWT authentication (access & refresh tokens), bcrypt password hashing.
  - Multi-company registration (creator becomes `owner`, auto-provisions `MAIN` branch).
  - User invitation engine with 7-day token expiration and seat-limit checks.
  - `TenantGuard` enforcing `x-company-id` header against active memberships.
  - `RolesGuard` enforcing RBAC (`owner`, `admin`, `accountant`, `auditor`, `viewer`).
  - **Company Admin Foundation**: Company settings UI for managing company profile, team member invitations, role changes, and module feature toggles.
- **Acceptance Criteria**:
  - User can register, log in, create a company, invite a team member, and accept invitation.
  - Cross-tenant requests without valid membership are rejected with `403 Forbidden`.
  - Company settings screen displays real company profile and active members.
  - All automated tests pass (`pnpm --filter @accounting/api test`).

### Phase B: Chart of Accounts Live CRUD & UAE Template Seed
- **Dependencies**: Phase A (Tenant context).
- **Scope**:
  - Live CRUD API for accounts with parent-child hierarchical grouping.
  - Standard UAE Chart of Accounts template seeded upon new company registration.
  - System lock protection (`isSystemLocked: true`) on control accounts.
- **Acceptance Criteria**:
  - New company receives pre-seeded UAE standard accounts.
  - Custom accounts can be created, edited, and deactivated.
  - Deletion of locked control accounts is rejected with `400 Bad Request`.

### Phase C: Atomic Voucher Engine, Period Lock & Audit Trail
- **Dependencies**: Phase B (Chart of Accounts).
- **Scope**:
  - Transaction types: `Journal`, `Payment`, `Receipt`, `Contra`.
  - Atomic posting inside a single MongoDB multi-document transaction (`session.startTransaction()`).
  - Monotonic sequential voucher counter per company per fiscal year.
  - Financial period lock enforcement in the posting service.
  - Immutable audit log written inside the transaction.
  - Voucher reversal (`VOID` / `REVERSED`) with linked compensating entries.
- **Acceptance Criteria**:
  - Unbalanced vouchers ($\sum \text{Debits} \ne \sum \text{Credits}$) are rejected.
  - Transactions posted to a locked period are rejected.
  - Deletion of posted vouchers is blocked; reversal generates exact offset entries.

### Phase D: Financial Reports & Integrity Checks
- **Dependencies**: Phase C (Voucher Engine).
- **Scope**:
  - General Ledger and Trial Balance from live vouchers.
  - Profit & Loss Statement (Income Statement).
  - Balance Sheet with automated accounting identity check:
    $$\text{Assets} \equiv \text{Liabilities} + \text{Equity}$$
  - Automated integrity check: Trial Balance $\sum \text{Debits} \equiv \sum \text{Credits}$.
- **Acceptance Criteria**:
  - Reports compute in real time from posted voucher lines.
  - Zero mock data in financial views.

### Phase E: Sales, Invoicing & UAE 5% VAT
- **Dependencies**: Phase C (Posting Engine), Phase D (Ledger).
- **Scope**:
  - Customer directory.
  - Tax invoice generation with UAE FTA-compliant bilingual layout.
  - Automatic posting to AR and Output VAT accounts.
  - Customer receipt allocation and AR aging buckets (0–30, 31–60, 61–90, 90+).
- **Acceptance Criteria**:
  - Creating a tax invoice generates balanced GL vouchers automatically.
  - AR aging buckets update dynamically based on invoice due dates.

### Phase F: Purchases, Bills & Accounts Payable
- **Dependencies**: Phase C, Phase E.
- **Scope**:
  - Vendor directory.
  - Vendor bills with Input VAT recovery checks.
  - Automatic posting to AP and Input VAT accounts.
  - Vendor payment allocation and AP aging analysis.
- **Acceptance Criteria**:
  - Bill posting records AP liabilities and updates Input VAT.
  - Vendor payment voucher reconciles against outstanding bills.

### Phase G: Cash, Banking & Fund Transfers
- **Dependencies**: Phase C (Contra Vouchers).
- **Scope**:
  - Bank and petty cash account management.
  - Inter-bank and cash-to-bank transfers via Contra vouchers.
  - Manual bank reconciliation with cleared transaction flags.
- **Acceptance Criteria**:
  - Bank balance equals GL balance for bank accounts.
  - Transfer between accounts updates both ledgers atomically.

### Phase H: Tax Returns, Exports & Backups
- **Dependencies**: Phases E, F, G.
- **Scope**:
  - UAE FTA Form VAT201 automated generation (Emirate breakdown Boxes 1a–1g).
  - PDF export for Invoices, Statements, and Trial Balance.
  - Excel/CSV export for General Ledger and Audit File (FAF).
  - Database tenant backup and restore utility.
- **Acceptance Criteria**:
  - VAT201 return matches underlying tax invoice line items.
  - Exports generate formatted, valid files without truncation.

---

## 4. VERSIONS 2 TO 4 ROADMAP SUMMARY

| Version | Milestone Name | Key Capabilities | Pre-requisites & Local Certification |
| :--- | :--- | :--- | :--- |
| **V2** | **Commerce, Super Admin & GCC** | Multi-warehouse inventory (FIFO/Avg), POS shift management, **Platform Super Admin** (separate `/admin` route group, MFA, Support-Access Grants), Saudi ZATCA Phase 2, Bangladesh VAT foundations. | V1 Core engine stability, ZATCA sandbox certificate, Bangladesh NBR Mushak 6.3 review. |
| **V3** | **Production & SaaS Billing** | **Payment Provider Adapter** (Stripe/Paddle webhooks), Manufacturing & multi-level BOM, Project accounting & timesheets, India GST (CGST/SGST/IGST). | V2 Inventory, India CA GST review, Merchant of Record (MoR) legal setup. |
| **V4** | **Global Enterprise ERP** | Restaurant F&B (KOTs, floor plans), Advanced Payroll & UAE WPS SIF, Fixed Assets depreciation, EU/UK MTD VAT, US Sales Tax Nexus, Open API. | V1–V3 Core, UAE Ministry of Human Resources (MOHRE) WPS verification. |
