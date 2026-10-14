# UI Design System & Component Specifications
**Universal Business Accounting & Management System**  
*Document Status: Core Design Standard | Last Updated: October 2026*

---

## 1. DESIGN PHILOSOPHY & BRAND IDENTITY

The user interface embodies high-density, low-latency financial ergonomics inspired by Stripe, Linear, and Xero. The visual hierarchy utilizes deep navy surfaces layered with 1px subtle borders, restrained gold accents (`#C9A24B`), and crisp typography.

**Core Rules**:
- **Zero "Plain Admin" Styling**: The main ERP application, Company Admin, Platform Super Admin, and SaaS Billing surfaces all utilize the identical Navy & Gold design tokens and component library.
- **Financial Number Integrity**: Every monetary figure must use tabular numerals (`tabular-nums`), right alignment in tables, and explicit currency indicators.
- **Clarity Over Clutter**: Generous whitespace governed by an 8pt grid, restrained shadows, and subtle micro-interactions (150–250ms).

---

## 2. DESIGN TOKENS (CSS VARIABLES)

The design system is powered by CSS custom properties defined in `apps/web/src/app/globals.css`:

### 2.1 Dark Navy Canvas & Surface Hierarchy
```css
--bg-main: #0B1220;          /* Root application background */
--bg-canvas: #080D18;        /* Deep background for sidebars and command bars */
--surface: #111A2E;          /* Standard card and container surface */
--surface-card: #121C32;     /* Elevated interactive card surface */
--surface-elevated: #16223A; /* Dropdowns, popovers, and floating modals */
--surface-hover: #1A2844;    /* Hover state for table rows and buttons */
--surface-subtle: rgba(22, 34, 58, 0.4);
```

### 2.2 Borders & Dividers
```css
--border: #22304D;                       /* Default structural divider */
--border-subtle: rgba(255, 255, 255, 0.07); /* Low-contrast inner borders */
--border-card: #1D2A44;                  /* Card perimeter border */
--border-card-hover: rgba(201, 162, 75, 0.35); /* Interactive gold glow border */
```

### 2.3 Typography & High-Contrast Text
```css
--text-primary: #F0F4FA;   /* Main headings, titles, and active data */
--text-secondary: #94A3B8; /* Column headers, subtitles, and secondary labels */
--text-muted: #7E8DA6;     /* Metadata, placeholders, and timestamps */
--text-faint: #4B5B76;     /* Disabled text and subtle hints */
```

### 2.4 Enterprise Gold Accent System
```css
--gold: #C9A24B;                       /* Primary brand accent & active states */
--gold-hover: #DFBF6E;                 /* Button hover and active highlights */
--gold-glow: rgba(201, 162, 75, 0.15); /* Focus rings and ambient glows */
--gold-dim: rgba(201, 162, 75, 0.08);  /* Subtle background pills */
```

### 2.5 Status & Feedback Colors
```css
--success: #2FBF8F;                      /* Balanced vouchers, paid invoices, profit */
--success-glow: rgba(47, 191, 143, 0.15);
--danger: #EC5A60;                       /* Unbalanced entries, overdue bills, errors */
--danger-glow: rgba(236, 90, 96, 0.15);
--warning: #E0A93B;                      /* Draft vouchers, upcoming due dates */
```

---

## 3. TYPOGRAPHY & TABULAR NUMERALS

- **Font Family**:
  - Latin & Default: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif` (or Inter / Plus Jakarta Sans).
  - Arabic (RTL): `"Segoe UI", Tahoma, "Noto Sans Arabic", Arial, sans-serif`.
  - Bengali: `"Noto Sans Bengali", sans-serif`.
  - Hindi: `"Noto Sans Devanagari", sans-serif`.
- **Tabular Figures Rule (`.tabular-nums`)**:
  - Every financial table, debit/credit column, exchange rate, and KPI card must apply:
    ```css
    font-variant-numeric: tabular-nums;
    font-feature-settings: "tnum" 1;
    ```
  - Aligns decimal points vertically across rows, preventing optical jitter during updates.

---

## 4. SPACING, LAYOUT & RESPONSIVENESS

- **8pt Grid System**: All margins, padding, and gap spacing use increments of 8px (`8px`, `16px`, `24px`, `32px`, `48px`).
- **Breakpoints**:
  - Mobile: `< 768px` (Collapsible slide-over drawer, single-column KPI cards, horizontal table scrolling).
  - Tablet: `768px - 1024px` (Two-column dashboard layout, compact sidebar).
  - Desktop: `> 1024px` (Full persistent sidebar, multi-column command grid, expanded data tables).
- **Asymmetric Command Grid**: High-priority financial charts and quick actions reside in a `1.6fr : 1fr` asymmetric layout to emphasize cash flow trends while keeping action buttons within one click.

---

## 5. ACCESSIBILITY, RTL & KEYBOARD NAVIGATION

- **Global Command Palette (`Ctrl+K`)**:
  - Powered by `cmdk`. Provides instant keyboard access to all pages, voucher creation screens, and company switching.
- **RTL Language Support (Arabic)**:
  - Triggered dynamically via `<html dir="rtl">`.
  - Uses CSS logical properties (`margin-inline-start`, `padding-inline-end`, `text-align: start`) to mirror navigation, tables, and chevron icons automatically.
- **Reduced Motion**:
  - All Framer Motion animations honor `@media (prefers-reduced-motion: reduce)`, disabling transform transitions while preserving opacity crossfades.

---

## 6. NON-FUNCTIONAL & "COMING SOON" SCREEN POLICY

- Genuinely unimplemented vertical modules (e.g., POS terminal, Restaurant tables, Manufacturing BOM) must **never display fake charts or mock transaction data**.
- Unimplemented views must render a standardized **EmptyState** with:
  - An outlined Lucide icon.
  - Clear heading: `"<Module Name> — Coming soon"`.
  - Subtitle explaining the planned capabilities and roadmap phase.
  - A primary button to return to the active Dashboard or General Ledger.

---

## 7. PROPOSED SHARED UI COMPONENT LIBRARY (DESIGN SPECIFICATION)

*Note: This section defines the architectural contract for the reusable component library. These components are specified here for review and will be implemented systematically.*

### 7.1 `DataTable<T>`
- **Responsibilities**: Displays paginated, sortable, and filterable financial records with fixed headers, sticky columns, row selection, and keyboard navigation.
- **Expected Interface**:
  ```typescript
  interface ColumnDef<T> {
    id: string;
    header: string | React.ReactNode;
    accessorKey?: keyof T;
    cell?: (row: T) => React.ReactNode;
    align?: 'left' | 'center' | 'right';
    isMonetary?: boolean;
    sortable?: boolean;
    width?: string | number;
  }
  
  interface DataTableProps<T> {
    columns: ColumnDef<T>[];
    data: T[];
    isLoading?: boolean;
    totalCount?: number;
    page?: number;
    pageSize?: number;
    onPageChange?: (page: number) => void;
    onRowClick?: (row: T) => void;
    emptyMessage?: string;
  }
  ```
- **Accessibility & Validation**:
  - Wraps table in `<table role="table" aria-label="...">` with appropriate `aria-sort`.
  - Tab navigation through rows; Enter key triggers row details modal.
  - Monetary columns automatically apply `.tabular-nums` and `text-align: right`.

### 7.2 `FormField`
- **Responsibilities**: Unifies input labeling, mandatory indicators, error messaging, helper text, and accessibility aria-describedby associations.
- **Expected Interface**:
  ```typescript
  interface FormFieldProps {
    label: string;
    name: string;
    required?: boolean;
    error?: string;
    helperText?: string;
    children: React.ReactNode;
  }
  ```
- **Validation**:
  - Automatically injects `aria-invalid={!!error}` and links `aria-errormessage`.
  - Renders red border on input when invalid with a smooth 150ms shake transition.

### 7.3 `Modal` (Dialog)
- **Responsibilities**: Accessible dialog overlay for voucher creation, invitations, confirmation dialogs, and support-access approval.
- **Expected Interface**:
  ```typescript
  interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    description?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    children: React.ReactNode;
    footer?: React.ReactNode;
  }
  ```
- **Accessibility**:
  - Traps focus inside the modal using `@radix-ui/react-dialog` or standard focus trap.
  - Escape key dismisses; background scroll is locked.
  - `role="dialog"` with `aria-modal="true"`.

### 7.4 `EmptyState`
- **Responsibilities**: Consistent feedback when lists are empty, filters yield no results, or modules are marked "Coming soon".
- **Expected Interface**:
  ```typescript
  interface EmptyStateProps {
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    description: string;
    actionLabel?: string;
    onAction?: () => void;
    badge?: string; // e.g. "Coming soon"
  }
  ```

### 7.5 `Skeleton`
- **Responsibilities**: Pulse animation placeholders matching exact layout dimensions of KPI cards, tables, and financial charts while data is fetching.
- **Expected Interface**:
  ```typescript
  interface SkeletonProps {
    className?: string;
    width?: string | number;
    height?: string | number;
    radius?: 'sm' | 'md' | 'lg' | 'full';
  }
  ```

### 7.6 `StatusPill`
- **Responsibilities**: Compact visual badges for status representation (e.g., `POSTED`, `DRAFT`, `VOID`, `TRIAL`, `ACTIVE`, `SUSPENDED`).
- **Expected Interface**:
  ```typescript
  interface StatusPillProps {
    status: 'draft' | 'posted' | 'void' | 'active' | 'suspended' | 'past_due' | 'trial';
    label?: string;
    size?: 'sm' | 'md';
  }
  ```
- **Styling**:
  - `posted` / `active`: Green border with `--success-glow` background.
  - `draft` / `trial`: Gold border with `--gold-dim` background.
  - `void` / `suspended`: Red border with `--danger-glow` background.

### 7.7 `MoneyInput`
- **Responsibilities**: Specialized monetary input enforcing decimal precision, preventing non-numeric inputs, and formatting with thousand separators upon blur.
- **Expected Interface**:
  ```typescript
  interface MoneyInputProps {
    value: string;
    onChange: (value: string) => void;
    currency?: string;
    minorUnits?: number; // default: 2
    allowNegative?: boolean;
    disabled?: boolean;
    placeholder?: string;
  }
  ```
- **Validation**:
  - Uses `@accounting/core` `toDecimal()` internally.
  - Rejects scientific notation (`e`), multiple decimal points, and invalid characters.
  - Automatically formats on blur: `12500.5` $\rightarrow$ `12,500.50`.

---

## 8. ADMIN & BILLING UI UNIFORMITY

- **Company Admin Screens** (`/settings`):
  - Team members table using `DataTable` with `StatusPill` for seat types (`full` vs `read_only`).
  - Invitation modal using `Modal` and `FormField`.
  - Company legal profile with instant validation.
- **Platform Super Admin Screens** (`/admin`):
  - Global tenant overview table using `DataTable` with sorting by MRR, user count, and storage.
  - Support-Access Grant modal requiring mandatory reason and duration selector (max 4 hours).
  - MFA verification prompt using high-security input fields.
- **Billing Management Screens** (`/settings/billing`):
  - Plan comparison cards with highlighted active tier.
  - Progress bar displaying seat consumption: `X of Y Full Seats in Use`.
  - Grace period / Suspension banners with one-click portal redirect.
