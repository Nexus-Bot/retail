'use client';

import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CACHE_TIMES } from '@/lib/query-config';

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Use dynamic cache time as default (good balance)
            staleTime: CACHE_TIMES.DYNAMIC,
            gcTime: CACHE_TIMES.GC_TIME,
            retry: 1,
            // Prevent background refetch on window focus for better UX
            refetchOnWindowFocus: false,
            // Retry failed queries after network recovery
            refetchOnReconnect: true,
          },
          mutations: {
            // Retry mutations once on failure
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}