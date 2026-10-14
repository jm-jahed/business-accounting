'use client';

import React from 'react';
import { LanguageSelector } from './LanguageSelector';
import { CurrencySelector } from './CurrencySelector';

export { LanguageSelector, CurrencySelector };

export function LanguageCurrencySelector() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <LanguageSelector />
      <CurrencySelector />
    </div>
  );
}
