"use client";

import React, { useState } from "react";
import { ProtectedRoute } from "@/components/auth/protected-route";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Route, Plus, Search, Loader2, Edit, Trash2 } from "lucide-react";
import { UserRole, Route as ApiRoute } from "@/types/api";
import { useRoutes } from "@/hooks/use-queries";
import { CreateRouteModal } from './components/create-route-modal';
import { EditRouteModal } from './components/edit-route-modal';
import { DeleteRouteModal } from './components/delete-route-modal';

function AllRoutesContent() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<ApiRoute | null>(null);

  const {
    data: routesResponse,
    isLoading: loading,
    error,
    refetch: refetchRoutes,
  } = useRoutes({
    limit: 100,
    search: searchTerm || undefined,
  });

  const routes = routesResponse?.data?.data || [];
  const pagination = routesResponse?.data?.pagination;

  const filteredRoutes = routes.filter((route: ApiRoute) =>
    route.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Routes</h1>
          <p className="text-gray-600">
            Manage delivery routes for your agency
            {pagination && (
              <span className="ml-2 text-sm">
                ({pagination.totalItems} total)
              </span>
            )}
          </p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)} className="w-fit">
          <Plus className="h-4 w-4 mr-2" />
          Create Route
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Routes</CardTitle>
            <Route className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "-" : routes.length}
            </div>
            <p className="text-xs text-muted-foreground">Active routes</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Routes</CardTitle>
            <Route className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading 
                ? "-" 
                : routes.filter((r: ApiRoute) => {
                    const createdDate = new Date(r.createdAt);
                    const weekAgo = new Date();
                    weekAgo.setDate(weekAgo.getDate() - 7);
                    return createdDate > weekAgo;
                  }).length}
            </div>
            <p className="text-xs text-muted-foreground">Created this week</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Search routes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Error State */}
      {error && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-red-600">
              <p>
                {error instanceof Error
                  ? error.message
                  : "Failed to load routes"}
              </p>
              <Button
                variant="outline"
                onClick={() => refetchRoutes()}
                className="mt-2"
              >
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Routes Table */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Routes List</h2>
        
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div className="rounded-md border bg-white">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Actions</TableHead>
                  <TableHead>Route Name</TableHead>
                  <TableHead>Created By</TableHead>
                  <TableHead>Created Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRoutes.map((route: ApiRoute) => (
                  <TableRow key={route._id}>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            setSelectedRoute(route);
                            setIsEditModalOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            setSelectedRoute(route);
                            setIsDeleteModalOpen(true);
                          }}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {route.name}
                    </TableCell>
                    <TableCell>
                      {route.createdBy && typeof route.createdBy === "object"
                        ? route.createdBy.username
                        : "Unknown"}
                    </TableCell>
                    <TableCell>
                      {new Date(route.createdAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            {filteredRoutes.length === 0 && !loading && (
              <div className="text-center py-10">
                <Route className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  No routes found
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {searchTerm
                    ? "Try adjusting your search terms."
                    : "No routes have been created yet."}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      <CreateRouteModal 
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
      
      <EditRouteModal 
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedRoute(null);
        }}
        route={selectedRoute}
      />

      <DeleteRouteModal 
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedRoute(null);
        }}
        route={selectedRoute}
      />
    </div>
  );
}

export default function AllRoutesPage() {
  return (
    <ProtectedRoute allowedRoles={[UserRole.OWNER]}>
      <DashboardLayout>
        <AllRoutesContent />
      </DashboardLayout>
    </ProtectedRoute>
  );
}