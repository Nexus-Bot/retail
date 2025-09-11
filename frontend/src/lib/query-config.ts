/**
 * Unified TanStack Query Configuration
 * Provides consistent caching strategies and query keys across the app
 */

// Cache durations (in milliseconds)
export const CACHE_TIMES = {
  // Static/semi-static data (rarely changes)
  STATIC: 10 * 60 * 1000,        // 10 minutes - item types, agencies
  
  // Dynamic data (changes frequently)  
  DYNAMIC: 2 * 60 * 1000,        // 2 minutes - items, users
  
  // Real-time data (changes very frequently)
  REALTIME: 30 * 1000,           // 30 seconds - dashboards, summaries
  
  // Garbage collection time
  GC_TIME: 15 * 60 * 1000,       // 15 minutes
} as const;

// Default pagination limits
export const DEFAULT_LIMITS = {
  SMALL: 20,     // Tables, lists
  MEDIUM: 50,    // Dropdowns, selects  
  LARGE: 100,    // Bulk operations
} as const;

// Standardized query keys factory
export const queryKeys = {
  // Item Types
  itemTypes: (agencyId?: string, search?: string) => 
    ['item-types', agencyId, search].filter(Boolean),
    
  itemType: (id: string) => ['item-type', id],

  // Items
  items: (agencyId?: string, filters?: Record<string, any>) =>
    ['items', agencyId, filters].filter(Boolean),
    
  itemsSummary: (agencyId?: string, filters?: Record<string, any>) =>
    ['items-summary', agencyId, filters].filter(Boolean),
    
  myItems: (userId?: string, filters?: Record<string, any>) =>
    ['my-items', userId, filters].filter(Boolean),
    
  item: (id: string) => ['item', id],

  // Users
  users: (agencyId?: string, filters?: Record<string, any>) =>
    ['users', agencyId, filters].filter(Boolean),
    
  user: (id: string) => ['user', id],

  // Agencies
  agencies: () => ['agencies'],
  agency: (id: string) => ['agency', id],

  // Dashboard data
  dashboard: (type: 'owner' | 'employee' | 'master', agencyId?: string, userId?: string) =>
    ['dashboard', type, agencyId, userId].filter(Boolean),
    
  // Health check
  health: () => ['health'],
} as const;

// Common query options factory
export const createQueryOptions = {
  // For static data (item types, agencies)
  static: (enabled: boolean = true) => ({
    staleTime: CACHE_TIMES.STATIC,
    gcTime: CACHE_TIMES.GC_TIME,
    retry: 1,
    enabled,
  }),

  // For dynamic data (items, users)  
  dynamic: (enabled: boolean = true) => ({
    staleTime: CACHE_TIMES.DYNAMIC,
    gcTime: CACHE_TIMES.GC_TIME,
    retry: 1,
    enabled,
  }),

  // For real-time data (dashboards, summaries)
  realtime: (enabled: boolean = true) => ({
    staleTime: CACHE_TIMES.REALTIME,
    gcTime: CACHE_TIMES.GC_TIME,
    retry: 1,
    enabled,
  }),

  // For data that should always be fresh
  fresh: (enabled: boolean = true) => ({
    staleTime: 0,
    gcTime: CACHE_TIMES.GC_TIME,
    retry: 1,
    enabled,
  }),
} as const;

// Utility to invalidate related queries
export const invalidationPatterns = {
  // When items are created/updated/deleted
  items: ['items', 'items-summary', 'my-items', 'dashboard'],
  
  // When item types are created/updated/deleted  
  itemTypes: ['item-types', 'items', 'items-summary', 'dashboard'],
  
  // When users are created/updated/deleted
  users: ['users', 'dashboard'],
  
  // When agencies are created/updated/deleted
  agencies: ['agencies', 'users', 'dashboard'],
} as const;