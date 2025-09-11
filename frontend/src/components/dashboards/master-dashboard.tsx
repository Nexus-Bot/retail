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
import { Activity, Loader2, Building2, Users } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { systemAPI } from "@/lib/api";
import { HealthResponse } from "@/types/api";

export function MasterDashboard() {
  const router = useRouter();

  const {
    data: health,
    isLoading: loading,
    error,
    refetch: refetchHealth,
  } = useQuery<HealthResponse>({
    queryKey: ["health-status"],
    queryFn: async () => {
      const response = await systemAPI.getHealth();
      return response.data;
    },
    staleTime: 30000, // Consider fresh for 30 seconds
    gcTime: 2 * 60 * 1000, // Keep in cache for 2 minutes
    retry: 2,
  });

  return (
    <div className="p-4 space-y-6">
      {/* Welcome Section */}
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-gray-900">
          Master Control Panel
        </h1>
        <div className="flex items-center space-x-2">
          <Badge variant="default" className="bg-purple-600">
            MASTER
          </Badge>
          <span className="text-sm text-gray-600">System Administrator</span>
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
                onClick={() => refetchHealth()}
                className="mt-2"
              >
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* System Health Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Loading...</span>
              </div>
            ) : (
              <>
                <div
                  className={`text-2xl font-bold ${
                    health?.status === "healthy"
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {health?.status?.toUpperCase() || "UNKNOWN"}
                </div>
                <p className="text-xs text-muted-foreground">
                  Version: {health?.version || "N/A"}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Uptime</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Loading...</span>
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold text-blue-600">
                  {health?.uptime ? Math.floor(health.uptime / 3600) : 0}h
                </div>
                <p className="text-xs text-muted-foreground">Hours running</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Management Overview */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">System Management</h2>

        <div className="grid gap-4">
          <Card
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => router.push("/dashboard/agencies")}
          >
            <CardHeader>
              <CardTitle className="text-base flex items-center">
                <Building2 className="mr-2 h-5 w-5" />
                All Agencies
              </CardTitle>
              <CardDescription>
                View and manage all registered agencies. Create new agencies, edit existing ones, and oversee the entire network.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => router.push("/dashboard/users")}
          >
            <CardHeader>
              <CardTitle className="text-base flex items-center">
                <Users className="mr-2 h-5 w-5" />
                All Users
              </CardTitle>
              <CardDescription>
                Manage all system users across agencies. Create new users, assign roles, and maintain user accounts.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    </div>
  );
}
