/**
 * @file useApiResource.ts
 * @description
 * Loads one API resource identified by `key` and tracks loading/error state.
 * Shared by the profile views so each one doesn't re-implement fetch,
 * cancellation and error handling.
 */
import { useCallback, useEffect, useState } from 'react';
import { ApiError } from '../services/api/httpClient';

export interface ApiResource<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  /** Fetch the same key again (e.g. a "Try again" button). */
  reload: () => void;
}

interface Settled<K, T> {
  key: K;
  attempt: number;
  data: T | null;
  error: string | null;
}

/**
 * @param fetcher  A stable function (e.g. `clientApi.getApplicantProfile`), not an inline arrow,
 *                 so it doesn't restart the request on every render.
 * @param key      What to load; null means nothing yet (e.g. a closed modal).
 * @param fallbackError Message for non-API failures.
 *
 * A response is only applied while its key/attempt is still current, so quickly
 * switching between keys can never show the previous key's data.
 */
export function useApiResource<K extends string | number, T>(
  fetcher: (key: K) => Promise<T>,
  key: K | null,
  fallbackError = 'Something went wrong. Please try again.',
): ApiResource<T> {
  const [attempt, setAttempt] = useState(0);
  const [settled, setSettled] = useState<Settled<K, T> | null>(null);

  useEffect(() => {
    if (key === null) return;
    let current = true;
    fetcher(key)
      .then((data) => { if (current) setSettled({ key, attempt, data, error: null }); })
      .catch((err: unknown) => {
        if (current) setSettled({ key, attempt, data: null, error: err instanceof ApiError ? err.message : fallbackError });
      });
    return () => { current = false; };
  }, [fetcher, key, attempt, fallbackError]);

  const reload = useCallback(() => setAttempt((n) => n + 1), []);
  const isCurrent = key !== null && settled !== null && settled.key === key && settled.attempt === attempt;

  return {
    data: isCurrent ? settled.data : null,
    loading: key !== null && !isCurrent,
    error: isCurrent ? settled.error : null,
    reload,
  };
}
