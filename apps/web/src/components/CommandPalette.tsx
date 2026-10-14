'use client';

import React, { useEffect } from 'react';
import { Command } from 'cmdk';
import {
  LayoutDashboard,
  Layers,
  BookOpen,
  Receipt,
  Settings,
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
          backgroundColor: '#111A2E',
          border: '1px solid #22304D',
          borderRadius: '12px',
          boxShadow: '0 20px 45px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(201, 162, 75, 0.2)',
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
              borderBottom: '1px solid #1D2A44',
            }}
          >
            <Search size={18} color="#C9A24B" />
            <Command.Input
              placeholder="Search accounts, journal vouchers, operations..."
              autoFocus
              style={{
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: '#F0F4FA',
                fontSize: '14px',
                width: '100%',
              }}
            />
            <button
              onClick={() => onOpenChange(false)}
              style={{
                background: 'none',
                border: 'none',
                color: '#7E8DA6',
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
                color: '#7E8DA6',
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
                color: '#8A97B2',
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
                  color: '#E6EAF2',
                  fontSize: '13px',
                  cursor: 'pointer',
                  marginBottom: '2px',
                }}
                className="cmdk-item"
              >
                <LayoutDashboard size={15} color="#C9A24B" />
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
                  color: '#E6EAF2',
                  fontSize: '13px',
                  cursor: 'pointer',
                  marginBottom: '2px',
                }}
                className="cmdk-item"
              >
                <Layers size={15} color="#2FBF8F" />
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
                  color: '#E6EAF2',
                  fontSize: '13px',
                  cursor: 'pointer',
                  marginBottom: '2px',
                }}
                className="cmdk-item"
              >
                <BookOpen size={15} color="#60A5FA" />
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
                  color: '#E6EAF2',
                  fontSize: '13px',
                  cursor: 'pointer',
                  marginBottom: '2px',
                }}
                className="cmdk-item"
              >
                <Receipt size={15} color="#F59E0B" />
                <span>Sales & Client Invoices (AR)</span>
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
                  color: '#E6EAF2',
                  fontSize: '13px',
                  cursor: 'pointer',
                  marginBottom: '2px',
                }}
                className="cmdk-item"
              >
                <Settings size={15} color="#8A97B2" />
                <span>Enterprise & Tenant Settings</span>
              </Command.Item>
            </Command.Group>

            {/* Quick Demonstration Actions */}
            <Command.Group
              heading="Demonstration Seed Vouchers"
              style={{
                fontSize: '11px',
                fontWeight: 600,
                color: '#8A97B2',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                padding: '8px 8px 4px',
                borderTop: '1px solid #1D2A44',
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
                  color: '#E6EAF2',
                  fontSize: '12px',
                  cursor: 'pointer',
                }}
                className="cmdk-item"
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontFamily: 'monospace', color: '#DFBF6E', fontWeight: 600 }}>JV-2026-0042</span>
                  <span>Commercial Sales Receipt #INV-1092</span>
                </div>
                <span style={{ color: '#2FBF8F', fontWeight: 600 }}>AED 15,400.00</span>
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
                  color: '#E6EAF2',
                  fontSize: '12px',
                  cursor: 'pointer',
                }}
                className="cmdk-item"
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontFamily: 'monospace', color: '#DFBF6E', fontWeight: 600 }}>JV-2026-0041</span>
                  <span>Office Rent & Utilities Allocation</span>
                </div>
                <span style={{ color: '#EC5A60', fontWeight: 600 }}>AED 8,250.00</span>
              </Command.Item>
            </Command.Group>
          </Command.List>

          {/* Footer Info */}
          <div
            style={{
              padding: '8px 14px',
              backgroundColor: '#0E1626',
              borderTop: '1px solid #1D2A44',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '11px',
              color: '#7E8DA6',
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
