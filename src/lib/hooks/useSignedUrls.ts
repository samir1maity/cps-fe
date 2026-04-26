'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

// Signed URL TTL from backend is 900s. Refresh at 80% of that (720s) to avoid
// serving expired URLs for long-lived pages.
const TTL_MS = 720_000;

interface CacheEntry {
  url: string;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry>();

const isExpired = (entry: CacheEntry) => Date.now() >= entry.expiresAt;

// Keys that are already full URLs (http/https) don't need signing.
const isFullUrl = (key: string) => key.startsWith('http://') || key.startsWith('https://');

// Pending batch — accumulates keys across hooks in the same render tick.
let pendingKeys = new Set<string>();
let batchTimer: ReturnType<typeof setTimeout> | null = null;
const listeners = new Map<string, Array<(url: string) => void>>();

function scheduleFlush() {
  if (batchTimer !== null) return;
  batchTimer = setTimeout(async () => {
    batchTimer = null;
    const keys = [...pendingKeys].filter((k) => k && !isFullUrl(k));
    pendingKeys = new Set();
    if (keys.length === 0) return;

    // Split into chunks of 50 (backend limit).
    const chunks: string[][] = [];
    for (let i = 0; i < keys.length; i += 50) chunks.push(keys.slice(i, i + 50));

    await Promise.all(
      chunks.map(async (chunk) => {
        const res = await api.getSignedUrlBatch(chunk);
        if (res.success && res.data?.results) {
          const now = Date.now();
          Object.entries(res.data.results).forEach(([key, url]) => {
            cache.set(key, { url, expiresAt: now + TTL_MS });
            listeners.get(key)?.forEach((cb) => cb(url));
            listeners.delete(key);
          });
        }
      }),
    );
  }, 0);
}

function resolveKey(key: string, onChange: (url: string) => void): string {
  if (!key) return '';
  if (isFullUrl(key)) return key;

  const entry = cache.get(key);
  if (entry && !isExpired(entry)) return entry.url;

  // Queue for batch fetch.
  pendingKeys.add(key);
  const existing = listeners.get(key) ?? [];
  existing.push(onChange);
  listeners.set(key, existing);
  scheduleFlush();
  return '';
}

export function useSignedUrls(keys: (string | null | undefined)[]): string[] {
  const normalized = keys.map((k) => k ?? '');

  const [urls, setUrls] = useState<string[]>(() =>
    normalized.map((k) => (isFullUrl(k) ? k : (cache.get(k) && !isExpired(cache.get(k)!)) ? cache.get(k)!.url : '')),
  );

  useEffect(() => {
    let cancelled = false;
    const current = normalized;

    const update = () => {
      if (cancelled) return;
      setUrls(current.map((k) => (isFullUrl(k) ? k : cache.get(k)?.url ?? '')));
    };

    const needsFetch = current.filter((k) => {
      if (!k || isFullUrl(k)) return false;
      const entry = cache.get(k);
      return !entry || isExpired(entry);
    });

    if (needsFetch.length === 0) {
      update();
      return () => { cancelled = true; };
    }

    needsFetch.forEach((key) => {
      pendingKeys.add(key);
      const existing = listeners.get(key) ?? [];
      existing.push(() => update());
      listeners.set(key, existing);
    });
    scheduleFlush();

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [normalized.join(',')]);

  return urls;
}

export function useSignedUrl(key: string | null | undefined): string {
  const [urls] = [useSignedUrls([key])];
  return urls[0];
}
