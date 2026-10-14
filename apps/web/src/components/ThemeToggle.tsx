'use client';

import React, { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

export function ThemeToggle() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('accounting_theme_pref');
    if (saved === 'light' || saved === 'dark') {
      setTheme(saved);
      document.documentElement.setAttribute('data-theme', saved);
    } else {
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  }, []);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
    try {
      localStorage.setItem('accounting_theme_pref', next);
    } catch {
      // Safe fallback if storage unavailable
    }
  };

  if (!mounted) {
    return (
      <button
        style={{
          width: '32px',
          height: '32px',
          borderRadius: '7px',
          backgroundColor: '#16223A',
          border: '1px solid #22304D',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#8A97B2',
        }}
        aria-label="Toggle theme"
      >
        <Moon size={15} />
      </button>
    );
  }

  return (
    <button
      onClick={toggleTheme}
      style={{
        width: '32px',
        height: '32px',
        borderRadius: '7px',
        backgroundColor: theme === 'dark' ? '#16223A' : '#F1F5F9',
        border: theme === 'dark' ? '1px solid #22304D' : '1px solid #CBD5E1',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: theme === 'dark' ? '#DFBF6E' : '#B45309',
        cursor: 'pointer',
        transition: 'all 150ms ease',
      }}
      title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
      aria-label="Toggle theme"
    >
      {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
    </button>
  );
}
