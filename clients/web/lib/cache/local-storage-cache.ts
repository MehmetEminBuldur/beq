'use client';

import { compress, decompress } from './compression';

export interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  compress?: boolean; // Whether to compress the data
  version?: string; // Cache version for invalidation
}

export interface CacheItem<T = any> {
  data: T;
  timestamp: number;
  ttl?: number;
  compressed?: boolean;
  version?: string;
}

export interface CacheStats {
  totalItems: number;
  validItems: number;
  expiredItems: number;
  size: number;
  sizeFormatted: string;
  usagePercentage: number;
}

export class LocalStorageCache {
  private readonly prefix = 'beq_cache_';
  private readonly maxStorageSize = 4.5 * 1024 * 1024; // 4.5MB to leave buffer
  private readonly cleanupThreshold = 0.8; // Cleanup when 80% full

  constructor() {
    // Only initialize on client side
    if (this.isClientSide()) {
      // Clean up expired items on initialization
      this.cleanup();

      // Set up periodic cleanup
      setInterval(() => this.cleanup(), 5 * 60 * 1000); // Every 5 minutes
    }
  }

  private isClientSide(): boolean {
    return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
  }

  set<T>(key: string, data: T, options: CacheOptions = {}): boolean {
    if (!this.isClientSide()) return false;

    try {
      const fullKey = this.prefix + key;
      const item: CacheItem<T> = {
        data,
        timestamp: Date.now(),
        ttl: options.ttl,
        compressed: options.compress,
        version: options.version,
      };

      let serializedData: string;

      if (options.compress && typeof data === 'object' && data !== null) {
        const jsonString = JSON.stringify(data);
        serializedData = compress(jsonString);
        item.compressed = true;
      } else {
        serializedData = JSON.stringify(item);
      }

      // Check if we need to cleanup before storing
      const currentSize = this.getStorageSize();
      const itemSize = new Blob([serializedData]).size;

      if (currentSize + itemSize > this.maxStorageSize * this.cleanupThreshold) {
        this.cleanup();
      }

      // If still not enough space after cleanup, remove oldest items
      if (currentSize + itemSize > this.maxStorageSize) {
        this.makeSpace(itemSize);
      }

      localStorage.setItem(fullKey, serializedData);
      return true;
    } catch (error) {
      console.warn('Cache set error:', error);
      return false;
    }
  }

  get<T>(key: string, version?: string): T | null {
    if (!this.isClientSide()) return null;

    try {
      const fullKey = this.prefix + key;
      const storedData = localStorage.getItem(fullKey);

      if (!storedData) return null;

      let item: CacheItem<T>;

      // Try to parse as compressed first
      try {
        const decompressed = decompress(storedData);
        item = JSON.parse(decompressed);
      } catch {
        // Not compressed, parse normally
        item = JSON.parse(storedData);
      }

      // Check if expired
      if (this.isExpired(item)) {
        this.delete(key);
        return null;
      }

      // Check version
      if (version && item.version && item.version !== version) {
        this.delete(key);
        return null;
      }

      return item.data;
    } catch (error) {
      console.warn('Cache get error:', error);
      this.delete(key); // Remove corrupted data
      return null;
    }
  }

  has(key: string, version?: string): boolean {
    return this.get(key, version) !== null;
  }

  delete(key: string): boolean {
    if (!this.isClientSide()) return false;

    try {
      const fullKey = this.prefix + key;
      localStorage.removeItem(fullKey);
      return true;
    } catch (error) {
      console.warn('Cache delete error:', error);
      return false;
    }
  }

  clear(): boolean {
    if (!this.isClientSide()) return false;

    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(this.prefix)) {
          localStorage.removeItem(key);
        }
      });
      return true;
    } catch (error) {
      console.warn('Cache clear error:', error);
      return false;
    }
  }

  clearPattern(pattern: string): boolean {
    if (!this.isClientSide()) return false;

    try {
      const keys = Object.keys(localStorage);
      const regex = new RegExp(pattern.replace(/\*/g, '.*'));

      keys.forEach(key => {
        if (key.startsWith(this.prefix)) {
          const cacheKey = key.replace(this.prefix, '');
          if (regex.test(cacheKey)) {
            localStorage.removeItem(key);
          }
        }
      });
      return true;
    } catch (error) {
      console.warn('Cache clear pattern error:', error);
      return false;
    }
  }

  getStats(): CacheStats {
    if (!this.isClientSide()) {
      return {
        totalItems: 0,
        validItems: 0,
        expiredItems: 0,
        size: 0,
        sizeFormatted: '0 Bytes',
        usagePercentage: 0,
      };
    }

    const keys = Object.keys(localStorage);
    const cacheKeys = keys.filter(key => key.startsWith(this.prefix));

    let totalItems = 0;
    let validItems = 0;
    let expiredItems = 0;
    let totalSize = 0;

    cacheKeys.forEach(key => {
      try {
        const storedData = localStorage.getItem(key);
        if (storedData) {
          totalSize += new Blob([storedData]).size;
          totalItems++;

          try {
            let item: CacheItem;
            try {
              const decompressed = decompress(storedData);
              item = JSON.parse(decompressed);
            } catch {
              item = JSON.parse(storedData);
            }

            if (this.isExpired(item)) {
              expiredItems++;
            } else {
              validItems++;
            }
          } catch {
            // Corrupted data
            expiredItems++;
          }
        }
      } catch (error) {
        console.warn('Error reading cache item for stats:', error);
      }
    });

    const usagePercentage = (totalSize / this.maxStorageSize) * 100;

    return {
      totalItems,
      validItems,
      expiredItems,
      size: totalSize,
      sizeFormatted: this.formatBytes(totalSize),
      usagePercentage,
    };
  }

  private isExpired(item: CacheItem): boolean {
    if (!item.ttl) return false;
    return Date.now() - item.timestamp > item.ttl;
  }

  private cleanup(): void {
    if (!this.isClientSide()) return;

    const keys = Object.keys(localStorage);

    keys.forEach(key => {
      if (key.startsWith(this.prefix)) {
        try {
          const storedData = localStorage.getItem(key);
          if (storedData) {
            let item: CacheItem;

            try {
              const decompressed = decompress(storedData);
              item = JSON.parse(decompressed);
            } catch {
              item = JSON.parse(storedData);
            }

            if (this.isExpired(item)) {
              localStorage.removeItem(key);
            }
          }
        } catch (error) {
          // Remove corrupted items
          localStorage.removeItem(key);
        }
      }
    });
  }

  private makeSpace(requiredSize: number): void {
    if (!this.isClientSide()) return;

    const keys = Object.keys(localStorage)
      .filter(key => key.startsWith(this.prefix))
      .map(key => {
        try {
          const storedData = localStorage.getItem(key);
          if (storedData) {
            let item: CacheItem;
            try {
              const decompressed = decompress(storedData);
              item = JSON.parse(decompressed);
            } catch {
              item = JSON.parse(storedData);
            }

            return {
              key,
              timestamp: item.timestamp,
              size: new Blob([storedData]).size,
            };
          }
        } catch {
          return { key, timestamp: 0, size: 0 };
        }
        return null;
      })
      .filter(Boolean)
      .sort((a, b) => (a!.timestamp - b!.timestamp)); // Oldest first

    let freedSpace = 0;
    for (const item of keys) {
      if (item && freedSpace < requiredSize) {
        localStorage.removeItem(item.key);
        freedSpace += item.size;
      }
    }
  }

  private getStorageSize(): number {
    if (!this.isClientSide()) return 0;

    const keys = Object.keys(localStorage).filter(key => key.startsWith(this.prefix));
    let totalSize = 0;

    keys.forEach(key => {
      try {
        const data = localStorage.getItem(key);
        if (data) {
          totalSize += new Blob([data]).size;
        }
      } catch (error) {
        console.warn('Error calculating storage size:', error);
      }
    });

    return totalSize;
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

// Lazy-loaded singleton instance to avoid SSR issues
let cacheInstance: LocalStorageCache | null = null;

function getCacheInstance(): LocalStorageCache {
  if (!cacheInstance) {
    cacheInstance = new LocalStorageCache();
  }
  return cacheInstance;
}

// Export the singleton getter
export const cache = getCacheInstance();

// React hook for using the cache
export function useLocalCache() {
  return { cache: getCacheInstance() };
}
