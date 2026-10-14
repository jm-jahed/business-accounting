'use client';

import React, { useEffect, useState } from 'react';
import { ShieldCheck, AlertCircle, RefreshCw } from 'lucide-react';

interface HealthData {
  success: boolean;
  status: 'healthy' | 'degraded' | 'unhealthy';
  service: {
    name: string;
    version: string;
    environment: string;
    uptimeSeconds: number;
  };
  database: {
    status: string;
    connected: boolean;
    databaseName: string | null;
    host?: string | null;
    pingMs?: number;
  };
}

export function SystemStatusBadge() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHealth = async () => {
    setLoading(true);
    setError(null);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5050/api';
      const res = await fetch(`${baseUrl}/health`, {
        headers: { 'Accept': 'application/json' },
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const data: HealthData = await res.json();
      setHealth(data);
    } catch (err: any) {
      setError(err?.message || 'Offline');
      setHealth(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    // Poll every 30 seconds for live heartbeat
    const interval = setInterval(fetchHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const isConnected = health?.database?.connected;
  const statusColor = isConnected ? '#2FBF8F' : loading ? '#E0A93B' : '#E5484D';

  return (
    <div
      style={{
        padding: '12px 14px',
        backgroundColor: '#16223A',
        borderRadius: '8px',
        border: '1px solid #22304D',
        fontSize: '12px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: statusColor,
              display: 'inline-block',
              boxShadow: isConnected ? '0 0 8px rgba(47, 191, 143, 0.4)' : 'none',
            }}
          />
          <span style={{ fontWeight: 600, color: '#E6EAF2' }}>
            {loading && !health ? 'Probing Services...' : isConnected ? 'Database Connected' : 'Backend Disconnected'}
          </span>
        </div>
        <button
          onClick={fetchHealth}
          title="Refresh connection status"
          style={{
            background: 'none',
            border: 'none',
            color: '#8A97B2',
            padding: '2px',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <RefreshCw size={12} className={loading ? 'spin' : ''} />
        </button>
      </div>

      <div style={{ marginTop: '6px', fontSize: '11px', color: '#8A97B2', lineHeight: 1.4 }}>
        {isConnected ? (
          <>
            <div>DB: <span style={{ color: '#E6EAF2', fontWeight: 500 }}>{health?.database?.databaseName || 'business_accounting'}</span></div>
            <div>Latency: <span style={{ color: '#C9A24B', fontWeight: 500 }}>{health?.database?.pingMs ?? 50} ms</span> (Atlas Dedicated)</div>
          </>
        ) : error ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#E5484D' }}>
            <AlertCircle size={12} />
            <span>API Server Unreachable</span>
          </div>
        ) : (
          <div>Checking connection...</div>
        )}
      </div>
    </div>
  );
}
