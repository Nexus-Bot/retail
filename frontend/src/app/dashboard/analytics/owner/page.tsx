'use client';

import React from 'react';
import { ProtectedRoute } from '@/components/auth/protected-route';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { UserRole } from '@/types/api';
import { AnalyticsTable } from '@/components/analytics/analytics-table';

function OwnerAnalyticsContent() {
  return (
    <div className="p-4">
      <AnalyticsTable
        showEmployeeSelector={true}
        title="Owner Analytics"
        description="Sales and returns analysis by item type and employee"
      />
    </div>
  );
}

export default function OwnerAnalyticsPage() {
  return (
    <ProtectedRoute allowedRoles={[UserRole.OWNER]}>
      <DashboardLayout>
        <OwnerAnalyticsContent />
      </DashboardLayout>
    </ProtectedRoute>
  );
}