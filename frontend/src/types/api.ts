// Auth Types
export enum UserRole {
  MASTER = "master",
  OWNER = "owner",
  EMPLOYEE = "employee",
}

export enum Permission {
  // User Management
  CREATE_USERS = "create_users",
  READ_USERS = "read_users",
  UPDATE_USERS = "update_users",
  DELETE_USERS = "delete_users",

  // Agency Management
  CREATE_AGENCIES = "create_agencies",
  READ_AGENCIES = "read_agencies",
  UPDATE_AGENCIES = "update_agencies",
  DELETE_AGENCIES = "delete_agencies",

  // Inventory Management
  CREATE_INVENTORY = "create_inventory",
  READ_INVENTORY = "read_inventory",
  UPDATE_INVENTORY = "update_inventory",
  DELETE_INVENTORY = "delete_inventory",

  // Reports
  VIEW_REPORTS = "view_reports",
  EXPORT_DATA = "export_data",
}

export enum ItemStatus {
  IN_INVENTORY = "in_inventory",
  WITH_EMPLOYEE = "with_employee",
  SOLD = "sold",
}

// Base API Response
export interface BaseApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

// Pagination
export interface Pagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

export interface PaginatedApiResponse<T = unknown>
  extends BaseApiResponse<T[]> {
  pagination: Pagination;
}

// Health API Response
export interface HealthResponse {
  status: string;
  version: string;
  timestamp: string;
  uptime: number;
}

// Test API Response
export interface TestResponse {
  message: string;
  status: string;
  version: string;
  data: {
    nodejs: string;
    environment: string;
    database: string;
  };
}

// Agency Types
export interface Agency {
  _id: string;
  name: string;
  status: "active" | "inactive";
  createdBy:
    | {
        _id: string;
        username: string;
      }
    | string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAgencyRequest {
  name: string;
}

export interface UpdateAgencyRequest {
  name?: string;
  status?: "active" | "inactive";
}

// User Types
export interface User {
  _id: string;
  username: string;
  role: UserRole;
  agency?: Agency | string;
  permissions: Permission[];
  status: "active" | "inactive" | "suspended";
  lastLogin?: string;
  createdBy?:
    | {
        _id: string;
        username: string;
      }
    | string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthUser {
  _id: string;
  username: string;
  role: UserRole;
  agency?: {
    _id: string;
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    status: string;
  };
  permissions: Permission[];
  status: "active" | "inactive" | "suspended";
  lastLogin?: string;
  createdBy?:
    | {
        _id: string;
        username: string;
      }
    | string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserRequest {
  username: string;
  password: string;
  role: UserRole;
  agencyId?: string;
  permissions?: Permission[];
}

export interface UpdateUserRequest {
  username?: string;
  role?: UserRole;
  agencyId?: string;
  permissions?: Permission[];
  status?: "active" | "inactive" | "suspended";
  password?: string;
}

export interface GetUsersQuery {
  page?: number;
  limit?: number;
  search?: string;
  role?: UserRole;
  status?: string;
}

// Auth API Responses
export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  message: string;
  token: string;
  user: {
    id: string;
    username: string;
    role: UserRole;
    agency?: Agency;
    permissions: Permission[];
    lastLogin?: string;
  };
}

export interface LogoutResponse {
  success: boolean;
  message: string;
  sessionsRemoved?: number;
}

// Item Type Types
export interface ItemTypeGrouping {
  groupName: string;
  unitsPerGroup: number;
}

export interface ItemType {
  _id: string;
  name: string;
  description?: string;
  grouping?: ItemTypeGrouping[];
  agency: Agency | string;
  createdBy:
    | {
        _id: string;
        username: string;
      }
    | string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateItemTypeRequest {
  name: string;
  description?: string;
  grouping?: ItemTypeGrouping[];
}

export interface UpdateItemTypeRequest {
  name?: string;
  description?: string;
  grouping?: ItemTypeGrouping[];
  isActive?: boolean;
}

export interface GetItemTypesQuery {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
}

// Item Types
export interface StatusHistory {
  status: ItemStatus;
  changedBy: string;
  changedAt: string;
  currentHolder?: string;
  notes?: string;
}

export interface Item {
  _id: string;
  itemType: ItemType | string;
  agency: Agency | string;
  status: ItemStatus;
  currentHolder?: User | string;
  statusHistory: StatusHistory[];
  notes?: string;
  createdBy: User | string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateItemsRequest {
  itemTypeId: string;
  quantity?: number;
  groupQuantity?: number;
  groupName?: string;
}

export interface UpdateItemRequest {
  status?: ItemStatus;
  currentHolder?: string;
  notes?: string;
}

export interface BulkUpdateItemsRequest {
  itemTypeId: string;
  status?: ItemStatus;
  currentHolder?: string;
  notes?: string;
  quantity?: number;
  groupQuantity?: number;
  groupName?: string;
  currentStatus?: ItemStatus;
}

export interface GetItemsQuery {
  page?: number;
  limit?: number;
  status?: ItemStatus;
  itemTypeId?: string;
}

// API Response Types
export type AgenciesResponse = BaseApiResponse<Agency[]>;
export type AgencyResponse = BaseApiResponse<Agency>;
export type CreateAgencyResponse = BaseApiResponse<Agency>;
export type UpdateAgencyResponse = BaseApiResponse<Agency>;

export type UsersResponse = PaginatedApiResponse<User>;
export type UserResponse = BaseApiResponse<User>;
export type CreateUserResponse = BaseApiResponse<User>;

export type ItemTypesResponse = PaginatedApiResponse<ItemType>;
export type ItemTypeResponse = BaseApiResponse<ItemType>;
export type CreateItemTypeResponse = BaseApiResponse<ItemType>;
export type UpdateItemTypeResponse = BaseApiResponse<ItemType>;

// Item Summary Types
export interface ItemStatusCount {
  status: ItemStatus;
  count: number;
}

export interface ItemTypeSummary {
  _id: string;
  itemTypeName: string;
  statusCounts: ItemStatusCount[];
  totalCount: number;
}

export interface ItemsWithSummaryResponse extends PaginatedApiResponse<Item> {
  summary: ItemTypeSummary[];
}

export interface ItemsResponse extends PaginatedApiResponse<Item> {
  summary: ItemTypeSummary[];
}
export type ItemResponse = BaseApiResponse<Item>;
export type CreateItemsResponse = BaseApiResponse<Item[]>;
export type UpdateItemResponse = BaseApiResponse<Item>;
export interface BulkUpdateItemsData {
  itemsUpdated: number;
  items: Item[];
}
export type BulkUpdateItemsResponse = BaseApiResponse<BulkUpdateItemsData>;
export type ItemHistoryResponse = BaseApiResponse<StatusHistory[]>;

// Test Route Response
export interface TestPermissionsResponse {
  message: string;
  user: {
    id?: string;
    username?: string;
    role?: UserRole;
    permissions?: Permission[];
    agencyId?: string;
  };
}

export interface MasterOnlyResponse {
  message: string;
}

export interface OwnerOnlyResponse {
  message: string;
}
