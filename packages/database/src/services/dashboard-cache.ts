interface CacheEntry<T = any> {
  data: T;
  expiresAt: number;
}

// In-memory dashboard cache with dynamic keys & company invalidation
const dashboardCache = new Map<string, CacheEntry>();

export function getCachedDashboard<T = any>(key: string): T | null {
  const entry = dashboardCache.get(key);
  if (entry && entry.expiresAt > Date.now()) {
    return entry.data as T;
  }
  return null;
}

export function setCachedDashboard<T = any>(key: string, data: T, ttlSeconds: number = 120): void {
  dashboardCache.set(key, {
    data,
    expiresAt: Date.now() + ttlSeconds * 1000,
  });
}

export function invalidateCompanyDashboardCache(companyId: string): void {
  if (!companyId) return;
  const prefix = `dash:${companyId}:`;
  for (const key of dashboardCache.keys()) {
    if (key.startsWith(prefix)) {
      dashboardCache.delete(key);
    }
  }
}
