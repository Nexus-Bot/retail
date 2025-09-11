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
import { ShoppingBag, Loader2, Settings } from "lucide-react";
import { itemsAPI } from "@/lib/api";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ItemStatus } from "@/types/api";

export function EmployeeDashboard() {
  const router = useRouter();
  const { user } = useAuth();

  const {
    data: myItemsData,
    isLoading: loading,
    error,
    refetch: refetchStats,
  } = useQuery({
    queryKey: ["employee-my-items", user?._id],
    queryFn: () =>
      itemsAPI.getMyItems({ limit: 1000, status: ItemStatus.WITH_EMPLOYEE }),
    enabled: !!user?._id,
    staleTime: 60000,
    gcTime: 5 * 60 * 1000,
    retry: 1,
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

      {/* Stats */}
      <div className="grid gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Items</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Loading...</span>
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">{myItemsCount}</div>
                <p className="text-xs text-muted-foreground">
                  Items currently in your care
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

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
