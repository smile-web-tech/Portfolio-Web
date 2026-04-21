import { useState, useEffect, useCallback } from 'react';

const API_BASE_URL = 'http://localhost:5000/api';

interface ApiOptions {
  method?: string;
  body?: any;
}

export function useApi<T>(endpoint: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUrl = `${API_BASE_URL}${endpoint}`;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(fetchUrl);
      if (!res.ok) throw new Error('Failed to fetch resource');
      const result = await res.json();
      setData(result);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Error occurred');
    } finally {
      setLoading(false);
    }
  }, [fetchUrl]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const mutate = async (method: string, body?: any, suffix: string = '') => {
    setLoading(true);
    try {
      const res = await fetch(`${fetchUrl}${suffix}`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined,
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Mutation failed');
      }
      await fetchData(); // Refresh data
      return await res.json();
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, error, mutate, refresh: fetchData, API_BASE_URL };
}
