/**
 * Custom hooks for consistent TanStack Query usage
 * These hooks provide standardized caching and error handling
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/auth-context';
import { 
  itemsAPI, 
  itemTypesAPI, 
  usersAPI, 
  agenciesAPI,
} from '@/lib/api';
import { 
  queryKeys, 
  createQueryOptions,
  DEFAULT_LIMITS,
  invalidationPatterns 
} from '@/lib/query-config';
import type { 
  GetItemsQuery,
  GetUsersQuery,
  CreateItemsRequest,
  BulkUpdateItemsRequest,
  CreateUserRequest,
  UpdateUserRequest
} from '@/types/api';

// Item Types Hooks
export const useItemTypes = (options?: { search?: string; limit?: number }) => {
  const { user } = useAuth();
  const { search, limit = DEFAULT_LIMITS.MEDIUM } = options || {};
  
  return useQuery({
    queryKey: queryKeys.itemTypes(user?.agency?._id, search),
    queryFn: () => itemTypesAPI.getItemTypes({ 
      search: search || undefined,
      limit 
    }),
    ...createQueryOptions.static(!!user?.agency?._id),
  });
};

// Items Hooks
export const useItems = (filters?: GetItemsQuery) => {
  const { user } = useAuth();
  const { limit = DEFAULT_LIMITS.SMALL, ...otherFilters } = filters || {};
  
  return useQuery({
    queryKey: queryKeys.items(user?.agency?._id, { limit, ...otherFilters }),
    queryFn: () => itemsAPI.getItems({ limit, ...otherFilters }),
    ...createQueryOptions.dynamic(!!user?.agency?._id),
  });
};

export const useItemsSummary = (filters?: Omit<GetItemsQuery, 'limit'>) => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: queryKeys.itemsSummary(user?.agency?._id, filters),
    queryFn: async () => {
      // Get summary without fetching all items
      const response = await itemsAPI.getItems({ limit: 1, ...filters });
      return {
        summary: response.data.summary,
        pagination: response.data.pagination
      };
    },
    ...createQueryOptions.realtime(!!user?.agency?._id),
  });
};

export const useMyItems = (filters?: GetItemsQuery) => {
  const { user } = useAuth();
  const { limit = DEFAULT_LIMITS.SMALL, ...otherFilters } = filters || {};
  
  return useQuery({
    queryKey: queryKeys.myItems(user?._id, { limit, ...otherFilters }),
    queryFn: () => itemsAPI.getMyItems({ limit, ...otherFilters }),
    ...createQueryOptions.dynamic(!!user?._id),
  });
};

export const useMyItemsSummary = (filters?: Omit<GetItemsQuery, 'limit'>) => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: queryKeys.myItems(user?._id, { ...filters, summary: true }),
    queryFn: async () => {
      // Get summary without fetching all items
      const response = await itemsAPI.getMyItems({ limit: 1, ...filters });
      return {
        summary: response.data.summary,
        pagination: response.data.pagination
      };
    },
    ...createQueryOptions.realtime(!!user?._id),
  });
};

// Users Hooks
export const useUsers = (filters?: GetUsersQuery & { enabled?: boolean }) => {
  const { user } = useAuth();
  const { limit = DEFAULT_LIMITS.MEDIUM, enabled = true, ...otherFilters } = filters || {};
  
  const queryOptions = createQueryOptions.dynamic(!!user);
  return useQuery({
    queryKey: queryKeys.users(user?.agency?._id, { limit, ...otherFilters }),
    queryFn: () => usersAPI.getUsers({ limit, ...otherFilters }),
    ...queryOptions,
    enabled: enabled && !!user,
  });
};

// Agencies Hooks
export const useAgencies = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: queryKeys.agencies(),
    queryFn: () => agenciesAPI.getAgencies(),
    ...createQueryOptions.static(!!user),
  });
};

// User/Employee Mutation Hooks with optimized invalidation
export const useCreateUserMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateUserRequest) => usersAPI.createUser(data),
    onSuccess: () => {
      // Invalidate all user-related queries efficiently
      queryClient.invalidateQueries({ 
        queryKey: ['users'],
        exact: false 
      });
      // Invalidate dashboard data
      queryClient.invalidateQueries({ 
        queryKey: ['dashboard'],
        exact: false 
      });
    },
  });
};

export const useUpdateUserMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string, data: UpdateUserRequest }) => 
      usersAPI.updateUser(id, data),
    onSuccess: (_, variables) => {
      // Invalidate all user-related queries efficiently
      queryClient.invalidateQueries({ 
        queryKey: ['users'],
        exact: false 
      });
      // Invalidate dashboard data
      queryClient.invalidateQueries({ 
        queryKey: ['dashboard'],
        exact: false 
      });
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.user(variables.id) 
      });
    },
  });
};

// Mutation Hooks with optimized invalidation
export const useCreateItemsMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateItemsRequest) => itemsAPI.createItems(data),
    onSuccess: () => {
      // Invalidate related queries efficiently
      invalidationPatterns.items.forEach(pattern => {
        queryClient.invalidateQueries({ queryKey: [pattern] });
      });
    },
  });
};

export const useBulkUpdateItemsMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: BulkUpdateItemsRequest) => itemsAPI.bulkUpdateItems(data),
    onSuccess: () => {
      // Invalidate related queries efficiently
      invalidationPatterns.items.forEach(pattern => {
        queryClient.invalidateQueries({ queryKey: [pattern] });
      });
    },
  });
};

// Dashboard hooks (optimized for real-time data)
export const useOwnerDashboard = () => {
  const { user } = useAuth();
  
  const itemsQuery = useQuery({
    queryKey: queryKeys.dashboard('owner', user?.agency?._id),
    queryFn: () => itemsAPI.getItems({ limit: DEFAULT_LIMITS.LARGE }),
    ...createQueryOptions.realtime(!!user?.agency?._id),
  });
  
  const usersQuery = useQuery({
    queryKey: queryKeys.users(user?.agency?._id),
    queryFn: () => usersAPI.getUsers({ limit: DEFAULT_LIMITS.LARGE }),
    ...createQueryOptions.realtime(!!user?.agency?._id),
  });
  
  return {
    items: itemsQuery,
    users: usersQuery,
    isLoading: itemsQuery.isLoading || usersQuery.isLoading,
  };
};