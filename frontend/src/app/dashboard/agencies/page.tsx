"use client";

import { ProtectedRoute } from "@/components/auth/protected-route";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { agenciesAPI } from "@/lib/api";
import { Agency, UserRole } from "@/types/api";
import { useQuery } from "@tanstack/react-query";
import { Building2, Loader2, Plus, Search, Edit } from "lucide-react";
import { useState } from "react";
import { CreateAgencyModal } from './components/create-agency-modal';
import { EditAgencyModal } from './components/edit-agency-modal';

function AllAgenciesContent() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedAgency, setSelectedAgency] = useState<Agency | null>(null);

  const {
    data: agencies = [],
    isLoading: loading,
    error,
    refetch: refetchAgencies,
  } = useQuery({
    queryKey: ["agencies"],
    queryFn: async () => {
      const response = await agenciesAPI.getAgencies();
      return response?.data?.data ?? [];
    },
    staleTime: 30000, // Consider data fresh for 30 seconds
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
    retry: 2,
  });

  const filteredAgencies = agencies.filter((agency: Agency) =>
    agency.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">All Agencies</h1>
          <p className="text-gray-600">Manage all registered agencies</p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Agency
        </Button>
      </div>

      {/* Stats Card */}
      <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Agencies
            </CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "-" : agencies.length}
            </div>
            <p className="text-xs text-muted-foreground">Registered agencies</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search agencies..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Error State */}
      {error && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-red-600">
              <p>
                {error instanceof Error
                  ? error.message
                  : "Failed to load agencies"}
              </p>
              <Button
                variant="outline"
                onClick={() => refetchAgencies()}
                className="mt-2"
              >
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Agencies Table */}
      <Card>
        <CardHeader>
          <CardTitle>Agencies List</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Agency Name</TableHead>
                    <TableHead>Created Date</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAgencies.map((agency: Agency) => (
                    <TableRow key={agency._id}>
                      <TableCell className="font-medium">
                        {agency.name}
                      </TableCell>
                      <TableCell>
                        {new Date(agency.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {new Date(agency.updatedAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            setSelectedAgency(agency);
                            setIsEditModalOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {filteredAgencies.length === 0 && !loading && (
                <div className="text-center py-10">
                  <Building2 className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">
                    No agencies found
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {searchTerm
                      ? "Try adjusting your search terms."
                      : "Get started by creating your first agency."}
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <CreateAgencyModal 
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
      
      <EditAgencyModal 
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedAgency(null);
        }}
        agency={selectedAgency}
      />
    </div>
  );
}

export default function AllAgenciesPage() {
  return (
    <ProtectedRoute allowedRoles={[UserRole.MASTER]}>
      <DashboardLayout>
        <AllAgenciesContent />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
