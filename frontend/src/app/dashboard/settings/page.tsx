'use client';

import React, { useState } from 'react';
import { ProtectedRoute } from '@/components/auth/protected-route';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { Settings, User, Lock, Trash2, LogOut, Loader2 } from 'lucide-react';
import { useErrorHandler } from '@/hooks/use-error-handler';
import { UserRole } from '@/types/api';

function SettingsContent() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const { handleInfo, handleError } = useErrorHandler();
  const [isLoading, setIsLoading] = useState(false);
  const [profileData, setProfileData] = useState({
    username: user?.username || '',
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // TODO: Implement profile update API call when available
      // For now, just simulate the API call since profile update might not be implemented yet
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      handleInfo('Profile update functionality will be implemented soon');
    } catch {
      handleError(new Error('Failed to update profile. Please try again.'));
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      handleError(new Error('New passwords do not match!'));
      return;
    }

    setIsLoading(true);

    try {
      // TODO: Implement password change API call when available
      // For now, just simulate the API call since password change might not be implemented yet
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      handleInfo('Password change functionality will be implemented soon');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch {
      handleError(new Error('Failed to change password. Please try again.'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const handleProfileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePasswordInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600">Manage your account settings and preferences</p>
      </div>

      {/* Account Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <User className="mr-2 h-5 w-5" />
            Account Information
          </CardTitle>
          <CardDescription>Your current account details</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Username</p>
                <p className="text-sm text-gray-600">{user?.username}</p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Role</p>
                <div className="flex items-center space-x-2">
                  <Badge variant={user?.role === UserRole.MASTER ? 'default' : user?.role === UserRole.OWNER ? 'secondary' : 'outline'}>
                    {user?.role?.toUpperCase()}
                  </Badge>
                </div>
              </div>
            </div>
            {user?.agency && (
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Agency</p>
                  <p className="text-sm text-gray-600">{user.agency.name}</p>
                  <p className="text-xs text-gray-500">ID: {user.agency._id}</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Profile Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="mr-2 h-5 w-5" />
            Profile Settings
          </CardTitle>
          <CardDescription>Update your personal information</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleProfileUpdate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                name="username"
                type="text"
                value={profileData.username}
                onChange={handleProfileInputChange}
                className="h-12"
                disabled={isLoading}
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full sm:w-auto"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Profile'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Lock className="mr-2 h-5 w-5" />
            Change Password
          </CardTitle>
          <CardDescription>Update your account password</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input
                id="currentPassword"
                name="currentPassword"
                type="password"
                value={passwordData.currentPassword}
                onChange={handlePasswordInputChange}
                className="h-12"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                name="newPassword"
                type="password"
                value={passwordData.newPassword}
                onChange={handlePasswordInputChange}
                className="h-12"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={passwordData.confirmPassword}
                onChange={handlePasswordInputChange}
                className="h-12"
                disabled={isLoading}
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
              className="w-full sm:w-auto"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Changing...
                </>
              ) : (
                'Change Password'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Account Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Account Actions</CardTitle>
          <CardDescription>Manage your account</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Sign out</p>
              <p className="text-sm text-gray-600">Sign out from your account</p>
            </div>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>

          <div className="border-t border-gray-200" />

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-red-600">Delete Account</p>
              <p className="text-sm text-gray-600">Permanently delete your account and all data</p>
            </div>
            <Button variant="destructive" disabled>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Account
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <SettingsContent />
      </DashboardLayout>
    </ProtectedRoute>
  );
}