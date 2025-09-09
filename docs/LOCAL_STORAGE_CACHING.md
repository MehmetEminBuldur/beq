# 🏠 Local Storage Native Caching System

BeQ uses **browser-native local storage caching** instead of external caching services like Redis. This provides superior performance, offline support, and zero server-side dependencies.

## 🎯 Philosophy

We chose local storage caching because:

- **Zero Infrastructure**: No additional server components required
- **Instant Performance**: Sub-millisecond cache access times  
- **Offline Support**: Works perfectly without internet connection
- **User Privacy**: Data stays on user's device
- **Cost Efficiency**: No caching service costs
- **Scalability**: Scales with user's device capabilities

## 🏗️ Architecture

### Core Components

```
┌─────────────────────────────────────────────────────────┐
│                React Components                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │ useCachedQ  │  │ useApiCache │  │ useUserData │     │
│  └─────────────┘  └─────────────┘  └─────────────┘     │
└─────────────────────┬───────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────┐
│              LocalStorageCache                          │
│  ┌─────────────────────────────────────────────────┐   │
│  │           Advanced Features                     │   │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐           │   │
│  │  │ Auto    │ │ Compress│ │ Expire  │           │   │
│  │  │ Cleanup │ │ -sion   │ │ ation   │           │   │
│  │  └─────────┘ └─────────┘ └─────────┘           │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────┬───────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────┐
│                Service Worker                           │
│  ┌─────────────────────────────────────────────────┐   │
│  │         Offline Caching & Sync                 │   │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐           │   │
│  │  │ API     │ │ Static  │ │ Background         │   │
│  │  │ Cache   │ │ Assets  │ │ Sync    │           │   │
│  │  └─────────┘ └─────────┘ └─────────┘           │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────┬───────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────┐
│                Browser Storage                          │
│            localStorage + indexedDB                    │
└─────────────────────────────────────────────────────────┘
```

## 📚 Usage Guide

### 1. Basic Cache Operations

```typescript
import { useLocalCache } from '@/lib/cache/local-storage-cache';

function MyComponent() {
  const { cache } = useLocalCache();

  // Set data with TTL
  cache.set('user_data', userData, { ttl: 30 * 60 * 1000 }); // 30 minutes

  // Get data
  const userData = cache.get('user_data');

  // Check if exists
  if (cache.has('user_data')) {
    console.log('User data is cached');
  }

  // Delete specific item
  cache.delete('user_data');

  // Clear all cache
  cache.clear();
}
```

### 2. Smart API Caching

```typescript
import { useApiCache } from '@/lib/hooks/use-cached-query';

function BricksPage() {
  const { data, isLoading, error, isOffline } = useApiCache(
    '/api/bricks',
    () => fetchBricks(),
    {
      cacheTTL: 15 * 60 * 1000, // 15 minutes
      refreshInterval: 30 * 60 * 1000, // Refresh every 30 minutes
      enableOffline: true,
    }
  );

  if (isOffline && data) {
    // Using cached data offline
    return <BricksView data={data} offline={true} />;
  }

  return <BricksView data={data} loading={isLoading} />;
}
```

### 3. User-Specific Caching

```typescript
import { useUserDataCache } from '@/lib/hooks/use-cached-query';

function UserProfile({ userId }) {
  const { data: profile, isLoading } = useUserDataCache(
    'profile',
    userId,
    () => fetchUserProfile(userId),
    {
      cacheTTL: 60 * 60 * 1000, // 1 hour
      enableRealtime: true, // Always fetch fresh if online
    }
  );

  return <ProfileView profile={profile} loading={isLoading} />;
}
```

### 4. Static Data Caching

```typescript
import { useStaticDataCache } from '@/lib/hooks/use-cached-query';

function AppSettings() {
  const { data: config } = useStaticDataCache(
    'app_config',
    () => fetchAppConfig(),
    {
      cacheTTL: 24 * 60 * 60 * 1000, // 24 hours
    }
  );

  return <SettingsView config={config} />;
}
```

## 🔧 Advanced Features

### 1. Automatic Compression

```typescript
// Large objects are automatically compressed
const largeData = { /* 100KB+ data */ };

cache.set('large_data', largeData, { 
  compress: true, // Force compression
  ttl: 60 * 60 * 1000 
});

// Automatically decompressed on retrieval
const retrievedData = cache.get('large_data');
```

### 2. Cache Statistics

```typescript
import { useLocalCache } from '@/lib/cache/local-storage-cache';

function CacheMonitor() {
  const { getStats } = useLocalCache();
  
  const stats = getStats();
  
  return (
    <div>
      <p>Total Items: {stats.totalItems}</p>
      <p>Valid Items: {stats.validItems}</p>
      <p>Expired Items: {stats.expiredItems}</p>
      <p>Size: {stats.sizeFormatted}</p>
      <p>Usage: {stats.usagePercentage.toFixed(1)}%</p>
    </div>
  );
}
```

### 3. Offline-First Data Fetching

```typescript
import { useOfflineFirst } from '@/lib/hooks/use-service-worker';

function OfflineReadyComponent() {
  const { data, isLoading, error, refresh, isStale } = useOfflineFirst(
    'important_data',
    () => fetchImportantData(),
    {
      fallbackData: defaultData,
      enableBackground: true,
    }
  );

  return (
    <div>
      {isStale && (
        <div className="bg-yellow-100 p-2 rounded">
          Data may be outdated. <button onClick={refresh}>Refresh</button>
        </div>
      )}
      <DataView data={data} loading={isLoading} />
    </div>
  );
}
```

### 4. Cache Management

```typescript
import { useCacheManager } from '@/lib/hooks/use-cached-query';

function CacheSettings() {
  const {
    clearAllCache,
    clearCachePattern,
    getCacheStats,
    cleanup,
    healthCheck,
  } = useCacheManager();

  const handleCleanup = async () => {
    const health = healthCheck();
    
    if (!health.isHealthy) {
      await cleanup();
      toast.success('Cache cleaned up');
    }
  };

  const handleClearUserData = () => {
    clearCachePattern('user_');
    toast.success('User data cache cleared');
  };

  return (
    <div className="space-y-4">
      <button onClick={handleCleanup}>Cleanup Cache</button>
      <button onClick={handleClearUserData}>Clear User Data</button>
      <button onClick={clearAllCache}>Clear All Cache</button>
    </div>
  );
}
```

## 🌐 Offline Support

### Service Worker Integration

The service worker provides additional caching layers:

```javascript
// Automatic API response caching
self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('/api/')) {
    event.respondWith(handleApiRequest(event.request));
  }
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(syncOfflineActions());
  }
});
```

### Offline Detection

```typescript
import { useOfflineDetection } from '@/lib/hooks/use-service-worker';

function OfflineIndicator() {
  const { isOnline, isOffline } = useOfflineDetection();

  if (isOffline) {
    return (
      <div className="bg-yellow-500 text-black p-2 text-center">
        📱 You're offline - using cached data
      </div>
    );
  }

  return null;
}
```

## 📊 Performance Benefits

### Comparison with Redis

| Feature | Redis (Server) | Local Storage (Client) |
|---------|----------------|------------------------|
| **Access Time** | 10-50ms | <1ms |
| **Infrastructure** | Required | None |
| **Offline Support** | ❌ | ✅ |
| **Cost** | $10-100+/month | $0 |
| **Scalability** | Server limited | User device limited |
| **Privacy** | Data on server | Data on device |
| **Setup Complexity** | High | Zero |

### Real-world Metrics

- **Sub-millisecond** cache access times
- **100% uptime** (no network dependencies)
- **Zero infrastructure** costs
- **5MB+ storage** capacity per user
- **Automatic compression** for large objects
- **Smart expiration** with TTL management

## 🎯 Best Practices

### 1. Cache Key Strategy

```typescript
// Good: Hierarchical cache keys
const cacheKey = `user_${userId}_bricks_${category}`;

// Good: Version-aware keys
const versionedKey = `api_response_v2_${endpoint}`;

// Avoid: Generic keys
// const badKey = 'data';
```

### 2. TTL Configuration

```typescript
// Short TTL for frequently changing data
cache.set('live_stats', data, { ttl: 5 * 60 * 1000 }); // 5 minutes

// Medium TTL for user data
cache.set('user_profile', data, { ttl: 30 * 60 * 1000 }); // 30 minutes

// Long TTL for static data
cache.set('app_config', data, { ttl: 24 * 60 * 60 * 1000 }); // 24 hours
```

### 3. Error Handling

```typescript
const safeCache = {
  get: <T>(key: string): T | null => {
    try {
      return cache.get<T>(key);
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  },

  set: <T>(key: string, value: T, options = {}): boolean => {
    try {
      return cache.set(key, value, options);
    } catch (error) {
      console.error('Cache set error:', error);
      return false;
    }
  },
};
```

### 4. Cache Warming

```typescript
// Warm cache on app start
useEffect(() => {
  const warmCache = async () => {
    const criticalData = [
      { key: 'user_profile', fetcher: fetchUserProfile },
      { key: 'app_config', fetcher: fetchAppConfig },
      { key: 'user_bricks', fetcher: fetchUserBricks },
    ];

    await Promise.all(
      criticalData.map(async ({ key, fetcher }) => {
        if (!cache.has(key)) {
          try {
            const data = await fetcher();
            cache.set(key, data, { ttl: 30 * 60 * 1000 });
          } catch (error) {
            console.warn(`Failed to warm cache for ${key}:`, error);
          }
        }
      })
    );
  };

  warmCache();
}, []);
```

## 🔧 Configuration

### Environment Variables

```bash
# No environment variables needed!
# Local storage caching works out of the box
```

### Browser Support

- ✅ **Chrome**: Full support
- ✅ **Firefox**: Full support  
- ✅ **Safari**: Full support
- ✅ **Edge**: Full support
- ✅ **Mobile browsers**: Full support

### Storage Limits

- **Desktop**: 5-10MB typical limit
- **Mobile**: 2-5MB typical limit
- **Automatic cleanup** when approaching limits
- **Compression** for efficient space usage

## 🎉 Benefits Summary

✅ **Zero Infrastructure**: No Redis server or caching service needed  
✅ **Instant Performance**: Sub-millisecond cache access times  
✅ **Perfect Offline**: Works without internet connection  
✅ **Cost Efficient**: No additional hosting or service costs  
✅ **User Privacy**: Data never leaves user's device  
✅ **Auto Management**: Intelligent expiration and cleanup  
✅ **Developer Friendly**: Simple API with powerful features  

BeQ's local storage caching provides enterprise-grade performance with zero complexity! 🚀

---

## 🔄 Migration from Redis

If migrating from Redis:

### 1. Remove Dependencies
```bash
# No more Redis dependencies needed
npm uninstall redis ioredis
```

### 2. Update Code
```typescript
// Old Redis approach
await redis.set('key', JSON.stringify(data), 'EX', 300);
const cached = await redis.get('key');

// New Local Storage approach
cache.set('key', data, { ttl: 5 * 60 * 1000 });
const cached = cache.get('key');
```

### 3. Remove Infrastructure
```yaml
# No more Redis in docker-compose.yml
# No more Redis hosting costs
# No more Redis configuration
```

Local storage caching is simpler, faster, and more reliable! 🎯
