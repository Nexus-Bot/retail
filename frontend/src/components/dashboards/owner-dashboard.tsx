"use client";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/contexts/auth-context";
import { User, UserRole } from "@/types/api";
import { useOwnerDashboard } from "@/hooks/use-queries";
import { Package, Users, BarChart3, Settings, Route, UserCheck } from "lucide-react";
import { useRouter } from "next/navigation";

export function OwnerDashboard() {
  const router = useRouter();
  const { user } = useAuth();

  // Fetch dashboard data using optimized hooks
  const { users: usersQuery } = useOwnerDashboard();
  
  const usersData = usersQuery.data;

  // Calculate employee count
  const users = usersData?.data?.data || [];
  const employees = users.filter((u: User) => u.role === UserRole.EMPLOYEE);

  return (
    <div className="p-4 space-y-6">
      {/* Welcome Section */}
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user?.username}!
        </h1>
        <div className="flex items-center space-x-2">
          <Badge variant="default" className="bg-blue-600">
            OWNER
          </Badge>
          {user?.agency?.name && (
            <span className="text-sm text-gray-600">{user.agency.name}</span>
          )}
        </div>
      </div>


      {/* Business Operations */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Business Operations</h2>

        <div className="grid gap-4">
          <Card
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => router.push("/dashboard/items")}
          >
            <CardHeader>
              <CardTitle className="text-base flex items-center">
                <Package className="mr-2 h-5 w-5" />
                Items Management
              </CardTitle>
              <CardDescription>
                Manage your inventory with bulk operations. Add new items, assign to employees, and track status changes.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => router.push("/dashboard/item-types")}
          >
            <CardHeader>
              <CardTitle className="text-base flex items-center">
                <Package className="mr-2 h-5 w-5" />
                Item Types
              </CardTitle>
              <CardDescription>
                Create and manage product definitions. Define item categories, groupings, and specifications.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => router.push("/dashboard/routes")}
          >
            <CardHeader>
              <CardTitle className="text-base flex items-center">
                <Route className="mr-2 h-5 w-5" />
                Routes
              </CardTitle>
              <CardDescription>
                Manage delivery routes and territories. Organize customer locations and optimize distribution paths.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => router.push("/dashboard/customers")}
          >
            <CardHeader>
              <CardTitle className="text-base flex items-center">
                <UserCheck className="mr-2 h-5 w-5" />
                Customers
              </CardTitle>
              <CardDescription>
                Manage customer database and relationships. Track customer information, purchase history, and routes.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => router.push("/dashboard/employees")}
          >
            <CardHeader>
              <CardTitle className="text-base flex items-center">
                <Users className="mr-2 h-5 w-5" />
                Employees ({employees.length})
              </CardTitle>
              <CardDescription>
                Manage your team members. Add new employees, view performance, and assign items to employees.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => router.push("/dashboard/analytics/owner")}
          >
            <CardHeader>
              <CardTitle className="text-base flex items-center">
                <BarChart3 className="mr-2 h-5 w-5" />
                Analytics
              </CardTitle>
              <CardDescription>
                View sales reports and inventory insights. Track performance metrics and business trends.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => router.push("/dashboard/settings")}
          >
            <CardHeader>
              <CardTitle className="text-base flex items-center">
                <Settings className="mr-2 h-5 w-5" />
                Settings
              </CardTitle>
              <CardDescription>
                Manage your account settings and agency preferences. Update profile and business information.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    </div>
  );
}
