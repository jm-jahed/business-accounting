'use client';

import React, { forwardRef } from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
  elevated?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  {
    interactive = false,
    elevated = false,
    className = '',
    style,
    children,
    ...props
  },
  ref
) {
  const baseClass = interactive ? 'erp-card-interactive' : 'erp-card';

  return (
    <div
      ref={ref}
      className={`${baseClass} ${className}`.trim()}
      style={{
        backgroundColor: elevated ? 'var(--surface-3)' : 'var(--surface-2)',
        border: '1px solid var(--border-card)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: elevated ? 'var(--shadow-elevated)' : 'var(--shadow-card)',
        color: 'var(--text-primary)',
        overflow: 'hidden',
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
});

export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  action?: React.ReactNode;
}

export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(function CardHeader(
  { action, className = '', style, children, ...props },
  ref
) {
  return (
    <div
      ref={ref}
      className={className}
      style={{
        padding: '16px 20px',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        ...style,
      }}
      {...props}
    >
      <div style={{ minWidth: 0, flex: 1 }}>{children}</div>
      {action && <div style={{ flexShrink: 0 }}>{action}</div>}
    </div>
  );
});

export const CardTitle = forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  function CardTitle({ className = '', style, children, ...props }, ref) {
    return (
      <h3
        ref={ref}
        className={className}
        style={{
          fontSize: '15px',
          fontWeight: 700,
          color: 'var(--text-ivory)',
          letterSpacing: '-0.01em',
          margin: 0,
          ...style,
        }}
        {...props}
      >
        {children}
      </h3>
    );
  }
);

export const CardDescription = forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  function CardDescription({ className = '', style, children, ...props }, ref) {
    return (
      <p
        ref={ref}
        className={className}
        style={{
          fontSize: '12px',
          color: 'var(--text-secondary)',
          margin: '4px 0 0',
          lineHeight: 1.4,
          ...style,
        }}
        {...props}
      >
        {children}
      </p>
    );
  }
);

export const CardContent = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  function CardContent({ className = '', style, children, ...props }, ref) {
    return (
      <div
        ref={ref}
        className={className}
        style={{
          padding: '16px 20px',
          ...style,
        }}
        {...props}
      >
        {children}
      </div>
    );
  }
);

export const CardFooter = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  function CardFooter({ className = '', style, children, ...props }, ref) {
    return (
      <div
        ref={ref}
        className={className}
        style={{
          padding: '12px 20px',
          borderTop: '1px solid var(--border-subtle)',
          backgroundColor: 'var(--surface-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: '8px',
          ...style,
        }}
        {...props}
      >
        {children}
      </div>
    );
  }
);
