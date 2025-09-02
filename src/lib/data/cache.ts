// Simple in-memory cache with TTL for server-side data
interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

class DataCache {
  private cache = new Map<string, CacheEntry<unknown>>();

  set<T>(key: string, data: T, ttlMs: number = 5 * 60 * 1000): void { // Default 5 min TTL
    this.cache.set(key, { data, expiresAt: Date.now() + ttlMs });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry || Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    return entry.data as T;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }
}

export const dataCache = new DataCache();
