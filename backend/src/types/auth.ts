export enum UserRole {
  MASTER = 'master',
  OWNER = 'owner',
  EMPLOYEE = 'employee'
}

export enum Permission {
  // User Management
  CREATE_USERS = 'create_users',
  READ_USERS = 'read_users',
  UPDATE_USERS = 'update_users',
  DELETE_USERS = 'delete_users',
  
  // Agency Management
  CREATE_AGENCIES = 'create_agencies',
  READ_AGENCIES = 'read_agencies',
  UPDATE_AGENCIES = 'update_agencies',
  DELETE_AGENCIES = 'delete_agencies',
  
  // Inventory Management
  CREATE_INVENTORY = 'create_inventory',
  READ_INVENTORY = 'read_inventory',
  UPDATE_INVENTORY = 'update_inventory',
  DELETE_INVENTORY = 'delete_inventory',
  
  // Reports
  VIEW_REPORTS = 'view_reports',
  EXPORT_DATA = 'export_data'
}

export interface AuthUser {
  id: string;
  username: string;
  role: UserRole;
  agencyId?: string;
  permissions: Permission[];
  tokenId?: string;
}