/**
 * Resolves an array of storage keys to short-lived signed S3 GET URLs.
 *
 * - Results are cached in a module-level Map so repeated renders don't
 *   re-fetch the same key.  Cache is intentionally not invalidated (the
 *   signed URL's own TTL is the source of truth).
 * - Returns '' for each key while the URL is being fetched (show a
 *   placeholder / skeleton in the UI until truthy).
 */
'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

const cache = new Map<string, string>();

export function useSignedUrls(keys: (string | null | undefined)[]): string[] {
  const validKeys = keys.map((k) => k ?? '');
  const [urls, setUrls] = useState<string[]>(validKeys.map((k) => cache.get(k) ?? ''));

  useEffect(() => {
    let cancelled = false;

    const resolve = async () => {
      const pending = validKeys.filter((k) => k && !cache.has(k));
      if (pending.length === 0) {
        setUrls(validKeys.map((k) => cache.get(k) ?? ''));
        return;
      }

      await Promise.all(
        pending.map(async (key) => {
          const res = await api.getSignedUrl(key);
          if (res.success && res.data?.url) {
            cache.set(key, res.data.url);
          }
        }),
      );

      if (!cancelled) {
        setUrls(validKeys.map((k) => cache.get(k) ?? ''));
      }
    };

    resolve();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [validKeys.join(',')]);

  return urls;
}

/** Convenience wrapper for a single key. */
export function useSignedUrl(key: string | null | undefined): string {
  const [url] = useSignedUrls([key]);
  return url;
}
