'use client';

import React, { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

export type ButtonVariant = 'gold' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const VARIANT_STYLES: Record<ButtonVariant, { bg: string; color: string; border: string; hoverBg: string; shadow?: string }> = {
  gold: {
    bg: 'var(--gold)',
    color: '#070B14',
    border: 'none',
    hoverBg: 'var(--gold-hover)',
    shadow: 'var(--shadow-gold)',
  },
  secondary: {
    bg: 'var(--surface-3)',
    color: 'var(--text-primary)',
    border: '1px solid var(--border-strong)',
    hoverBg: 'var(--surface-hover)',
  },
  outline: {
    bg: 'transparent',
    color: 'var(--text-primary)',
    border: '1px solid var(--border-strong)',
    hoverBg: 'var(--surface-hover)',
  },
  ghost: {
    bg: 'transparent',
    color: 'var(--text-secondary)',
    border: 'none',
    hoverBg: 'var(--surface-hover)',
  },
  danger: {
    bg: 'var(--danger-dim)',
    color: 'var(--danger)',
    border: '1px solid var(--danger-border)',
    hoverBg: 'var(--danger)',
  },
};

const SIZE_STYLES: Record<ButtonSize, { padding: string; fontSize: string; height: string }> = {
  xs: { padding: '4px 8px', fontSize: '11px', height: '26px' },
  sm: { padding: '6px 12px', fontSize: '12px', height: '32px' },
  md: { padding: '8px 16px', fontSize: '13px', height: '38px' },
  lg: { padding: '10px 20px', fontSize: '14px', height: '44px' },
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'secondary',
    size = 'md',
    isLoading = false,
    leftIcon,
    rightIcon,
    disabled = false,
    className = '',
    style,
    children,
    ...props
  },
  ref
) {
  const currentVariant = VARIANT_STYLES[variant] || VARIANT_STYLES.secondary;
  const currentSize = SIZE_STYLES[size] || SIZE_STYLES.md;
  const isDisabled = disabled || isLoading;

  return (
    <button
      ref={ref}
      disabled={isDisabled}
      aria-busy={isLoading}
      className={`erp-btn erp-btn-${variant} ${className}`.trim()}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
        height: currentSize.height,
        padding: currentSize.padding,
        fontSize: currentSize.fontSize,
        fontWeight: 600,
        borderRadius: 'var(--radius-sm)',
        backgroundColor: currentVariant.bg,
        color: currentVariant.color,
        border: currentVariant.border,
        boxShadow: currentVariant.shadow || 'none',
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        opacity: isDisabled ? 0.6 : 1,
        transition: 'all var(--duration-fast) ease',
        userSelect: 'none',
        whiteSpace: 'nowrap',
        ...style,
      }}
      {...props}
    >
      {isLoading ? (
        <Loader2 size={14} className="spin" style={{ flexShrink: 0 }} />
      ) : (
        leftIcon && <span style={{ display: 'inline-flex', flexShrink: 0 }}>{leftIcon}</span>
      )}
      <span>{children}</span>
      {!isLoading && rightIcon && (
        <span style={{ display: 'inline-flex', flexShrink: 0 }}>{rightIcon}</span>
      )}
    </button>
  );
});
