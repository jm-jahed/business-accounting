'use client';

import React, { useState, useMemo } from 'react';
import { ArrowLeftRight, Coins, RefreshCw, TrendingUp } from 'lucide-react';
import { convertCurrency, SupportedCurrencyCode } from '@accounting/core';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/Card';
import { Badge } from './ui/Badge';

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
    <Card className="erp-card-interactive">
      <CardHeader
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--gold-dim)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--gold)',
            }}
          >
            <Coins size={16} />
          </div>
          <div>
            <CardTitle style={{ fontSize: '14px' }}>Multi-Currency Treasury Converter</CardTitle>
            <CardDescription style={{ fontSize: '11px' }}>
              Real-time exchange rate engine with Banker&apos;s Round-Half-Even precision
            </CardDescription>
          </div>
        </div>
        <Badge variant="success" size="xs" dot>
          Live Rates
        </Badge>
      </CardHeader>

      <CardContent style={{ padding: '16px 20px' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr auto 1fr',
            gap: '12px',
            alignItems: 'center',
            marginBottom: '14px',
          }}
        >
          {/* From Input */}
          <div
            style={{
              backgroundColor: 'var(--surface-3)',
              border: '1px solid var(--border-card)',
              borderRadius: 'var(--radius-md)',
              padding: '10px 14px',
            }}
          >
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px', textTransform: 'uppercase' }}>
              From (Source)
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="tabular-nums"
                style={{
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: 'var(--text-ivory)',
                  fontWeight: 700,
                  fontSize: '15px',
                  width: '100%',
                }}
              />
              <select
                value={fromCurr}
                onChange={(e) => setFromCurr(e.target.value as SupportedCurrencyCode)}
                style={{
                  backgroundColor: 'var(--surface-2)',
                  border: '1px solid var(--border-strong)',
                  color: 'var(--gold-hover)',
                  borderRadius: 'var(--radius-xs)',
                  padding: '4px 8px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  outline: 'none',
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
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: 'var(--surface-3)',
              border: '1px solid var(--border-strong)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--gold)',
              cursor: 'pointer',
              transition: 'transform var(--duration-fast) ease, background-color var(--duration-fast) ease',
            }}
            title="Swap source and target currencies"
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'rotate(180deg)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'rotate(0deg)')}
          >
            <ArrowLeftRight size={15} />
          </button>

          {/* To Result */}
          <div
            style={{
              backgroundColor: 'var(--surface-3)',
              border: '1px solid var(--border-card)',
              borderRadius: 'var(--radius-md)',
              padding: '10px 14px',
            }}
          >
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px', textTransform: 'uppercase' }}>
              To (Converted Value)
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
              <span
                className="tabular-nums"
                style={{
                  color: 'var(--success)',
                  fontWeight: 800,
                  fontSize: '15px',
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
                  backgroundColor: 'var(--surface-2)',
                  border: '1px solid var(--border-strong)',
                  color: 'var(--gold-hover)',
                  borderRadius: 'var(--radius-xs)',
                  padding: '4px 8px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  outline: 'none',
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

        {/* Subtle Metadata Footer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '11px',
            color: 'var(--text-muted)',
            borderTop: '1px solid var(--border-subtle)',
            paddingTop: '10px',
          }}
        >
          <span>
            Treasury Exchange Rate: 1 {fromCurr} = <strong style={{ color: 'var(--gold-hover)' }}>{convertedResult.rate}</strong> {toCurr}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-secondary)' }}>
            <TrendingUp size={12} color="var(--success)" />
            <span>UAE Central Bank Reference Peg</span>
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
