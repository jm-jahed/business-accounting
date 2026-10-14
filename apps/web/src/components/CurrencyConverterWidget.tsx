'use client';

import React, { useState, useMemo } from 'react';
import { ArrowLeftRight, Coins, RefreshCw } from 'lucide-react';
import { convertCurrency, SupportedCurrencyCode } from '@accounting/core';

// Supported currencies with typical demonstration exchange rates against AED base
const RATES_TO_AED: Record<SupportedCurrencyCode, string> = {
  AED: '1.0000',
  USD: '3.6725',
  EUR: '3.9850',
  BDT: '0.0312',
  INR: '0.0435',
  SAR: '0.9790',
};

export function CurrencyConverterWidget() {
  const [amount, setAmount] = useState('1000.00');
  const [fromCurr, setFromCurr] = useState<SupportedCurrencyCode>('USD');
  const [toCurr, setToCurr] = useState<SupportedCurrencyCode>('AED');

  const convertedResult = useMemo(() => {
    try {
      const fromRate = RATES_TO_AED[fromCurr] || '1.0';
      const toRate = RATES_TO_AED[toCurr] || '1.0';
      const effectiveRate = (parseFloat(fromRate) / parseFloat(toRate)).toFixed(4);
      const res = convertCurrency({
        amount: amount || '0',
        fromCurrency: fromCurr,
        toCurrency: toCurr,
        exchangeRate: effectiveRate,
      });
      return {
        amount: res.formattedConverted,
        rate: effectiveRate,
      };
    } catch {
      return { amount: '0.00', rate: '1.0000' };
    }
  }, [amount, fromCurr, toCurr]);

  const handleSwap = () => {
    setFromCurr(toCurr);
    setToCurr(fromCurr);
  };

  return (
    <div
      style={{
        backgroundColor: '#111A2E',
        border: '1px solid #1D2A44',
        borderRadius: '12px',
        padding: '18px 20px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '14px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Coins size={16} color="#C9A24B" />
          <span style={{ fontSize: '14px', fontWeight: 700, color: '#F0F4FA' }}>
            Multi-Currency Quick Converter
          </span>
        </div>
        <span
          style={{
            fontSize: '11px',
            color: '#2FBF8F',
            backgroundColor: 'rgba(47, 191, 143, 0.12)',
            padding: '2px 8px',
            borderRadius: '4px',
            fontWeight: 600,
          }}
        >
          Demonstration Rates
        </span>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr auto 1fr',
          gap: '10px',
          alignItems: 'center',
          marginBottom: '14px',
        }}
      >
        {/* From Input */}
        <div
          style={{
            backgroundColor: '#16223A',
            border: '1px solid #22304D',
            borderRadius: '8px',
            padding: '8px 12px',
          }}
        >
          <div style={{ fontSize: '11px', color: '#7E8DA6', marginBottom: '4px' }}>From</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: '#F0F4FA',
                fontWeight: 700,
                fontSize: '14px',
                width: '100%',
                fontFamily: 'monospace',
              }}
            />
            <select
              value={fromCurr}
              onChange={(e) => setFromCurr(e.target.value as SupportedCurrencyCode)}
              style={{
                backgroundColor: '#111A2E',
                border: '1px solid #22304D',
                color: '#DFBF6E',
                borderRadius: '5px',
                padding: '3px 6px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {Object.keys(RATES_TO_AED).map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Swap Button */}
        <button
          onClick={handleSwap}
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            backgroundColor: '#16223A',
            border: '1px solid #22304D',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#C9A24B',
            cursor: 'pointer',
            transition: 'transform 150ms ease',
          }}
          title="Swap currencies"
          onMouseEnter={(e) => (e.currentTarget.style.transform = 'rotate(180deg)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'rotate(0deg)')}
        >
          <ArrowLeftRight size={14} />
        </button>

        {/* To Result */}
        <div
          style={{
            backgroundColor: '#16223A',
            border: '1px solid #22304D',
            borderRadius: '8px',
            padding: '8px 12px',
          }}
        >
          <div style={{ fontSize: '11px', color: '#7E8DA6', marginBottom: '4px' }}>To (Estimated)</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
            <span
              style={{
                color: '#2FBF8F',
                fontWeight: 700,
                fontSize: '14px',
                fontFamily: 'monospace',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {convertedResult.amount}
            </span>
            <select
              value={toCurr}
              onChange={(e) => setToCurr(e.target.value as SupportedCurrencyCode)}
              style={{
                backgroundColor: '#111A2E',
                border: '1px solid #22304D',
                color: '#DFBF6E',
                borderRadius: '5px',
                padding: '3px 6px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {Object.keys(RATES_TO_AED).map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Subtle Metadata Footer (No internal technical jargon) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '11px',
          color: '#7E8DA6',
          borderTop: '1px solid #1D2A44',
          paddingTop: '8px',
        }}
      >
        <span>
          Indicative Exchange Rate: 1 {fromCurr} = {convertedResult.rate} {toCurr}
        </span>
        <span>Standard Round Half-Even Precision</span>
      </div>
    </div>
  );
}
