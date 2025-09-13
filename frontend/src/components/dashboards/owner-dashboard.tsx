"use client";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/contexts/auth-context";
import { ItemStatus, User, UserRole } from "@/types/api";
import { useOwnerDashboard } from "@/hooks/use-queries";
import { Loader2, Package, TrendingUp, Users, BarChart3, Settings } from "lucide-react";
import { useRouter } from "next/navigation";

interface OwnerStats {
  totalItems: number;
  itemsWithEmployees: number;
  soldItems: number;
  employees: number;
}

export function OwnerDashboard() {
  const router = useRouter();
  const { user } = useAuth();

  // Fetch dashboard data using optimized hook
  const { items: itemsQuery, users: usersQuery, isLoading } = useOwnerDashboard();
  
  const itemsData = itemsQuery.data;
  const usersData = usersQuery.data;

  // Calculate stats from real data
  const items = itemsData?.data?.data || [];
  const users = usersData?.data?.data || [];
  const employees = users.filter((u: User) => u.role === UserRole.EMPLOYEE);

  const stats: OwnerStats = {
    totalItems: items.length,
    itemsWithEmployees: items.filter(
      (item) => item.status === ItemStatus.WITH_EMPLOYEE
    ).length,
    soldItems: items.filter((item) => item.status === ItemStatus.SOLD).length,
    employees: employees.length,
  };

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

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Loading...</span>
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {stats?.totalItems?.toLocaleString() || "0"}
                </div>
                <p className="text-xs text-muted-foreground">In inventory</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              With Employees
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Loading...</span>
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {stats?.itemsWithEmployees || 0}
                </div>
                <p className="text-xs text-muted-foreground">Items assigned</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sold Items</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Loading...</span>
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {stats?.soldItems || 0}
                </div>
                <p className="text-xs text-muted-foreground">Items sold</p>
              </>
            )}
          </CardContent>
        </Card>
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
            onClick={() => router.push("/dashboard/employees")}
          >
            <CardHeader>
              <CardTitle className="text-base flex items-center">
                <Users className="mr-2 h-5 w-5" />
                Employees ({stats?.employees || 0})
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
