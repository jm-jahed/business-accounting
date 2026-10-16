'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  CheckCircle2,
  ShieldCheck,
  Building2,
  Calendar,
  Lock,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Scale,
  Info,
  Clock,
  Layers,
  ChevronDown,
  ChevronRight,
  Copy,
  Filter,
  Search,
  AlertTriangle,
  FileSpreadsheet,
  BookOpen,
  Receipt,
  CreditCard,
  Sparkles,
  TrendingDown,
  Landmark,
  Plus,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Toaster, toast } from 'sonner';
import dynamic from 'next/dynamic';
import { Badge, Button, Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui';
import { I18nProvider, useI18n } from '../i18n/context';
import { useAuth } from '../contexts/AuthContext';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import {
  ChartOfAccountsView,
  GeneralLedgerView,
  SalesInvoicesView,
  PurchasesView,
  ReportsView,
  TeamView,
  SettingsView,
  BankingView,
} from './TabViews';
import { Dashboard } from './Dashboard';
import { InventoryWorkspace } from './inventory/InventoryWorkspace';

// Lazy load heavy components
const CommandPalette = dynamic(
  () => import('./CommandPalette').then((m) => m.CommandPalette),
  { ssr: false }
);

export interface StoreWorkspaceProps {
  storeSlug?: string;
  initialPage?: string;
  activePath?: string;
  children?: React.ReactNode;
}

export function StoreWorkspace({
  storeSlug = 'barakah-enterprises',
  initialPage = 'dashboard',
  activePath,
  children,
}: StoreWorkspaceProps) {
  return (
    <I18nProvider>
      <StoreWorkspaceContent
        storeSlug={storeSlug}
        initialPage={initialPage}
        activePath={activePath}
        children={children}
      />
    </I18nProvider>
  );
}

function StoreWorkspaceContent({
  storeSlug,
  initialPage,
  activePath,
  children,
}: {
  storeSlug: string;
  initialPage: string;
  activePath?: string;
  children?: React.ReactNode;
}) {
  const router = useRouter();
  const { dict, locale, baseCurrency } = useI18n();

  // Normalize page name
  const canonicalPage = useMemo(() => {
    if (initialPage === 'coa') return 'accounts';
    if (initialPage === 'bills') return 'purchases';
    return initialPage || 'dashboard';
  }, [initialPage]);

  const { user, companies: authCompanies } = useAuth();
  const [activeTab, setActiveTab] = useState(canonicalPage);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(() => {
    return (
      storeSlug
        .split('-')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ') || 'Store Workspace'
    );
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [cmdOpen, setCmdOpen] = useState(false);

  useEffect(() => {
    setActiveTab(canonicalPage);
  }, [canonicalPage]);

  // Active store tenant entity definition from authorized session memberships
  const companiesList = useMemo(() => {
    if (authCompanies && authCompanies.length > 0) {
      return authCompanies.map((c) => ({
        name: c.name,
        slug: c.slug,
        branch: 'Main Branch',
        trn: `Role: ${c.role.toUpperCase()}`,
      }));
    }
    return [
      {
        name: selectedCompany,
        slug: storeSlug,
        branch: 'Main Branch',
        trn: 'Tenant Boundary Active',
      },
    ];
  }, [authCompanies, selectedCompany, storeSlug]);

  // Sync selected company name from authorized memberships or slug
  useEffect(() => {
    const matching = authCompanies?.find((c) => c.slug === storeSlug);
    if (matching) {
      setSelectedCompany(matching.name);
    } else {
      const derived = storeSlug
        .split('-')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
      setSelectedCompany(derived || 'Store Workspace');
    }
  }, [storeSlug, authCompanies]);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    router.push(`/${storeSlug}/${tabId}`);
  };

  const handleCompanyChange = (companyName: string, newSlug?: string) => {
    setSelectedCompany(companyName);
    if (newSlug && newSlug !== storeSlug) {
      toast.info(`Switching tenant to store: ${newSlug}`);
      router.push(`/${newSlug}/dashboard`);
    }
  };



  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        width: '100vw',
        overflow: 'hidden',
        backgroundColor: 'var(--bg-canvas)',
        color: 'var(--text-primary)',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      }}
    >
      <Toaster position="top-right" richColors />

      <CommandPalette
        open={cmdOpen}
        onOpenChange={setCmdOpen}
        onSelectTab={(tab) => {
          handleTabChange(tab);
          toast.info(`Switched to ${tab.toUpperCase()} view`);
        }}
      />

      {/* Responsive Enterprise Sidebar with canonical store URLs */}
      <Sidebar
        storeSlug={storeSlug}
        activeTab={activeTab}
        activePath={activePath}
        onTabChange={handleTabChange}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Enterprise Top Navigation Bar */}
        <Header
          storeSlug={storeSlug}
          onOpenMobile={() => setMobileOpen(true)}
          selectedCompany={selectedCompany}
          onSelectCompany={handleCompanyChange}
          companiesList={companiesList}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onOpenCommandPalette={() => setCmdOpen(true)}
        />

        {/* Dynamic Workspace Container */}
        <main style={{ flex: 1, padding: '20px 24px 32px', overflowY: 'auto' }}>
          {children ? (
            <motion.div
              key={activePath || 'custom-child'}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.18 }}
            >
              {children}
            </motion.div>
          ) : (
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.18 }}
            >
            {(activeTab === 'accounts' || activeTab === 'coa') && (
              <ChartOfAccountsView
                storeSlug={storeSlug}
                companyId={authCompanies?.find((c) => c.slug === storeSlug)?.companyId}
                userRole={authCompanies?.find((c) => c.slug === storeSlug)?.role}
                currency={authCompanies?.find((c) => c.slug === storeSlug)?.currency || baseCurrency}
              />
            )}
            {activeTab === 'ledger' && <GeneralLedgerView />}
            {activeTab === 'sales' && <SalesInvoicesView />}
            {(activeTab === 'purchases' || activeTab === 'bills') && <PurchasesView />}
            {activeTab === 'inventory' && (
              <InventoryWorkspace
                storeSlug={storeSlug}
                companyId={authCompanies?.find((c) => c.slug === storeSlug)?.companyId}
                currency={authCompanies?.find((c) => c.slug === storeSlug)?.currency || baseCurrency}
              />
            )}
            {activeTab === 'banking' && <BankingView />}
            {activeTab === 'reports' && <ReportsView />}
            {activeTab === 'team' && <TeamView />}
            {activeTab === 'settings' && <SettingsView />}

            {/* Default Primary Financial Dashboard */}
            {activeTab === 'dashboard' && (
              <Dashboard
                companyId={authCompanies?.find((c) => c.slug === storeSlug)?.companyId}
                storeSlug={storeSlug}
                userRole={authCompanies?.find((c) => c.slug === storeSlug)?.role}
                currency={authCompanies?.find((c) => c.slug === storeSlug)?.currency || baseCurrency}
                onNavigateTab={handleTabChange}
              />
            )}
          </motion.div>
          )}
        </main>
      </div>
    </div>
  );
}
