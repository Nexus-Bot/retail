'use client';

import React from 'react';
import { ProtectedRoute } from '@/components/auth/protected-route';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { useAuth } from '@/contexts/auth-context';
import { UserRole } from '@/types/api';
import { MasterDashboard } from '@/components/dashboards/master-dashboard';
import { OwnerDashboard } from '@/components/dashboards/owner-dashboard';
import { EmployeeDashboard } from '@/components/dashboards/employee-dashboard';

function DashboardContent() {
  const { user } = useAuth();

  // Render role-specific dashboard
  switch (user?.role) {
    case UserRole.MASTER:
      return <MasterDashboard />;
    case UserRole.OWNER:
      return <OwnerDashboard />;
    case UserRole.EMPLOYEE:
      return <EmployeeDashboard />;
    default:
      return (
        <div className="p-4">
          <div className="text-center py-10">
            <h2 className="text-lg font-semibold text-gray-900">Unknown Role</h2>
            <p className="text-gray-600">Please contact support for assistance.</p>
          </div>
        </div>
      );
  }
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <DashboardContent />
      </DashboardLayout>
    </ProtectedRoute>
  );
}