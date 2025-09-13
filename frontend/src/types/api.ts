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

  // Route Management
  CREATE_ROUTES = "create_routes",
  READ_ROUTES = "read_routes",
  UPDATE_ROUTES = "update_routes",
  DELETE_ROUTES = "delete_routes",

  // Customer Management
  CREATE_CUSTOMERS = "create_customers",
  READ_CUSTOMERS = "read_customers",
  UPDATE_CUSTOMERS = "update_customers",
  DELETE_CUSTOMERS = "delete_customers",

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

export interface Item {
  _id: string;
  itemType: ItemType | string;
  agency: Agency | string;
  status: ItemStatus;
  currentHolder?: User | string;
  sellPrice?: number;
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
  sellPrice?: number;
  notes?: string;
}

export interface BulkUpdateItemsRequest {
  itemTypeId: string;
  status?: ItemStatus;
  currentHolder?: string;
  sellPrice?: number;
  saleTo?: string; // Customer ID for sales
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

// Route Types
export interface Route {
  _id: string;
  name: string;
  agency: Agency | string;
  createdBy:
    | {
        _id: string;
        username: string;
      }
    | string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRouteRequest {
  name: string;
}

export interface UpdateRouteRequest {
  name: string;
}

export interface GetRoutesQuery {
  page?: number;
  limit?: number;
  search?: string;
}

// Customer Types
export interface Customer {
  _id: string;
  name: string;
  mobile: string;
  route:
    | {
        _id: string;
        name: string;
      }
    | string;
  agency: Agency | string;
  createdBy:
    | {
        _id: string;
        username: string;
      }
    | string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCustomerRequest {
  name: string;
  mobile: string;
  routeId: string;
}

export interface UpdateCustomerRequest {
  name: string;
  mobile: string;
  routeId: string;
}

export interface GetCustomersQuery {
  page?: number;
  limit?: number;
  search?: string;
  routeId?: string;
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

export type RoutesResponse = PaginatedApiResponse<Route>;
export type RouteResponse = BaseApiResponse<Route>;
export type CreateRouteResponse = BaseApiResponse<Route>;
export type UpdateRouteResponse = BaseApiResponse<Route>;

export type CustomersResponse = PaginatedApiResponse<Customer>;
export type CustomerResponse = BaseApiResponse<Customer>;
export type CreateCustomerResponse = BaseApiResponse<Customer>;
export type UpdateCustomerResponse = BaseApiResponse<Customer>;

// Analytics Types
export interface AnalyticsSummary {
  totalRevenue: number;
  totalQuantity: number;
  averagePrice: number;
  uniqueCustomersCount: number;
}

export interface AnalyticsTimeline {
  _id: string; // Date string
  revenue?: number;
  quantity: number;
  value?: number;
  spent?: number;
}

export interface TopEmployee {
  _id: string;
  employee: { username: string };
  revenue: number;
  quantity: number;
  sales?: number;
}

export interface TopCustomer {
  _id: string;
  customer: { name: string; mobile: string };
  revenue: number;
  quantity: number;
}

export interface ItemTypePerformance {
  _id: string;
  itemType: { name: string };
  revenue: number;
  quantity: number;
}

export interface SalesAnalytics {
  summary: AnalyticsSummary;
  timeline: AnalyticsTimeline[];
  topEmployees: TopEmployee[];
  topCustomers: TopCustomer[];
  itemTypePerformance: ItemTypePerformance[];
  filters: {
    startDate?: string;
    endDate?: string;
    employeeId?: string;
    customerId?: string;
    itemTypeId?: string;
    groupBy: string;
  };
}

export interface ReturnsAnalytics {
  summary: {
    totalReturns: number;
    totalReturnValue: number;
    averageReturnValue: number;
    uniqueCustomersCount: number;
  };
  timeline: AnalyticsTimeline[];
  employeeReturns: TopEmployee[];
  customerReturns: TopCustomer[];
  filters: {
    startDate?: string;
    endDate?: string;
    employeeId?: string;
    customerId?: string;
    itemTypeId?: string;
    groupBy: string;
  };
}

export interface EmployeeAnalytics {
  employeeId: string;
  sales: {
    totalRevenue: number;
    totalSales: number;
    averagePrice: number;
  };
  salesTimeline: AnalyticsTimeline[];
  returns: {
    totalReturns: number;
    totalReturnValue: number;
  };
  currentInventory: Array<{
    _id: string;
    itemType: { name: string };
    quantity: number;
  }>;
  filters: {
    startDate?: string;
    endDate?: string;
    groupBy: string;
  };
}

export interface CustomerAnalytics {
  customerId: string;
  summary: {
    totalSpent: number;
    totalPurchases: number;
    averageOrderValue: number;
  };
  timeline: AnalyticsTimeline[];
  favoriteProducts: Array<{
    _id: string;
    itemType: { name: string };
    quantity: number;
    totalSpent: number;
  }>;
  returns: {
    totalReturns: number;
    totalReturnValue: number;
  };
  filters: {
    startDate?: string;
    endDate?: string;
    groupBy: string;
  };
}

export interface DashboardAnalytics {
  salesOverview: {
    totalRevenue: number;
    totalSales: number;
    averageOrderValue: number;
  };
  inventoryStatus: Array<{
    _id: string;
    count: number;
  }>;
  recentActivity: Array<{
    _id: string; // Date string
    sales: number;
    returns: number;
    revenue: number;
  }>;
  topPerformers: TopEmployee[];
  filters: {
    startDate?: string;
    endDate?: string;
  };
}

export interface AnalyticsQuery {
  startDate?: string;
  endDate?: string;
  employeeId?: string;
  customerId?: string;
  itemTypeId?: string;
  groupBy?: 'day' | 'week' | 'month' | 'year';
}

// Analytics API Response Types
export type SalesAnalyticsResponse = BaseApiResponse<SalesAnalytics>;
export type ReturnsAnalyticsResponse = BaseApiResponse<ReturnsAnalytics>;
export type EmployeeAnalyticsResponse = BaseApiResponse<EmployeeAnalytics>;
export type CustomerAnalyticsResponse = BaseApiResponse<CustomerAnalytics>;
export type DashboardAnalyticsResponse = BaseApiResponse<DashboardAnalytics>;

// Item Summary Types
export interface ItemStatusCount {
  status: ItemStatus;
  count: number;
  employeeBreakdown: EmployeeItemBreakdown[]; // Employee breakdown for WITH_EMPLOYEE and SOLD statuses
}

export interface EmployeeItemBreakdown {
  employeeId: string;
  employeeName: string;
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
