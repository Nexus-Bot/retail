"use client";

import React from "react";
import { ProtectedRoute } from "@/components/auth/protected-route";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { UserRole } from "@/types/api";
import { AnalyticsTable } from "@/components/analytics/analytics-table";

function EmployeeAnalyticsContent() {
  return (
    <div className="p-4">
      <AnalyticsTable
        showEmployeeSelector={false}
        title="Employee Analytics"
        description="Sales and returns analysis by item type"
      />
    </div>
  );
}

export default function EmployeeAnalyticsPage() {
  return (
    <ProtectedRoute allowedRoles={[UserRole.EMPLOYEE]}>
      <DashboardLayout>
        <EmployeeAnalyticsContent />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
