'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Lock,
  AlertCircle,
  Check,
  Building2,
  Trash2,
  Save,
  HelpCircle,
} from 'lucide-react';
import type {
  AccountResponseDto,
  AccountType,
  CreateAccountInput,
  UpdateAccountInput,
} from '@accounting/contracts';
import { getNormalBalanceForAccountType } from '@accounting/contracts';

interface AccountDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreateAccountInput | UpdateAccountInput, accountId?: string) => Promise<void>;
  onDeactivate?: (accountId: string) => Promise<void>;
  accountToEdit?: AccountResponseDto | null;
  existingAccounts: AccountResponseDto[];
  userRole?: string;
  currency?: string;
}

const ACCOUNT_TYPES: Array<{ type: AccountType; label: string; desc: string }> = [
  { type: 'ASSET', label: 'Asset', desc: 'Economic resources owned (Cash, AR, Inventory, Equipment)' },
  { type: 'LIABILITY', label: 'Liability', desc: 'Obligations owed to third parties (AP, VAT Payable, Loans)' },
  { type: 'EQUITY', label: 'Equity', desc: "Owner's capital, retained earnings, contributions" },
  { type: 'REVENUE', label: 'Revenue', desc: 'Income earned from operations and sales' },
  { type: 'EXPENSE', label: 'Expense', desc: 'Operating costs incurred to generate revenue (COGS, Rent, Salaries)' },
];

export function AccountDrawer({
  isOpen,
  onClose,
  onSave,
  onDeactivate,
  accountToEdit,
  existingAccounts,
  userRole = 'owner',
  currency = 'AED',
}: AccountDrawerProps) {
  const isEditMode = Boolean(accountToEdit);

  const [type, setType] = useState<AccountType>('ASSET');
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [parentId, setParentId] = useState<string>('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false);
  const [isDeactivating, setIsDeactivating] = useState(false);

  // Derived normal balance from domain kernel logic
  const normalBalance = useMemo(() => getNormalBalanceForAccountType(type), [type]);

  // Reset form when drawer opens or accountToEdit changes
  useEffect(() => {
    if (isOpen) {
      setErrorMsg(null);
      setShowDeactivateConfirm(false);
      if (accountToEdit) {
        setType(accountToEdit.type);
        setCode(accountToEdit.code);
        setName(accountToEdit.name);
        setParentId(accountToEdit.parentId || '');
        setDescription(accountToEdit.description || '');
      } else {
        setType('ASSET');
        setCode('');
        setName('');
        setParentId('');
        setDescription('');
      }
    }
  }, [isOpen, accountToEdit]);

  // Filter eligible parent accounts: must match same account type and cannot be self
  const eligibleParents = useMemo(() => {
    return existingAccounts.filter((acc) => {
      if (acc.type !== type) return false;
      if (accountToEdit && acc.id === accountToEdit.id) return false;
      if (!acc.isActive) return false;
      return true;
    });
  }, [existingAccounts, type, accountToEdit]);

  // Client validation
  const validationError = useMemo(() => {
    const trimmedCode = code.trim();
    const trimmedName = name.trim();

    if (!trimmedCode) return 'Account code is required.';
    if (!/^[0-9A-Za-z._-]+$/.test(trimmedCode)) {
      return 'Account code must be alphanumeric with optional dots, hyphens, or underscores.';
    }
    if (trimmedCode.length > 20) return 'Account code cannot exceed 20 characters.';
    if (!trimmedName) return 'Account name is required.';
    if (trimmedName.length < 2) return 'Account name must be at least 2 characters.';
    if (trimmedName.length > 100) return 'Account name cannot exceed 100 characters.';
    return null;
  }, [code, name]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validationError) {
      setErrorMsg(validationError);
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      if (isEditMode && accountToEdit) {
        const updatePayload: UpdateAccountInput = {
          name: name.trim(),
          description: description.trim() || undefined,
          parentId: parentId ? parentId : null,
        };
        // System account code is immutable
        if (!accountToEdit.isSystem && code.trim() !== accountToEdit.code) {
          updatePayload.code = code.trim();
        }
        await onSave(updatePayload, accountToEdit.id);
      } else {
        const createPayload: CreateAccountInput = {
          code: code.trim(),
          name: name.trim(),
          type,
          parentId: parentId ? parentId : null,
          currency: currency || 'AED',
          description: description.trim() || undefined,
        };
        await onSave(createPayload);
      }
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save account. Please verify input data.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeactivate = async () => {
    if (!accountToEdit || !onDeactivate) return;
    setIsDeactivating(true);
    setErrorMsg(null);
    try {
      await onDeactivate(accountToEdit.id);
      setShowDeactivateConfirm(false);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to deactivate account.');
      setShowDeactivateConfirm(false);
    } finally {
      setIsDeactivating(false);
    }
  };

  const canDeactivate =
    isEditMode &&
    accountToEdit &&
    !accountToEdit.isSystem &&
    accountToEdit.isActive &&
    ['owner', 'admin'].includes(userRole);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(5, 10, 20, 0.72)',
              backdropFilter: 'blur(3px)',
              zIndex: 1000,
            }}
          />

          {/* Slide-over Drawer Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            style={{
              position: 'fixed',
              top: 0,
              right: 0,
              bottom: 0,
              width: '100%',
              maxWidth: '520px',
              backgroundColor: '#0E1626',
              borderLeft: '1px solid #1D2A44',
              boxShadow: '-8px 0 24px rgba(0, 0, 0, 0.45)',
              zIndex: 1001,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Drawer Header */}
            <div
              style={{
                padding: '20px 24px',
                borderBottom: '1px solid #1D2A44',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: '#111A2E',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Building2 size={18} color="#C9A24B" />
                  <h2 style={{ fontSize: '17px', fontWeight: 700, color: '#F0F4FA', margin: 0 }}>
                    {isEditMode ? 'Edit Account' : 'New Chart of Account'}
                  </h2>
                </div>
                <p style={{ fontSize: '12px', color: '#8A97B2', margin: '4px 0 0' }}>
                  {isEditMode
                    ? `Account ${accountToEdit?.code} — ${accountToEdit?.name}`
                    : 'Create a new ledger account within your tenant chart'}
                </p>
              </div>

              <button
                type="button"
                onClick={onClose}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#7E8DA6',
                  cursor: 'pointer',
                  padding: '6px',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                title="Close drawer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSubmit} style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
              {errorMsg && (
                <div
                  style={{
                    backgroundColor: 'rgba(236, 90, 96, 0.12)',
                    border: '1px solid rgba(236, 90, 96, 0.35)',
                    borderRadius: '8px',
                    padding: '12px 14px',
                    marginBottom: '20px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                  }}
                >
                  <AlertCircle size={16} color="#EC5A60" style={{ marginTop: '2px', flexShrink: 0 }} />
                  <div style={{ fontSize: '12px', color: '#FCA5A5', lineHeight: '1.4' }}>{errorMsg}</div>
                </div>
              )}

              {/* Account Type Selector */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#DFBF6E', marginBottom: '8px' }}>
                  ACCOUNT CLASSIFICATION (TYPE)
                </label>
                {isEditMode ? (
                  <div
                    style={{
                      padding: '10px 14px',
                      backgroundColor: '#16223A',
                      border: '1px solid #22304D',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: '#F0F4FA' }}>{type}</span>
                      <div style={{ fontSize: '11px', color: '#7E8DA6', marginTop: '2px' }}>
                        Classification is permanently immutable to safeguard journal integrity.
                      </div>
                    </div>
                    <Lock size={14} color="#C9A24B" />
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                    {ACCOUNT_TYPES.map((t) => {
                      const isSelected = type === t.type;
                      return (
                        <button
                          key={t.type}
                          type="button"
                          onClick={() => {
                            setType(t.type);
                            setParentId(''); // reset parent if type switches
                          }}
                          style={{
                            padding: '10px 12px',
                            textAlign: 'start',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            backgroundColor: isSelected ? 'rgba(201, 162, 75, 0.14)' : '#111A2E',
                            border: isSelected ? '1px solid #C9A24B' : '1px solid #1D2A44',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <div style={{ fontSize: '12px', fontWeight: 700, color: isSelected ? '#DFBF6E' : '#F0F4FA' }}>
                            {t.label}
                          </div>
                          <div style={{ fontSize: '10px', color: '#7E8DA6', marginTop: '2px' }}>
                            {t.type}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Server-Derived Normal Balance Display */}
              <div
                style={{
                  backgroundColor: 'rgba(22, 34, 58, 0.7)',
                  border: '1px solid #22304D',
                  borderRadius: '8px',
                  padding: '12px 14px',
                  marginBottom: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: '#8A97B2', textTransform: 'uppercase' }}>
                    Fundamental Normal Balance
                  </div>
                  <div style={{ fontSize: '11px', color: '#7E8DA6', marginTop: '2px' }}>
                    Auto-derived by kernel based on accounting equation
                  </div>
                </div>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '4px 10px',
                    borderRadius: '5px',
                    fontSize: '12px',
                    fontWeight: 700,
                    backgroundColor: normalBalance === 'DEBIT' ? 'rgba(47, 191, 143, 0.12)' : 'rgba(96, 165, 250, 0.12)',
                    color: normalBalance === 'DEBIT' ? '#2FBF8F' : '#60A5FA',
                    border: normalBalance === 'DEBIT' ? '1px solid rgba(47, 191, 143, 0.3)' : '1px solid rgba(96, 165, 250, 0.3)',
                  }}
                >
                  <Check size={12} /> {normalBalance}
                </span>
              </div>

              {/* Account Code */}
              <div style={{ marginBottom: '18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#DFBF6E' }}>
                    ACCOUNT CODE *
                  </label>
                  {isEditMode && accountToEdit?.isSystem && (
                    <span style={{ fontSize: '10px', color: '#DFBF6E', display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <Lock size={10} /> Protected System Account
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  value={code}
                  disabled={isEditMode && accountToEdit?.isSystem}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="e.g. 1010, 1020, 2010"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    backgroundColor: isEditMode && accountToEdit?.isSystem ? '#16223A' : '#111A2E',
                    border: '1px solid #1D2A44',
                    borderRadius: '8px',
                    color: '#F0F4FA',
                    fontSize: '13px',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                  required
                />
                <span style={{ fontSize: '11px', color: '#7E8DA6', marginTop: '4px', display: 'block' }}>
                  Unique numeric or alphanumeric identifier within company
                </span>
              </div>

              {/* Account Name */}
              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#DFBF6E', marginBottom: '6px' }}>
                  ACCOUNT NAME *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Operating Checking Account"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    backgroundColor: '#111A2E',
                    border: '1px solid #1D2A44',
                    borderRadius: '8px',
                    color: '#F0F4FA',
                    fontSize: '13px',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                  required
                />
              </div>

              {/* Parent Account Selector */}
              <div style={{ marginBottom: '18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#DFBF6E' }}>
                    PARENT ACCOUNT (SUB-ACCOUNT OF)
                  </label>
                  <span style={{ fontSize: '10px', color: '#7E8DA6' }}>Optional</span>
                </div>
                <select
                  value={parentId}
                  onChange={(e) => setParentId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    backgroundColor: '#111A2E',
                    border: '1px solid #1D2A44',
                    borderRadius: '8px',
                    color: '#F0F4FA',
                    fontSize: '13px',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                >
                  <option value="">None (Top-Level Account)</option>
                  {eligibleParents.map((parent) => (
                    <option key={parent.id} value={parent.id}>
                      {parent.code} — {parent.name} ({parent.type})
                    </option>
                  ))}
                </select>
                <span style={{ fontSize: '11px', color: '#7E8DA6', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <HelpCircle size={11} /> Only accounts of the same type ({type}) may be selected as parents.
                </span>
              </div>

              {/* Description */}
              <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#DFBF6E' }}>
                    DESCRIPTION & ACCOUNTING MEMO
                  </label>
                  <span style={{ fontSize: '10px', color: '#7E8DA6' }}>Optional</span>
                </div>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Explain usage, restrictions, or accounting purpose..."
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    backgroundColor: '#111A2E',
                    border: '1px solid #1D2A44',
                    borderRadius: '8px',
                    color: '#F0F4FA',
                    fontSize: '13px',
                    outline: 'none',
                    boxSizing: 'border-box',
                    resize: 'vertical',
                  }}
                />
              </div>

              {/* Deactivation Safeguard in Edit Mode */}
              {canDeactivate && (
                <div
                  style={{
                    marginTop: '20px',
                    padding: '16px',
                    backgroundColor: 'rgba(236, 90, 96, 0.05)',
                    border: '1px solid rgba(236, 90, 96, 0.2)',
                    borderRadius: '8px',
                  }}
                >
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#EC5A60', marginBottom: '4px' }}>
                    Deactivate Account
                  </div>
                  <p style={{ fontSize: '12px', color: '#8A97B2', margin: '0 0 12px' }}>
                    Deactivating prevents new transactions from posting to this account while preserving all historical journal lines. Hard deletion is prohibited.
                  </p>

                  {showDeactivateConfirm ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={handleDeactivate}
                        disabled={isDeactivating}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '6px',
                          backgroundColor: '#EC5A60',
                          border: 'none',
                          color: '#FFFFFF',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        {isDeactivating ? 'Deactivating...' : 'Confirm Deactivation'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowDeactivateConfirm(false)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '6px',
                          backgroundColor: 'transparent',
                          border: '1px solid #1D2A44',
                          color: '#8A97B2',
                          fontSize: '12px',
                          cursor: 'pointer',
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowDeactivateConfirm(true)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        backgroundColor: 'transparent',
                        border: '1px solid rgba(236, 90, 96, 0.35)',
                        color: '#EC5A60',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <Trash2 size={13} /> Deactivate This Account
                    </button>
                  )}
                </div>
              )}
            </form>

            {/* Drawer Footer */}
            <div
              style={{
                padding: '16px 24px',
                borderTop: '1px solid #1D2A44',
                backgroundColor: '#111A2E',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: '12px',
              }}
            >
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                style={{
                  padding: '9px 18px',
                  borderRadius: '6px',
                  backgroundColor: 'transparent',
                  border: '1px solid #1D2A44',
                  color: '#8A97B2',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting || Boolean(validationError)}
                style={{
                  padding: '9px 20px',
                  borderRadius: '6px',
                  backgroundColor: validationError ? '#2A3C60' : '#C9A24B',
                  border: 'none',
                  color: validationError ? '#7E8DA6' : '#0B1220',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: validationError ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: validationError ? 'none' : '0 2px 8px rgba(201, 162, 75, 0.25)',
                }}
              >
                <Save size={14} />
                <span>{isSubmitting ? 'Saving...' : isEditMode ? 'Update Account' : 'Create Account'}</span>
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
