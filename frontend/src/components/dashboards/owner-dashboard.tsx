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
import { itemsAPI, usersAPI } from "@/lib/api";
import { ItemStatus, User, UserRole } from "@/types/api";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Package, Plus, TrendingUp, Users } from "lucide-react";
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

  // Fetch items data
  const { data: itemsData, isLoading: itemsLoading } = useQuery({
    queryKey: ["owner-items", user?.agency?._id],
    queryFn: () => itemsAPI.getItems({ limit: 1000 }),
    enabled: !!user?.agency?._id,
    staleTime: 60000,
    gcTime: 5 * 60 * 1000,
    retry: 1,
  });

  // Fetch users/employees data
  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ["agency-users", user?.agency?._id],
    queryFn: () => usersAPI.getUsers({ limit: 1000 }),
    enabled: !!user?.agency?._id,
    staleTime: 60000,
    gcTime: 5 * 60 * 1000,
    retry: 1,
  });

  const loading = itemsLoading || usersLoading;

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
            {loading ? (
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
            {loading ? (
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
            {loading ? (
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

      {/* Quick Actions */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>

        <div className="grid gap-4">
          <Card
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => router.push("/dashboard/items")}
          >
            <CardHeader>
              <CardTitle className="text-base flex items-center">
                <Package className="mr-2 h-5 w-5" />
                Manage Inventory
              </CardTitle>
              <CardDescription>View and update your items</CardDescription>
            </CardHeader>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => router.push("/dashboard/employees")}
          >
            <CardHeader>
              <CardTitle className="text-base flex items-center">
                <Users className="mr-2 h-5 w-5" />
                Manage Employees ({stats?.employees || 0})
              </CardTitle>
              <CardDescription>
                View employee performance and assign items
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
                Manage Item Types
              </CardTitle>
              <CardDescription>
                Create and manage product definitions
              </CardDescription>
            </CardHeader>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => router.push("/dashboard/analytics")}
          >
            <CardHeader>
              <CardTitle className="text-base flex items-center">
                <TrendingUp className="mr-2 h-5 w-5" />
                View Analytics
              </CardTitle>
              <CardDescription>
                Sales reports and inventory insights
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    </div>
  );
}
