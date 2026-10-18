"use client";

import { useCallback, useEffect, useState } from "react";

interface Result<A, T> {
  arg: A;
  version: number;
  data?: T;
  error?: Error;
}

/**
 * Minimal data-loading hook that replaces the "fetch -> innerHTML" pattern.
 *
 *   const { data, error, loading, reload } = useAsync(fetchSomething, studentId);
 *
 * `loader` must be a stable (module-level) function. It re-runs when `arg` changes or
 * when `reload()` is called. `loading` is derived (no setState inside the effect body).
 */
export function useAsync<A, T>(loader: (arg: A) => Promise<T>, arg: A) {
  const [version, setVersion] = useState(0);
  const [result, setResult] = useState<Result<A, T> | null>(null);

  useEffect(() => {
    let cancelled = false;
    loader(arg)
      .then((data) => !cancelled && setResult({ arg, version, data }))
      .catch((e) => !cancelled && setResult({ arg, version, error: e instanceof Error ? e : new Error(String(e)) }));
    return () => {
      cancelled = true;
    };
  }, [loader, arg, version]);

  const reload = useCallback(() => setVersion((v) => v + 1), []);
  const fresh = result !== null && result.version === version && result.arg === arg;

  return {
    data: result?.data as T | undefined,
    error: fresh ? result?.error : undefined,
    loading: !fresh,
    reload,
  };
}
