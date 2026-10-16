'use client';

import React from 'react';
import Link from 'next/link';
import { AlertCircle, ArrowLeft, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--bg-main)',
        color: 'var(--text-primary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
    >
      <div
        className="erp-card"
        style={{
          maxWidth: '440px',
          width: '100%',
          padding: '36px 32px',
          textAlign: 'center',
          backgroundColor: 'var(--surface-2)',
          border: '1px solid var(--border-card)',
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--gold-dim)',
            border: '1px solid rgba(201, 162, 75, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--gold)',
            margin: '0 auto 16px',
          }}
        >
          <AlertCircle size={24} />
        </div>

        <h1
          style={{
            fontSize: '22px',
            fontWeight: 800,
            color: 'var(--text-ivory)',
            letterSpacing: '-0.02em',
            marginBottom: '8px',
          }}
        >
          Page Not Found
        </h1>

        <p
          style={{
            fontSize: '13px',
            color: 'var(--text-secondary)',
            lineHeight: 1.5,
            marginBottom: '24px',
          }}
        >
          The requested financial resource or workspace route does not exist within this tenant boundary.
        </p>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
          <Link
            href="/login"
            className="erp-btn erp-btn-gold"
            style={{
              padding: '8px 16px',
              fontSize: '13px',
              textDecoration: 'none',
              borderRadius: 'var(--radius-sm)',
            }}
          >
            <Home size={14} />
            <span>Return to Workspace</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
