import axios from "axios";
import Cookies from "js-cookie";
import {
  // Types
  LoginRequest,
  LoginResponse,
  LogoutResponse,
  AuthUser,
  CreateUserRequest,
  CreateUserResponse,
  UpdateUserRequest,
  GetUsersQuery,
  UsersResponse,
  UserResponse,
  CreateAgencyRequest,
  UpdateAgencyRequest,
  AgenciesResponse,
  AgencyResponse,
  CreateAgencyResponse,
  UpdateAgencyResponse,
  CreateItemTypeRequest,
  UpdateItemTypeRequest,
  GetItemTypesQuery,
  ItemTypesResponse,
  ItemTypeResponse,
  CreateItemTypeResponse,
  UpdateItemTypeResponse,
  CreateItemsRequest,
  UpdateItemRequest,
  BulkUpdateItemsRequest,
  GetItemsQuery,
  ItemsResponse,
  ItemsWithSummaryResponse,
  ItemResponse,
  CreateItemsResponse,
  UpdateItemResponse,
  BulkUpdateItemsResponse,
  HealthResponse,
  TestResponse,
  TestPermissionsResponse,
  MasterOnlyResponse,
  OwnerOnlyResponse,
  // Routes
  CreateRouteRequest,
  UpdateRouteRequest,
  GetRoutesQuery,
  RoutesResponse,
  RouteResponse,
  CreateRouteResponse,
  UpdateRouteResponse,
  // Customers
  CreateCustomerRequest,
  UpdateCustomerRequest,
  GetCustomersQuery,
  CustomersResponse,
  CustomerResponse,
  CreateCustomerResponse,
  UpdateCustomerResponse,
} from "@/types/api";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = Cookies.get("auth_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for handling auth errors and other global errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 Unauthorized - token expired or invalid
    if (error.response?.status === 401) {
      // Clear token and redirect to login
      Cookies.remove("auth_token");
      if (typeof window !== "undefined") {
        // Don't redirect if already on login page
        if (!window.location.pathname.includes("/login")) {
          window.location.href = "/login";
        }
      }
    }

    // Enhance error object with better structure
    if (error.response?.data && !error.response.data.message) {
      // If response doesn't have a message, create a generic one
      error.response.data.message =
        error.response.data.error ||
        `Request failed with status ${error.response.status}`;
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials: LoginRequest) =>
    api.post<LoginResponse>("/auth/login", credentials),

  getProfile: () => api.get<AuthUser>("/auth/profile"),

  logout: () => api.post<LogoutResponse>("/auth/logout"),

  logoutAll: () => api.post<LogoutResponse>("/auth/logout/all"),

  testPermissions: () =>
    api.get<TestPermissionsResponse>("/auth/test-permissions"),

  masterOnly: () => api.get<MasterOnlyResponse>("/auth/master-only"),

  ownerOnly: () => api.get<OwnerOnlyResponse>("/auth/owner-only"),
};

// Items API
export const itemsAPI = {
  createItems: (data: CreateItemsRequest) =>
    api.post<CreateItemsResponse>("/item", data),

  bulkUpdateItems: (data: BulkUpdateItemsRequest) =>
    api.patch<BulkUpdateItemsResponse>("/item/bulk", data),

  getItems: (params?: GetItemsQuery) =>
    api.get<ItemsWithSummaryResponse>("/item", { params }),

  getMyItems: (params?: GetItemsQuery) =>
    api.get<ItemsResponse>("/item/my/items", { params }),

  getItem: (id: string) => api.get<ItemResponse>(`/item/${id}`),

  updateItem: (id: string, data: UpdateItemRequest) =>
    api.put<UpdateItemResponse>(`/item/${id}`, data),
};

// Agencies API
export const agenciesAPI = {
  createAgency: (data: CreateAgencyRequest) =>
    api.post<CreateAgencyResponse>("/agency", data),

  getAgencies: () => api.get<AgenciesResponse>("/agency"),

  getAgency: (id: string) => api.get<AgencyResponse>(`/agency/${id}`),

  updateAgency: (id: string, data: UpdateAgencyRequest) =>
    api.put<UpdateAgencyResponse>(`/agency/${id}`, data),
};

// Users API
export const usersAPI = {
  createUser: (data: CreateUserRequest) =>
    api.post<CreateUserResponse>("/auth/users", data),

  getUsers: (params?: GetUsersQuery) =>
    api.get<UsersResponse>("/auth/users", { params }),

  updateUser: (id: string, data: UpdateUserRequest) =>
    api.put<UserResponse>(`/auth/users/${id}`, data),
};

// System API
export const systemAPI = {
  getHealth: () => api.get<HealthResponse>("/health"),

  getTest: () => api.get<TestResponse>("/test"),
};

// Item Types API
export const itemTypesAPI = {
  createItemType: (data: CreateItemTypeRequest) =>
    api.post<CreateItemTypeResponse>("/item-type", data),

  getItemTypes: (params?: GetItemTypesQuery) =>
    api.get<ItemTypesResponse>("/item-type", { params }),

  getItemType: (id: string) => api.get<ItemTypeResponse>(`/item-type/${id}`),

  updateItemType: (id: string, data: UpdateItemTypeRequest) =>
    api.put<UpdateItemTypeResponse>(`/item-type/${id}`, data),
};

// Routes API
export const routesAPI = {
  createRoute: (data: CreateRouteRequest) =>
    api.post<CreateRouteResponse>("/routes", data),

  getRoutes: (params?: GetRoutesQuery) =>
    api.get<RoutesResponse>("/routes", { params }),

  getRoute: (id: string) => api.get<RouteResponse>(`/routes/${id}`),

  updateRoute: (id: string, data: UpdateRouteRequest) =>
    api.put<UpdateRouteResponse>(`/routes/${id}`, data),

  deleteRoute: (id: string) => api.delete(`/routes/${id}`),
};

// Customers API
export const customersAPI = {
  createCustomer: (data: CreateCustomerRequest) =>
    api.post<CreateCustomerResponse>("/customers", data),

  getCustomers: (params?: GetCustomersQuery) =>
    api.get<CustomersResponse>("/customers", { params }),

  getCustomer: (id: string) => api.get<CustomerResponse>(`/customers/${id}`),

  updateCustomer: (id: string, data: UpdateCustomerRequest) =>
    api.put<UpdateCustomerResponse>(`/customers/${id}`, data),

  deleteCustomer: (id: string) => api.delete(`/customers/${id}`),
};

export default api;
