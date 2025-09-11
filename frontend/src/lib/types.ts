// Re-export types from the main API types file to maintain compatibility
// This file is kept for backward compatibility with existing imports

export {
  UserRole,
  ItemStatus,
  User,
  Agency,
  ItemType,
  Item,
  BaseApiResponse as ApiResponse,
  PaginatedApiResponse as PaginatedResponse,
  LoginRequest as LoginForm,
  CreateUserRequest as RegisterForm,
  CreateItemsRequest as CreateItemsForm,
  UpdateItemRequest as UpdateItemForm,
  BulkUpdateItemsRequest as BulkUpdateForm,
} from '@/types/api';