/**
 * Custom React hooks for data fetching and state management
 */

import { useState, useEffect, useCallback } from 'react';

/**
 * Generic async data fetching hook
 */
export function useAsync(asyncFn, deps = [], immediate = true) {
  const [state, setState] = useState({
    data: null,
    loading: immediate,
    error: null,
  });

  const execute = useCallback(async (...args) => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const result = await asyncFn(...args);
      setState({ data: result, loading: false, error: null });
      return result;
    } catch (err) {
      setState((s) => ({ ...s, loading: false, error: err.message }));
      throw err;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    if (immediate) execute();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [immediate]);

  return { ...state, execute, setState };
}

/**
 * Hook for list data with refresh capability
 */
export function useList(fetchFn, params = {}) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetch = useCallback(async (fetchParams = params) => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchFn(fetchParams);
      setItems(result.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { items, loading, error, refresh: fetch, setItems };
}
