'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Clock, ArrowLeft, Sparkles, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { SYSTEM_MENUS, MenuItem } from '@accounting/contracts';
import { useI18n } from '../i18n/context';

interface ComingSoonProps {
  storeSlug: string;
  path?: string;
  menuKey?: string;
  customLabelEn?: string;
  customLabelBn?: string;
  customDescriptionEn?: string;
  customDescriptionBn?: string;
  customAvailableAfterEn?: string;
  customAvailableAfterBn?: string;
}

function findMenuItem(path?: string, key?: string): { item?: MenuItem; parent?: MenuItem } {
  for (const menu of SYSTEM_MENUS) {
    if (path && menu.path === path) return { item: menu };
    if (key && menu.key === key) return { item: menu };
    if (menu.children) {
      for (const child of menu.children) {
        if (path && child.path === path) return { item: child, parent: menu };
        if (key && child.key === key) return { item: child, parent: menu };
      }
    }
  }
  return {};
}

function getPrerequisiteInfo(path?: string): { en: string; bn: string } {
  if (!path) {
    return {
      en: 'Available after the corresponding core business module is activated.',
      bn: 'সংশ্লিষ্ট কোর বিজনেস মডিউল সংযুক্ত হওয়ার পর এই ফিচারটি চালু হবে।',
    };
  }

  if (path.startsWith('/sell') || path.startsWith('/counter-sale')) {
    return {
      en: 'Available after Sales Invoicing, Point of Sale (POS), and Cash Drawer modules are activated.',
      bn: 'বিক্রয় চালান, পয়েন্ট অব সেল (POS) ও ক্যাশ ড্রয়ার মডিউল সংযুক্ত হলে এই সুবিধাটি চালু হবে।',
    };
  }
  if (path.startsWith('/buy')) {
    return {
      en: 'Available after Purchase Bills, Supplier Ledgers, and AP Settlement modules are activated.',
      bn: 'ক্রয় বিল, সরবরাহকারী খতিয়ান ও দেনা নিষ্পত্তি মডিউল সংযুক্ত হলে এই সুবিধাটি চালু হবে।',
    };
  }
  if (path.startsWith('/tasks')) {
    return {
      en: 'Available after Multi-User Workflow, Journal Approval Rules, and Task Routing are configured.',
      bn: 'ভাউচার অনুমোদন নীতিমালা, বহু-ব্যবহারকারী ওয়ার্কফ্লো ও টাস্ক রাউটিং কনফিগার হলে চালু হবে।',
    };
  }
  if (path.startsWith('/customers')) {
    return {
      en: 'Available after Customer Directory, Credit Limits, and Receivable Aging are enabled.',
      bn: 'কাস্টমার ডিরেক্টরি, ক্রেডিট লিমিট ও বকেয়া আদায় ট্র্যাকিং সংযুক্ত হলে চালু হবে।',
    };
  }
  if (path.startsWith('/stock')) {
    return {
      en: 'Available after Physical Stock Audit, Multi-Warehouse Transfers, and Stock Revaluation are enabled.',
      bn: 'শারীরিক মজুদ গণনা, গুদাম স্থানান্তর ও স্টক সমন্বয় ফিচার সংযুক্ত হলে চালু হবে।',
    };
  }
  if (path.startsWith('/production')) {
    return {
      en: 'Available after Manufacturing, Bill of Materials (BOM), and Waste Tracking module is activated in settings.',
      bn: 'সেটিংস থেকে উৎপাদন, রেসিপি (BOM) ও অপচয় পর্যবেক্ষণ মডিউল চালু করা হলে এই সুবিধাটি আসবে।',
    };
  }
  if (path.startsWith('/leads')) {
    return {
      en: 'Available after CRM Pipeline, Lead Scoring, and Quotation Conversion module is activated.',
      bn: 'সিআরএম পাইপলাইন, লিড রূপান্তর ও কোটেশন মডিউল সক্রিয় করা হলে চালু হবে।',
    };
  }
  if (path.startsWith('/jobs')) {
    return {
      en: 'Available after Job Costing, Project Milestone Budgets, and Timesheets module is activated.',
      bn: 'প্রজেক্ট কস্টিং, কাজের বাজেট ও কর্মী টাইমশিট মডিউল চালু করা হলে এই সুবিধাটি আসবে।',
    };
  }
  if (path.startsWith('/staff')) {
    return {
      en: 'Available after Payroll Engine, Biometric Attendance, and Leave Management module is activated.',
      bn: 'বেতন হিসাব, ডিজিটাল হাজিরা ও ছুটি ব্যবস্থাপনা মডিউল সংযুক্ত হলে এই সুবিধাটি চালু হবে।',
    };
  }
  if (path.startsWith('/reports')) {
    return {
      en: 'Available after Financial Period Closing, Tax Declaration, and Official Audit Engine are finalized.',
      bn: 'হিসাবকাল সমাপনী, ভ্যাট ট্যাক্স রিটার্ন ও অফিসিয়াল অডিট রিপোর্ট ইঞ্জিন চূড়ান্ত হলে চালু হবে।',
    };
  }
  if (path.startsWith('/import-export')) {
    return {
      en: 'Available after CSV/Excel Bulk Data Migration and Statutory Backup Exporter are enabled.',
      bn: 'এক্সেল ও সিএসভি বাল্ক ডেটা ইমপোর্ট এবং সংবিধিবদ্ধ ডেটা এক্সপোর্ট ইঞ্জিন সংযুক্ত হলে চালু হবে।',
    };
  }
  if (path.startsWith('/money')) {
    return {
      en: 'Available after Treasury Cheque Clearance, Tax Schedules, and Advanced Reconciliation are enabled.',
      bn: 'ব্যাংক চেক ক্লিয়ারেন্স, ট্যাক্স সময়সূচি ও সমন্বয় ইঞ্জিন সক্রিয় হলে চালু হবে।',
    };
  }
  if (path.startsWith('/settings')) {
    return {
      en: 'Available after Enterprise Multi-Branch Synchronization and Automated Cloud Backup are configured.',
      bn: 'এন্টারপ্রাইজ মাল্টি-ব্রাঞ্চ ডেটা সিনক্রোনাইজেশন ও ক্লাউড ব্যাকআপ ফিচার কনফিগার হলে চালু হবে।',
    };
  }

  return {
    en: 'Available after the corresponding core module is activated.',
    bn: 'সংশ্লিষ্ট কোর বিজনেস মডিউল সংযুক্ত হওয়ার পর এই ফিচারটি চালু হবে।',
  };
}

export function ComingSoon({
  storeSlug,
  path,
  menuKey,
  customLabelEn,
  customLabelBn,
  customDescriptionEn,
  customDescriptionBn,
  customAvailableAfterEn,
  customAvailableAfterBn,
}: ComingSoonProps) {
  const router = useRouter();
  const { locale } = useI18n();

  const { item, parent } = findMenuItem(path, menuKey);

  const labelEn = customLabelEn || item?.labelEn || 'Feature';
  const labelBn = customLabelBn || item?.labelBn || 'ফিচার';
  const parentLabel = parent ? (locale === 'bn' ? parent.labelBn : parent.labelEn) : null;

  const prereq = getPrerequisiteInfo(path || item?.path);
  const availableAfterEn = customAvailableAfterEn || prereq.en;
  const availableAfterBn = customAvailableAfterBn || prereq.bn;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        padding: '32px 16px',
      }}
    >
      <div
        className="erp-card"
        style={{
          maxWidth: '560px',
          width: '100%',
          backgroundColor: 'var(--surface-2)',
          border: '1px solid var(--border-card)',
          borderRadius: '16px',
          padding: '36px 32px',
          boxShadow: 'var(--shadow-elevated)',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Subtle decorative top border */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '3px',
            background: 'linear-gradient(90deg, transparent, var(--gold), transparent)',
          }}
        />

        {/* Icon Emblem */}
        <div
          style={{
            width: '60px',
            height: '60px',
            borderRadius: '14px',
            backgroundColor: 'var(--gold-dim)',
            border: '1px solid rgba(201, 162, 75, 0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
            color: 'var(--gold)',
            boxShadow: '0 4px 16px var(--gold-glow)',
          }}
        >
          <Clock size={28} />
        </div>

        {/* Parent Category Breadcrumb if applicable */}
        {parentLabel && (
          <div
            style={{
              fontSize: '11px',
              fontWeight: 600,
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: '6px',
            }}
          >
            {parentLabel}
          </div>
        )}

        {/* Dual Language Heading */}
        <h2
          style={{
            fontSize: '22px',
            fontWeight: 700,
            color: 'var(--text-ivory)',
            margin: '0 0 4px',
            letterSpacing: '-0.3px',
          }}
        >
          {labelEn}
        </h2>
        <div
          style={{
            fontSize: '16px',
            fontWeight: 600,
            color: 'var(--gold)',
            marginBottom: '16px',
          }}
        >
          {labelBn}
        </div>

        {/* Status Pill Badge */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '22px' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 12px',
              borderRadius: '20px',
              fontSize: '11px',
              fontWeight: 600,
              backgroundColor: 'rgba(201, 162, 75, 0.12)',
              color: 'var(--gold)',
              border: '1px solid rgba(201, 162, 75, 0.3)',
            }}
          >
            <Sparkles size={12} />
            <span>Coming Soon / শীঘ্রই আসছে</span>
          </span>
        </div>

        {/* Clear Explanation */}
        <p
          style={{
            fontSize: '14px',
            color: 'var(--text-secondary)',
            lineHeight: 1.6,
            margin: '0 0 16px',
          }}
        >
          {customDescriptionEn || 'This module is scheduled for upcoming release and is currently under active implementation.'}
        </p>
        <p
          style={{
            fontSize: '13px',
            color: 'var(--text-muted)',
            lineHeight: 1.6,
            margin: '0 0 24px',
          }}
        >
          {customDescriptionBn || 'এই অংশটি পরবর্তী আপডেটে উন্মুক্ত করা হবে। বর্তমানে এর ডেভেলপমেন্ট ও হিসাবের নিরাপত্তা পরীক্ষা চলছে।'}
        </p>

        {/* Prerequisites Information Box (Zero Fake Data Guarantee) */}
        <div
          style={{
            backgroundColor: 'var(--surface-3)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '10px',
            padding: '14px 16px',
            textAlign: 'start',
            marginBottom: '28px',
          }}
        >
          <div
            style={{
              fontSize: '11px',
              fontWeight: 700,
              color: 'var(--gold)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '6px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <CheckCircle2 size={13} />
            <span>Activation Dependency / পূর্বশর্ত</span>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '4px' }}>
            {availableAfterEn}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            {availableAfterBn}
          </div>
        </div>

        {/* Return to Dashboard Action */}
        <button
          onClick={() => router.push(`/${storeSlug}/dashboard`)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '10px 22px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, var(--gold-hover) 0%, var(--gold) 100%)',
            color: '#0B1220',
            fontWeight: 700,
            fontSize: '13px',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 2px 8px var(--gold-glow)',
            transition: 'transform 120ms ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-1px)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
        >
          <ArrowLeft size={16} />
          <span>Return to Dashboard / ড্যাশবোর্ডে ফিরুন</span>
        </button>
      </div>
    </div>
  );
}
