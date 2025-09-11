import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { UserRole, Permission } from '../types/auth';

interface ISession {
  tokenId: string;
  createdAt: Date;
  lastUsed: Date;
  userAgent?: string;
  ipAddress?: string;
}

interface IUser extends mongoose.Document {
  username: string;
  password: string;
  role: UserRole;
  agency?: mongoose.Types.ObjectId;
  permissions: Permission[];
  status: 'active' | 'inactive' | 'suspended';
  lastLogin?: Date;
  createdBy?: mongoose.Types.ObjectId;
  activeSessions: ISession[];
  comparePassword(candidatePassword: string): Promise<boolean>;
  getDefaultPermissions(): Permission[];
  addSession(tokenId: string, userAgent?: string, ipAddress?: string): void;
  removeSession(tokenId: string): void;
  removeAllSessions(): void;
}

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 50,
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
  },
  role: {
    type: String,
    enum: Object.values(UserRole),
    required: true,
  },
  agency: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Agency',
    required: function(this: any) {
      return this.role !== UserRole.MASTER;
    },
  },
  permissions: [{
    type: String,
    enum: Object.values(Permission),
  }],
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active',
  },
  lastLogin: {
    type: Date,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  activeSessions: [{
    tokenId: {
      type: String,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    lastUsed: {
      type: Date,
      default: Date.now,
    },
    userAgent: String,
    ipAddress: String,
  }],
}, {
  timestamps: true,
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Get role-based default permissions
userSchema.methods.getDefaultPermissions = function(): Permission[] {
  switch (this.role) {
    case UserRole.MASTER:
      return Object.values(Permission);
    
    case UserRole.OWNER:
      return [
        Permission.CREATE_USERS,
        Permission.READ_USERS,
        Permission.UPDATE_USERS,
        Permission.DELETE_USERS,
        Permission.READ_AGENCIES,
        Permission.UPDATE_AGENCIES,
        Permission.CREATE_INVENTORY,
        Permission.READ_INVENTORY,
        Permission.UPDATE_INVENTORY,
        Permission.DELETE_INVENTORY,
        Permission.VIEW_REPORTS,
        Permission.EXPORT_DATA,
      ];
    
    case UserRole.EMPLOYEE:
      return [
        Permission.READ_INVENTORY,
        Permission.UPDATE_INVENTORY,
        Permission.VIEW_REPORTS,
      ];
    
    default:
      return [];
  }
};

// Set default permissions if not provided
userSchema.pre('save', function(next) {
  if (this.isNew && (!this.permissions || this.permissions.length === 0)) {
    this.permissions = (this as any).getDefaultPermissions();
  }
  next();
});

// Session management methods
userSchema.methods.addSession = function(tokenId: string, userAgent?: string, ipAddress?: string): void {
  this.activeSessions.push({
    tokenId,
    createdAt: new Date(),
    lastUsed: new Date(),
    userAgent,
    ipAddress,
  });
};

userSchema.methods.removeSession = function(tokenId: string): void {
  this.activeSessions = this.activeSessions.filter((session: ISession) => session.tokenId !== tokenId);
};

userSchema.methods.removeAllSessions = function(): void {
  this.activeSessions = [];
};

// Indexes for query optimization
userSchema.index({ username: 1 });                    // Login queries
userSchema.index({ status: 1, agency: 1 });          // User listing with filters
userSchema.index({ "activeSessions.tokenId": 1 });   // Auth token lookup
userSchema.index({ role: 1, agency: 1 });            // Role-based queries
userSchema.index({ createdAt: -1 });                  // Recent users sorting

export default mongoose.model<IUser>('User', userSchema);