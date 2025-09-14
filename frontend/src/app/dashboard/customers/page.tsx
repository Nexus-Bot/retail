"use client";

import React, { useState } from "react";
import { ProtectedRoute } from "@/components/auth/protected-route";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Users, Plus, Search, Loader2, Edit, Trash2, Phone, Route } from "lucide-react";
import { UserRole, Customer as ApiCustomer } from "@/types/api";
import { useCustomers } from "@/hooks/use-queries";
import { CreateCustomerModal } from './components/create-customer-modal';
import { EditCustomerModal } from './components/edit-customer-modal';
import { DeleteCustomerModal } from './components/delete-customer-modal';

function AllCustomersContent() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<ApiCustomer | null>(null);

  const {
    data: customersResponse,
    isLoading: loading,
    error,
    refetch: refetchCustomers,
  } = useCustomers({
    limit: 100,
    search: searchTerm || undefined,
  });

  const customers = customersResponse?.data?.data || [];
  const pagination = customersResponse?.data?.pagination;

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
          <p className="text-gray-600">
            Manage customer information and route assignments
            {pagination && (
              <span className="ml-2 text-sm">
                ({pagination.totalItems} total)
              </span>
            )}
          </p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)} className="w-fit">
          <Plus className="h-4 w-4 mr-2" />
          Add Customer
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-gray-50 border rounded-lg p-3 text-center">
          <div className="flex items-center justify-center mb-1">
            <Users className="h-4 w-4 text-gray-500 mr-1" />
            <span className="text-xs font-medium text-gray-600">Total</span>
          </div>
          <div className="text-xl font-bold text-gray-900">
            {loading ? "-" : customers.length}
          </div>
          <p className="text-xs text-gray-500">Customers</p>
        </div>
        <div className="bg-green-50 border rounded-lg p-3 text-center">
          <div className="flex items-center justify-center mb-1">
            <Users className="h-4 w-4 text-green-500 mr-1" />
            <span className="text-xs font-medium text-green-600">New</span>
          </div>
          <div className="text-xl font-bold text-green-900">
            {loading 
              ? "-" 
              : customers.filter((c: ApiCustomer) => {
                  const createdDate = new Date(c.createdAt);
                  const weekAgo = new Date();
                  weekAgo.setDate(weekAgo.getDate() - 7);
                  return createdDate > weekAgo;
                }).length}
          </div>
          <p className="text-xs text-green-600">This week</p>
        </div>
        <div className="bg-blue-50 border rounded-lg p-3 text-center">
          <div className="flex items-center justify-center mb-1">
            <Route className="h-4 w-4 text-blue-500 mr-1" />
            <span className="text-xs font-medium text-blue-600">Routes</span>
          </div>
          <div className="text-xl font-bold text-blue-900">
            {loading 
              ? "-" 
              : new Set(customers.map((c: ApiCustomer) => 
                  typeof c.route === 'object' ? c.route._id : c.route
                )).size}
          </div>
          <p className="text-xs text-blue-600">Unique</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Search customers by name or mobile..."
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
                  : "Failed to load customers"}
              </p>
              <Button
                variant="outline"
                onClick={() => refetchCustomers()}
                className="mt-2"
              >
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Customers Table */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Customers List</h2>
        
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
                  <TableHead>Customer Name</TableHead>
                  <TableHead>Mobile Number</TableHead>
                  <TableHead>Route</TableHead>
                  <TableHead>Created By</TableHead>
                  <TableHead>Created Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((customer: ApiCustomer) => (
                  <TableRow key={customer._id}>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            setSelectedCustomer(customer);
                            setIsEditModalOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            setSelectedCustomer(customer);
                            setIsDeleteModalOpen(true);
                          }}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {customer.name}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Phone className="h-3 w-3 text-gray-400" />
                        {customer.mobile}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {customer.route && typeof customer.route === "object"
                          ? customer.route.name
                          : "No Route"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {customer.createdBy && typeof customer.createdBy === "object"
                        ? customer.createdBy.username
                        : "Unknown"}
                    </TableCell>
                    <TableCell>
                      {new Date(customer.createdAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            {customers.length === 0 && !loading && (
              <div className="text-center py-10">
                <Users className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  No customers found
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {searchTerm
                    ? "Try adjusting your search terms."
                    : "No customers have been added yet."}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      <CreateCustomerModal 
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
      
      <EditCustomerModal 
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedCustomer(null);
        }}
        customer={selectedCustomer}
      />

      <DeleteCustomerModal 
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedCustomer(null);
        }}
        customer={selectedCustomer}
      />
    </div>
  );
}

export default function AllCustomersPage() {
  return (
    <ProtectedRoute allowedRoles={[UserRole.OWNER, UserRole.EMPLOYEE]}>
      <DashboardLayout>
        <AllCustomersContent />
      </DashboardLayout>
    </ProtectedRoute>
  );
}