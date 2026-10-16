'use client';

import React, { useEffect } from 'react';
import { Command } from 'cmdk';
import {
  LayoutDashboard,
  Layers,
  BookOpen,
  Receipt,
  Settings,
  Boxes,
  X,
  Search,
  FileSpreadsheet,
  CheckCircle2,
} from 'lucide-react';

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectTab: (tabId: string) => void;
}

export function CommandPalette({ open, onOpenChange, onSelectTab }: CommandPaletteProps) {
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
      if (e.key === 'Escape' && open) {
        e.preventDefault();
        onOpenChange(false);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(7, 12, 22, 0.75)',
        backdropFilter: 'blur(8px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '12vh',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onOpenChange(false);
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '560px',
          backgroundColor: 'var(--surface-2)',
          border: '1px solid var(--border-card)',
          borderRadius: '12px',
          boxShadow: 'var(--shadow-elevated)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Command label="Global Command Menu">
          {/* Header & Input */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '14px 16px',
              borderBottom: '1px solid var(--border-subtle)',
            }}
          >
            <Search size={18} color="var(--gold)" />
            <Command.Input
              placeholder="Search accounts, journal vouchers, operations..."
              autoFocus
              style={{
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: 'var(--text-primary)',
                fontSize: '14px',
                width: '100%',
              }}
            />
            <button
              onClick={() => onOpenChange(false)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '2px',
              }}
            >
              <X size={18} />
            </button>
          </div>

          {/* Results List */}
          <Command.List
            style={{
              maxHeight: '340px',
              overflowY: 'auto',
              padding: '10px',
            }}
          >
            <Command.Empty
              style={{
                padding: '24px',
                textAlign: 'center',
                color: 'var(--text-muted)',
                fontSize: '13px',
              }}
            >
              No matching records or commands found.
            </Command.Empty>

            {/* Navigation Group */}
            <Command.Group
              heading="Workspace Navigation"
              style={{
                fontSize: '11px',
                fontWeight: 600,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                padding: '6px 8px',
              }}
            >
              <Command.Item
                onSelect={() => {
                  onSelectTab('dashboard');
                  onOpenChange(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '9px 12px',
                  borderRadius: '7px',
                  color: 'var(--text-primary)',
                  fontSize: '13px',
                  cursor: 'pointer',
                  marginBottom: '2px',
                }}
                className="cmdk-item"
              >
                <LayoutDashboard size={15} color="var(--gold)" />
                <span>Financial Overview Dashboard</span>
              </Command.Item>

              <Command.Item
                onSelect={() => {
                  onSelectTab('coa');
                  onOpenChange(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '9px 12px',
                  borderRadius: '7px',
                  color: 'var(--text-primary)',
                  fontSize: '13px',
                  cursor: 'pointer',
                  marginBottom: '2px',
                }}
                className="cmdk-item"
              >
                <Layers size={15} color="var(--success)" />
                <span>Chart of Accounts (17 Standard Accounts)</span>
              </Command.Item>

              <Command.Item
                onSelect={() => {
                  onSelectTab('ledger');
                  onOpenChange(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '9px 12px',
                  borderRadius: '7px',
                  color: 'var(--text-primary)',
                  fontSize: '13px',
                  cursor: 'pointer',
                  marginBottom: '2px',
                }}
                className="cmdk-item"
              >
                <BookOpen size={15} color="var(--info)" />
                <span>General Ledger & Journal Entries</span>
              </Command.Item>

              <Command.Item
                onSelect={() => {
                  onSelectTab('sales');
                  onOpenChange(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '9px 12px',
                  borderRadius: '7px',
                  color: 'var(--text-primary)',
                  fontSize: '13px',
                  cursor: 'pointer',
                  marginBottom: '2px',
                }}
                className="cmdk-item"
              >
                <Receipt size={15} color="var(--warning)" />
                <span>Sales & Client Invoices (AR)</span>
              </Command.Item>

              <Command.Item
                onSelect={() => {
                  onSelectTab('inventory');
                  onOpenChange(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '9px 12px',
                  borderRadius: '7px',
                  color: 'var(--text-primary)',
                  fontSize: '13px',
                  cursor: 'pointer',
                  marginBottom: '2px',
                }}
                className="cmdk-item"
              >
                <Boxes size={15} color="var(--gold)" />
                <span>Inventory & Warehouses (Stock Control)</span>
              </Command.Item>

              <Command.Item
                onSelect={() => {
                  onSelectTab('settings');
                  onOpenChange(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '9px 12px',
                  borderRadius: '7px',
                  color: 'var(--text-primary)',
                  fontSize: '13px',
                  cursor: 'pointer',
                  marginBottom: '2px',
                }}
                className="cmdk-item"
              >
                <Settings size={15} color="var(--text-secondary)" />
                <span>Enterprise & Tenant Settings</span>
              </Command.Item>
            </Command.Group>

            {/* Quick Demonstration Actions */}
            <Command.Group
              heading="Demonstration Seed Vouchers"
              style={{
                fontSize: '11px',
                fontWeight: 600,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                padding: '8px 8px 4px',
                borderTop: '1px solid var(--border-subtle)',
                marginTop: '6px',
              }}
            >
              <Command.Item
                onSelect={() => {
                  onSelectTab('ledger');
                  onOpenChange(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  borderRadius: '7px',
                  color: 'var(--text-primary)',
                  fontSize: '12px',
                  cursor: 'pointer',
                }}
                className="cmdk-item"
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontFamily: 'monospace', color: 'var(--gold)', fontWeight: 600 }}>JV-2026-0042</span>
                  <span>Commercial Sales Receipt #INV-1092</span>
                </div>
                <span style={{ color: 'var(--success)', fontWeight: 600 }}>AED 15,400.00</span>
              </Command.Item>

              <Command.Item
                onSelect={() => {
                  onSelectTab('ledger');
                  onOpenChange(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  borderRadius: '7px',
                  color: 'var(--text-primary)',
                  fontSize: '12px',
                  cursor: 'pointer',
                }}
                className="cmdk-item"
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontFamily: 'monospace', color: 'var(--gold)', fontWeight: 600 }}>JV-2026-0041</span>
                  <span>Office Rent & Utilities Allocation</span>
                </div>
                <span style={{ color: 'var(--danger)', fontWeight: 600 }}>AED 8,250.00</span>
              </Command.Item>
            </Command.Group>
          </Command.List>

          {/* Footer Info */}
          <div
            style={{
              padding: '8px 14px',
              backgroundColor: 'var(--surface-3)',
              borderTop: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '11px',
              color: 'var(--text-muted)',
            }}
          >
            <span>Navigate with ↑ ↓ and Enter</span>
            <span>ESC to close</span>
          </div>
        </Command>
      </div>
    </div>
  );
}
