import crypto from 'crypto';

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
  timestamp: number;
}

export class AICache {
  private cache = new Map<string, CacheEntry<any>>();
  private defaultTTL = 20 * 60 * 1000; // 20 minutes

  public static generateKey(prefix: string, payload: any): string {
    const serialized = typeof payload === 'string' ? payload : JSON.stringify(payload);
    const hash = crypto.createHash('sha256').update(serialized).digest('hex').slice(0, 24);
    return `${prefix}:${hash}`;
  }

  public get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    return entry.data;
  }

  public set<T>(key: string, data: T, ttlMs: number = this.defaultTTL): void {
    if (this.cache.size > 150) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) this.cache.delete(oldestKey);
    }
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + ttlMs,
      timestamp: Date.now(),
    });
  }

  public clear(): void {
    this.cache.clear();
  }
}

export const aiCache = new AICache();
