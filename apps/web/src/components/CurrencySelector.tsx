'use client';

import React, { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { Coins, ChevronDown, Check } from 'lucide-react';
import { useI18n } from '../i18n/context';
import { SupportedCurrencyCode, SUPPORTED_CURRENCIES } from '../i18n/types';

const CURRENCIES: SupportedCurrencyCode[] = ['AED', 'USD', 'BDT', 'INR', 'SAR', 'EUR'];

export function CurrencySelector() {
  const { displayCurrency, setDisplayCurrency, dict } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setFocusedIndex(-1);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sync focus when navigating via keyboard
  useEffect(() => {
    if (isOpen && focusedIndex >= 0 && itemRefs.current[focusedIndex]) {
      itemRefs.current[focusedIndex]?.focus();
    }
  }, [isOpen, focusedIndex]);

  const currentMeta = SUPPORTED_CURRENCIES[displayCurrency] || SUPPORTED_CURRENCIES.AED;

  // Localized currency name lookup
  const getCurrencyName = (code: SupportedCurrencyCode): string => {
    switch (code) {
      case 'AED':
        return dict.currency.aedName;
      case 'USD':
        return dict.currency.usdName;
      case 'BDT':
        return dict.currency.bdtName;
      case 'INR':
        return dict.currency.inrName;
      case 'SAR':
        return dict.currency.sarName;
      case 'EUR':
        return dict.currency.eurName;
      default:
        return code;
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setIsOpen(true);
        setFocusedIndex(CURRENCIES.indexOf(displayCurrency));
      }
      return;
    }

    switch (e.key) {
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setFocusedIndex(-1);
        buttonRef.current?.focus();
        break;
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex((prev) => (prev + 1) % CURRENCIES.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex((prev) => (prev - 1 + CURRENCIES.length) % CURRENCIES.length);
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (focusedIndex >= 0 && focusedIndex < CURRENCIES.length) {
          setDisplayCurrency(CURRENCIES[focusedIndex]);
          setIsOpen(false);
          setFocusedIndex(-1);
          buttonRef.current?.focus();
        }
        break;
      case 'Tab':
        setIsOpen(false);
        setFocusedIndex(-1);
        break;
    }
  };

  return (
    <div style={{ position: 'relative' }} ref={containerRef} onKeyDown={handleKeyDown}>
      <button
        id="currency-selector-btn"
        data-testid="currency-selector-btn"
        ref={buttonRef}
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) {
            setFocusedIndex(CURRENCIES.indexOf(displayCurrency));
          }
        }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 10px',
          backgroundColor: 'var(--surface-3)',
          border: '1px solid var(--border-card)',
          borderRadius: '7px',
          color: 'var(--text-primary)',
          fontSize: '12px',
          fontWeight: 500,
          boxShadow: 'var(--shadow-sm)',
          transition: 'all 150ms ease',
        }}
        aria-label={dict.currency.selectCurrency}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <Coins size={14} color="var(--gold)" />
        <span style={{ fontWeight: 600 }}>{displayCurrency}</span>
        <span style={{ color: 'var(--text-secondary)', fontSize: '11px' }}>
          (<bdi dir="ltr">{currentMeta.symbol}</bdi>)
        </span>
        <ChevronDown size={12} color="var(--text-secondary)" />
      </button>

      {isOpen && (
        <div
          role="listbox"
          aria-label={dict.currency.displayCurrencyTitle}
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            insetInlineEnd: 0,
            width: '240px',
            backgroundColor: 'var(--surface-2)',
            border: '1px solid var(--border-card)',
            borderRadius: '8px',
            boxShadow: 'var(--shadow-elevated)',
            padding: '8px',
            zIndex: 45,
          }}
        >
          <div
            style={{
              fontSize: '10px',
              fontWeight: 700,
              color: 'var(--text-muted)',
              letterSpacing: '0.5px',
              padding: '4px 8px 6px',
              borderBottom: '1px solid var(--border-subtle)',
              marginBottom: '4px',
            }}
          >
            {dict.currency.displayCurrencyTitle}
          </div>

          {CURRENCIES.map((code, index) => {
            const meta = SUPPORTED_CURRENCIES[code];
            const isSelected = displayCurrency === code;
            const isFocused = focusedIndex === index;
            const localizedName = getCurrencyName(code);

            return (
              <div
                key={code}
                ref={(el) => {
                  itemRefs.current[index] = el;
                }}
                role="option"
                aria-selected={isSelected}
                tabIndex={isSelected ? 0 : -1}
                onClick={() => {
                  setDisplayCurrency(code);
                  setIsOpen(false);
                  setFocusedIndex(-1);
                  buttonRef.current?.focus();
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '7px 10px',
                  borderRadius: '6px',
                  backgroundColor: isSelected
                    ? 'var(--surface-3)'
                    : isFocused
                    ? 'var(--gold-dim)'
                    : 'transparent',
                  color: isSelected ? 'var(--gold)' : 'var(--text-primary)',
                  cursor: 'pointer',
                  fontSize: '13px',
                  outline: 'none',
                  transition: 'background-color 120ms ease',
                }}
                onMouseEnter={() => setFocusedIndex(index)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                  <span style={{ fontWeight: 700, width: '32px', flexShrink: 0 }}>{code}</span>
                  <span
                    style={{
                      fontSize: '12px',
                      color: isSelected ? 'var(--gold)' : 'var(--text-secondary)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {localizedName}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                    <bdi dir="ltr">{meta.symbol}</bdi>
                  </span>
                  {isSelected && <Check size={14} color="var(--gold)" />}
                </div>
              </div>
            );
          })}

          <div
            style={{
              fontSize: '10px',
              color: 'var(--text-muted)',
              padding: '6px 8px 2px',
              borderTop: '1px solid var(--border-subtle)',
              marginTop: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span>{dict.currency.companyBaseNotice}</span>
          </div>
        </div>
      )}
    </div>
  );
}
