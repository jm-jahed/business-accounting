'use client';

import React, { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { Globe, ChevronDown, Check } from 'lucide-react';
import { useI18n } from '../i18n/context';
import { Locale } from '../i18n/types';

export function LanguageSelector() {
  const { locale, setLocale, locales, dict } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  const localeKeys = Object.keys(locales) as Locale[];

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

  useEffect(() => {
    if (isOpen && focusedIndex >= 0 && itemRefs.current[focusedIndex]) {
      itemRefs.current[focusedIndex]?.focus();
    }
  }, [isOpen, focusedIndex]);

  const current = locales[locale] || locales.en;

  const handleKeyDown = (e: KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setIsOpen(true);
        setFocusedIndex(localeKeys.indexOf(locale));
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
        setFocusedIndex((prev) => (prev + 1) % localeKeys.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex((prev) => (prev - 1 + localeKeys.length) % localeKeys.length);
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (focusedIndex >= 0 && focusedIndex < localeKeys.length) {
          setLocale(localeKeys[focusedIndex]);
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
        ref={buttonRef}
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) {
            setFocusedIndex(localeKeys.indexOf(locale));
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
        aria-label={dict.header.language}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <Globe size={14} color="var(--gold)" />
        <span>{current.nativeName}</span>
        <ChevronDown size={12} color="var(--text-secondary)" />
      </button>

      {isOpen && (
        <div
          role="listbox"
          aria-label={dict.header.language}
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            insetInlineEnd: 0,
            width: '220px',
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
            {dict.header.language.toUpperCase()}
          </div>
          {localeKeys.map((key, index) => {
            const item = locales[key];
            const isSelected = locale === key;
            const isFocused = focusedIndex === index;

            return (
              <div
                key={key}
                ref={(el) => {
                  itemRefs.current[index] = el;
                }}
                role="option"
                aria-selected={isSelected}
                tabIndex={isSelected ? 0 : -1}
                onClick={() => {
                  setLocale(key);
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontWeight: isSelected ? 600 : 400 }}>{item.nativeName}</span>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>({item.label})</span>
                </div>
                {isSelected && <Check size={14} color="var(--gold)" />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
