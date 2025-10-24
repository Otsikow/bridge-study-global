import { useCallback, useEffect, useRef, useState } from 'react';

// ==================== DEBOUNCE ====================

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// ==================== THROTTLE ====================

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// ==================== MEMOIZATION ====================

export function memoize<T extends (...args: any[]) => any>(fn: T): T {
  const cache = new Map();

  return ((...args: Parameters<T>) => {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      return cache.get(key);
    }
    const result = fn(...args);
    cache.set(key, result);
    return result;
  }) as T;
}

// ==================== LAZY LOADING ====================

export function useLazyLoad<T>(
  loadFn: () => Promise<T>,
  deps: any[] = []
): {
  data: T | null;
  loading: boolean;
  error: Error | null;
  reload: () => void;
} {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await loadFn();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load'));
    } finally {
      setLoading(false);
    }
  }, deps);

  useEffect(() => {
    load();
  }, [load]);

  return { data, loading, error, reload: load };
}

// ==================== INTERSECTION OBSERVER ====================

export function useIntersectionObserver(
  ref: React.RefObject<Element>,
  options: IntersectionObserverInit = {}
): boolean {
  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting);
    }, options);

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [ref, options]);

  return isIntersecting;
}

// ==================== VIRTUAL SCROLLING ====================

export function useVirtualScroll<T>(
  items: T[],
  itemHeight: number,
  containerHeight: number
): {
  visibleItems: T[];
  startIndex: number;
  endIndex: number;
  totalHeight: number;
  offsetY: number;
} {
  const [scrollTop, setScrollTop] = useState(0);

  const startIndex = Math.floor(scrollTop / itemHeight);
  const endIndex = Math.min(
    items.length - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight)
  );

  const visibleItems = items.slice(startIndex, endIndex + 1);
  const totalHeight = items.length * itemHeight;
  const offsetY = startIndex * itemHeight;

  return {
    visibleItems,
    startIndex,
    endIndex,
    totalHeight,
    offsetY,
  };
}

// ==================== IMAGE OPTIMIZATION ====================

export function optimizeImageUrl(url: string, width?: number, height?: number, quality = 80): string {
  // For Supabase storage, add transform parameters
  if (url.includes('supabase.co/storage')) {
    const params = new URLSearchParams();
    if (width) params.set('width', width.toString());
    if (height) params.set('height', height.toString());
    params.set('quality', quality.toString());
    params.set('format', 'webp');
    
    return `${url}?${params.toString()}`;
  }
  return url;
}

export function useImagePreload(urls: string[]): boolean {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const images = urls.map((url) => {
      const img = new Image();
      img.src = url;
      return img;
    });

    Promise.all(
      images.map(
        (img) =>
          new Promise((resolve) => {
            img.onload = resolve;
            img.onerror = resolve; // Continue even if some fail
          })
      )
    ).then(() => {
      if (!cancelled) setLoaded(true);
    });

    return () => {
      cancelled = true;
    };
  }, [urls]);

  return loaded;
}

// ==================== LOCAL STORAGE CACHE ====================

export function useLocalStorageCache<T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttl: number = 5 * 60 * 1000 // 5 minutes default
): {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refresh: () => void;
  clearCache: () => void;
} {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const cacheKey = `cache_${key}`;
  const timestampKey = `cache_${key}_timestamp`;

  const isExpired = useCallback(() => {
    const timestamp = localStorage.getItem(timestampKey);
    if (!timestamp) return true;
    return Date.now() - parseInt(timestamp) > ttl;
  }, [timestampKey, ttl]);

  const loadFromCache = useCallback(() => {
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached && !isExpired()) {
        setData(JSON.parse(cached));
        return true;
      }
    } catch (err) {
      console.error('Failed to load from cache:', err);
    }
    return false;
  }, [cacheKey, isExpired]);

  const saveToCache = useCallback(
    (value: T) => {
      try {
        localStorage.setItem(cacheKey, JSON.stringify(value));
        localStorage.setItem(timestampKey, Date.now().toString());
      } catch (err) {
        console.error('Failed to save to cache:', err);
      }
    },
    [cacheKey, timestampKey]
  );

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await fetchFn();
      setData(result);
      saveToCache(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch'));
    } finally {
      setLoading(false);
    }
  }, [fetchFn, saveToCache]);

  const clearCache = useCallback(() => {
    localStorage.removeItem(cacheKey);
    localStorage.removeItem(timestampKey);
    setData(null);
  }, [cacheKey, timestampKey]);

  useEffect(() => {
    if (!loadFromCache()) {
      refresh();
    }
  }, [loadFromCache, refresh]);

  return { data, loading, error, refresh, clearCache };
}

// ==================== REQUEST BATCHING ====================

export class RequestBatcher<T, R> {
  private queue: Array<{
    request: T;
    resolve: (value: R) => void;
    reject: (error: any) => void;
  }> = [];
  private timer: NodeJS.Timeout | null = null;
  private batchFn: (requests: T[]) => Promise<R[]>;
  private delay: number;

  constructor(batchFn: (requests: T[]) => Promise<R[]>, delay = 50) {
    this.batchFn = batchFn;
    this.delay = delay;
  }

  add(request: T): Promise<R> {
    return new Promise((resolve, reject) => {
      this.queue.push({ request, resolve, reject });

      if (this.timer) {
        clearTimeout(this.timer);
      }

      this.timer = setTimeout(() => {
        this.flush();
      }, this.delay);
    });
  }

  private async flush() {
    if (this.queue.length === 0) return;

    const batch = [...this.queue];
    this.queue = [];
    this.timer = null;

    try {
      const requests = batch.map((item) => item.request);
      const results = await this.batchFn(requests);

      batch.forEach((item, index) => {
        item.resolve(results[index]);
      });
    } catch (error) {
      batch.forEach((item) => {
        item.reject(error);
      });
    }
  }
}

// ==================== PREFETCH ====================

export function prefetchData<T>(
  key: string,
  fetchFn: () => Promise<T>,
  cache: Map<string, T>
): void {
  if (!cache.has(key)) {
    fetchFn().then((data) => {
      cache.set(key, data);
    });
  }
}

export function usePrefetch() {
  const cache = useRef(new Map());

  const prefetch = useCallback((key: string, fetchFn: () => Promise<any>) => {
    prefetchData(key, fetchFn, cache.current);
  }, []);

  const get = useCallback((key: string) => {
    return cache.current.get(key);
  }, []);

  const clear = useCallback((key?: string) => {
    if (key) {
      cache.current.delete(key);
    } else {
      cache.current.clear();
    }
  }, []);

  return { prefetch, get, clear };
}

// ==================== WEB WORKERS ====================

export function useWebWorker<T, R>(
  workerFn: (data: T) => R
): (data: T) => Promise<R> {
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    const blob = new Blob(
      [
        `
      self.onmessage = function(e) {
        const result = (${workerFn.toString()})(e.data);
        self.postMessage(result);
      }
    `,
      ],
      { type: 'application/javascript' }
    );

    workerRef.current = new Worker(URL.createObjectURL(blob));

    return () => {
      workerRef.current?.terminate();
    };
  }, [workerFn]);

  return useCallback(
    (data: T) => {
      return new Promise<R>((resolve, reject) => {
        if (!workerRef.current) {
          reject(new Error('Worker not initialized'));
          return;
        }

        const handleMessage = (e: MessageEvent) => {
          resolve(e.data);
          workerRef.current?.removeEventListener('message', handleMessage);
        };

        const handleError = (e: ErrorEvent) => {
          reject(e.error);
          workerRef.current?.removeEventListener('error', handleError);
        };

        workerRef.current.addEventListener('message', handleMessage);
        workerRef.current.addEventListener('error', handleError);
        workerRef.current.postMessage(data);
      });
    },
    []
  );
}

// ==================== IDLE CALLBACK ====================

export function useIdleCallback(callback: () => void, deps: any[] = []) {
  useEffect(() => {
    const handle = requestIdleCallback
      ? requestIdleCallback(callback)
      : setTimeout(callback, 1);

    return () => {
      if (typeof handle === 'number') {
        if (requestIdleCallback) {
          cancelIdleCallback(handle);
        } else {
          clearTimeout(handle);
        }
      }
    };
  }, deps);
}

// ==================== PERFORMANCE MONITORING ====================

export function measurePerformance(name: string, fn: () => void): number {
  const start = performance.now();
  fn();
  const end = performance.now();
  const duration = end - start;
  console.log(`[Performance] ${name}: ${duration.toFixed(2)}ms`);
  return duration;
}

export async function measureAsyncPerformance<T>(
  name: string,
  fn: () => Promise<T>
): Promise<{ result: T; duration: number }> {
  const start = performance.now();
  const result = await fn();
  const end = performance.now();
  const duration = end - start;
  console.log(`[Performance] ${name}: ${duration.toFixed(2)}ms`);
  return { result, duration };
}
