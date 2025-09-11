'use client';

import React, { useState } from 'react';
import { ProtectedRoute } from '@/components/auth/protected-route';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Package, Plus, Search, Edit, Loader2 } from 'lucide-react';
import { UserRole, ItemStatus, ItemTypeSummary } from '@/types/api';
import { useAuth } from '@/contexts/auth-context';
import { itemsAPI, itemTypesAPI } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import { AddItemsModal } from './components/add-items-modal';
import { BulkOperationsModal } from './components/bulk-operations-modal';

function ItemsManagementContent() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItemType, setSelectedItemType] = useState<string>('');
  const [isBulkDialogOpen, setIsBulkDialogOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Fetch item types and their summary
  const { data: itemTypesData, isLoading: isLoadingTypes } = useQuery({
    queryKey: ['itemTypes', user?.agency?._id],
    queryFn: () => itemTypesAPI.getItemTypes({ limit: 1000 }),
    enabled: !!user?.agency?._id,
    staleTime: 60000,
  });

  // Fetch items summary by item type
  const { data: itemsSummary, isLoading: isLoadingSummary } = useQuery({
    queryKey: ['itemsSummary', user?.agency?._id],
    queryFn: async () => {
      const response = await itemsAPI.getItems({ limit: 1 });
      return response.data;
    },
    enabled: !!user?.agency?._id,
    staleTime: 30000,
  });

  const itemTypes = itemTypesData?.data?.data || [];
  const summary: ItemTypeSummary[] = itemsSummary?.summary || [];

  // Filter item types based on search term
  const filteredItemTypes = itemTypes.filter(itemType => 
    itemType.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get summary for a specific item type
  const getItemTypeSummary = (itemTypeId: string): ItemTypeSummary => {
    return summary.find((s) => s._id === itemTypeId) || {
      _id: itemTypeId,
      itemTypeName: '',
      totalCount: 0,
      statusCounts: []
    };
  };

  // Get count for specific status
  const getStatusCount = (itemTypeId: string, status: ItemStatus): number => {
    const typeSummary = getItemTypeSummary(itemTypeId);
    const statusCount = typeSummary.statusCounts.find((s) => s.status === status);
    return statusCount?.count || 0;
  };

  const getTotalStats = () => {
    const totals = { total: 0, available: 0, withEmployee: 0, sold: 0 };
    summary.forEach((s) => {
      totals.total += s.totalCount;
      s.statusCounts.forEach((sc) => {
        if (sc.status === ItemStatus.IN_INVENTORY) totals.available += sc.count;
        else if (sc.status === ItemStatus.WITH_EMPLOYEE) totals.withEmployee += sc.count;
        else if (sc.status === ItemStatus.SOLD) totals.sold += sc.count;
      });
    });
    return totals;
  };

  const totalStats = getTotalStats();

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Items Management</h1>
          <p className="text-gray-600">Manage your inventory with bulk operations</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsAddModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Items
          </Button>
          <Button variant="outline" onClick={() => setIsBulkDialogOpen(true)}>
            <Edit className="h-4 w-4 mr-2" />
            Bulk Actions
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoadingSummary ? (
              <div className="flex items-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Loading...</span>
              </div>
            ) : (
              <div className="text-2xl font-bold">{totalStats.total}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available</CardTitle>
            <Package className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            {isLoadingSummary ? (
              <div className="flex items-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Loading...</span>
              </div>
            ) : (
              <div className="text-2xl font-bold">{totalStats.available}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">With Employees</CardTitle>
            <Package className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            {isLoadingSummary ? (
              <div className="flex items-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Loading...</span>
              </div>
            ) : (
              <div className="text-2xl font-bold">{totalStats.withEmployee}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sold</CardTitle>
            <Package className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            {isLoadingSummary ? (
              <div className="flex items-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Loading...</span>
              </div>
            ) : (
              <div className="text-2xl font-bold">{totalStats.sold}</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search item types..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Item Types Table */}
      <Card>
        <CardHeader>
          <CardTitle>Item Types & Inventory Summary</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingTypes ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Loading item types...</span>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Total Items</TableHead>
                    <TableHead>Available</TableHead>
                    <TableHead>With Employees</TableHead>
                    <TableHead>Sold</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItemTypes.map((itemType) => {
                    const typeSummary = getItemTypeSummary(itemType._id);
                    const availableCount = getStatusCount(itemType._id, ItemStatus.IN_INVENTORY);
                    const withEmployeeCount = getStatusCount(itemType._id, ItemStatus.WITH_EMPLOYEE);
                    const soldCount = getStatusCount(itemType._id, ItemStatus.SOLD);
                    
                    return (
                      <TableRow key={itemType._id}>
                        <TableCell className="font-medium">{itemType.name}</TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {itemType.description || '-'}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{typeSummary.totalCount}</div>
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-blue-100 text-blue-700">
                            {availableCount}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-yellow-100 text-yellow-700">
                            {withEmployeeCount}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-green-100 text-green-700">
                            {soldCount}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => {
                                setSelectedItemType(itemType._id);
                                setIsBulkDialogOpen(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
          
          {!isLoadingTypes && filteredItemTypes.length === 0 && (
            <div className="text-center py-10">
              <Package className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No item types found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm 
                  ? 'Try adjusting your search terms.' 
                  : 'Create item types first, then add items to your inventory.'}
              </p>
              {!searchTerm && (
                <div className="flex gap-2 justify-center mt-4">
                  <Button 
                    variant="outline"
                    onClick={() => window.open('/dashboard/item-types', '_blank')}
                  >
                    <Package className="h-4 w-4 mr-2" />
                    Create Item Types
                  </Button>
                  <Button 
                    onClick={() => setIsAddModalOpen(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Items
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <AddItemsModal 
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />
      
      <BulkOperationsModal 
        isOpen={isBulkDialogOpen}
        onClose={() => setIsBulkDialogOpen(false)}
        itemTypes={itemTypes}
        selectedItemType={selectedItemType}
        onItemTypeChange={setSelectedItemType}
      />
    </div>
  );
}

export default function ItemsPage() {
  return (
    <ProtectedRoute allowedRoles={[UserRole.OWNER, UserRole.EMPLOYEE]}>
      <DashboardLayout>
        <ItemsManagementContent />
      </DashboardLayout>
    </ProtectedRoute>
  );
}