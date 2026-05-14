'use client';

import { useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';

export function useApi() {
  const { token } = useAuth();

  const apiFetch = useCallback(
    async (url: string, options: RequestInit = {}) => {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string>),
      };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(url, { ...options, headers });
      const data = await res.json();
      if (!data.success) throw new Error(data.error?.message || 'Error de API');
      return data;
    },
    [token]
  );

  return { apiFetch };
}
