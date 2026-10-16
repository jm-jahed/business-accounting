'use client';

import React, { forwardRef, useId } from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    label,
    error,
    helperText,
    startIcon,
    endIcon,
    id: propId,
    className = '',
    style,
    disabled,
    ...props
  },
  ref
) {
  const generatedId = useId();
  const inputId = propId || generatedId;
  const errorId = `${inputId}-error`;
  const helperId = `${inputId}-helper`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
      {label && (
        <label
          htmlFor={inputId}
          style={{
            fontSize: '12px',
            fontWeight: 600,
            color: 'var(--text-secondary)',
            letterSpacing: '0.01em',
          }}
        >
          {label}
        </label>
      )}

      <div
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          width: '100%',
        }}
      >
        {startIcon && (
          <div
            style={{
              position: 'absolute',
              left: '12px',
              display: 'flex',
              alignItems: 'center',
              pointerEvents: 'none',
              color: 'var(--text-muted)',
            }}
          >
            {startIcon}
          </div>
        )}

        <input
          ref={ref}
          id={inputId}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : helperText ? helperId : undefined}
          className={`erp-input ${className}`.trim()}
          style={{
            width: '100%',
            height: '38px',
            paddingLeft: startIcon ? '36px' : '12px',
            paddingRight: endIcon ? '36px' : '12px',
            paddingTop: '8px',
            paddingBottom: '8px',
            fontSize: '13px',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'var(--surface-3)',
            border: error ? '1px solid var(--danger)' : '1px solid var(--border-card)',
            color: 'var(--text-primary)',
            outline: 'none',
            transition: 'border-color var(--duration-fast) ease, box-shadow var(--duration-fast) ease',
            opacity: disabled ? 0.6 : 1,
            cursor: disabled ? 'not-allowed' : 'text',
            ...style,
          }}
          {...props}
        />

        {endIcon && (
          <div
            style={{
              position: 'absolute',
              right: '12px',
              display: 'flex',
              alignItems: 'center',
              color: 'var(--text-muted)',
            }}
          >
            {endIcon}
          </div>
        )}
      </div>

      {error ? (
        <span
          id={errorId}
          role="alert"
          style={{
            fontSize: '11px',
            fontWeight: 500,
            color: 'var(--danger)',
            lineHeight: 1.3,
          }}
        >
          {error}
        </span>
      ) : helperText ? (
        <span
          id={helperId}
          style={{
            fontSize: '11px',
            color: 'var(--text-muted)',
            lineHeight: 1.3,
          }}
        >
          {helperText}
        </span>
      ) : null}
    </div>
  );
});
