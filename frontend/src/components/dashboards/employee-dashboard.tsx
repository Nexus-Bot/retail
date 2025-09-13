"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { ShoppingBag, Settings, BarChart3 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMyItems } from "@/hooks/use-queries";
import { ItemStatus } from "@/types/api";

export function EmployeeDashboard() {
  const router = useRouter();
  const { user } = useAuth();

  const {
    data: myItemsData,
    error,
    refetch: refetchStats,
  } = useMyItems({
    limit: 1000,
    status: ItemStatus.WITH_EMPLOYEE,
  });

  const myItemsCount = myItemsData?.data?.data?.length || 0;

  return (
    <div className="p-4 space-y-6">
      {/* Welcome Section */}
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-gray-900">
          Hello {user?.username}!
        </h1>
        <div className="flex items-center space-x-2">
          <Badge variant="secondary" className="bg-green-100 text-green-700">
            EMPLOYEE
          </Badge>
          {user?.agency?.name && (
            <span className="text-sm text-gray-600">{user.agency.name}</span>
          )}
        </div>
      </div>

      {/* Error State */}
      {error && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-red-600">
              <p>{error?.message || "An error occurred"}</p>
              <Button
                variant="outline"
                onClick={() => refetchStats()}
                className="mt-2"
              >
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      )}


      {/* Employee Tools */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Employee Tools</h2>

        <div className="grid gap-4">
          <Card
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => router.push("/dashboard/my-items")}
          >
            <CardHeader>
              <CardTitle className="text-base flex items-center">
                <ShoppingBag className="mr-2 h-5 w-5" />
                My Items ({myItemsCount})
              </CardTitle>
              <CardDescription>
                View and manage items currently in your care. Update item
                status, mark as sold, and track your inventory.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => router.push("/dashboard/analytics/employee")}
          >
            <CardHeader>
              <CardTitle className="text-base flex items-center">
                <BarChart3 className="mr-2 h-5 w-5" />
                My Performance Analytics
              </CardTitle>
              <CardDescription>
                View your personal sales performance, assigned inventory tracking,
                and individual metrics dashboard.
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
                Manage your account settings and profile. Update personal
                information and preferences.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    </div>
  );
}
