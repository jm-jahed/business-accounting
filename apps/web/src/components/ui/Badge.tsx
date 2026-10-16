'use client';

import React, { forwardRef } from 'react';

export type BadgeVariant =
  | 'default'
  | 'gold'
  | 'success'
  | 'danger'
  | 'warning'
  | 'info'
  | 'equity'
  | 'neutral';

export type BadgeSize = 'xs' | 'sm' | 'md';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
}

const VARIANT_STYLES: Record<BadgeVariant, { bg: string; color: string; border: string }> = {
  default: {
    bg: 'var(--surface-3)',
    color: 'var(--text-primary)',
    border: 'var(--border-strong)',
  },
  gold: {
    bg: 'var(--gold-dim)',
    color: 'var(--gold-hover)',
    border: 'rgba(201, 162, 75, 0.35)',
  },
  success: {
    bg: 'var(--success-dim)',
    color: 'var(--success)',
    border: 'var(--success-border)',
  },
  danger: {
    bg: 'var(--danger-dim)',
    color: 'var(--danger)',
    border: 'var(--danger-border)',
  },
  warning: {
    bg: 'var(--warning-dim)',
    color: 'var(--warning)',
    border: 'var(--warning-border)',
  },
  info: {
    bg: 'var(--info-dim)',
    color: 'var(--info)',
    border: 'var(--info-border)',
  },
  equity: {
    bg: 'var(--equity-dim)',
    color: 'var(--equity)',
    border: 'var(--equity-border)',
  },
  neutral: {
    bg: 'var(--surface-3)',
    color: 'var(--text-secondary)',
    border: 'var(--border-card)',
  },
};

const SIZE_STYLES: Record<BadgeSize, { padding: string; fontSize: string; dotSize: string }> = {
  xs: { padding: '1px 6px', fontSize: '10px', dotSize: '5px' },
  sm: { padding: '2px 8px', fontSize: '11px', dotSize: '6px' },
  md: { padding: '4px 10px', fontSize: '12px', dotSize: '7px' },
};

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(function Badge(
  {
    variant = 'default',
    size = 'sm',
    dot = false,
    className = '',
    style,
    children,
    ...props
  },
  ref
) {
  const currentVariant = VARIANT_STYLES[variant] || VARIANT_STYLES.default;
  const currentSize = SIZE_STYLES[size] || SIZE_STYLES.sm;

  return (
    <span
      ref={ref}
      className={`erp-badge erp-badge-${variant} ${className}`.trim()}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        padding: currentSize.padding,
        fontSize: currentSize.fontSize,
        fontWeight: 600,
        lineHeight: 1.3,
        letterSpacing: '0.02em',
        textTransform: 'uppercase',
        borderRadius: 'var(--radius-xs)',
        backgroundColor: currentVariant.bg,
        color: currentVariant.color,
        border: `1px solid ${currentVariant.border}`,
        whiteSpace: 'nowrap',
        ...style,
      }}
      {...props}
    >
      {dot && (
        <span
          style={{
            width: currentSize.dotSize,
            height: currentSize.dotSize,
            borderRadius: '50%',
            backgroundColor: currentVariant.color,
            flexShrink: 0,
          }}
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  );
});
