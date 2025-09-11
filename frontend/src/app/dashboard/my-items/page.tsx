'use client';

import React, { useState } from 'react';
import { ProtectedRoute } from '@/components/auth/protected-route';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ShoppingBag, Search, Edit, TrendingUp, Loader2 } from 'lucide-react';
import { useItemTypes, useMyItemsSummary } from '@/hooks/use-queries';
import { UserRole, ItemStatus, ItemTypeSummary } from '@/types/api';
import { BulkUpdateItemsModal } from './components/bulk-update-items-modal';

function MyItemsContent() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItemType, setSelectedItemType] = useState<string>('');
  const [isBulkDialogOpen, setIsBulkDialogOpen] = useState(false);

  // Fetch item types using optimized hook
  const { data: itemTypesData } = useItemTypes();

  // Fetch my items summary (items assigned to current employee) using optimized hook
  const { data: myItemsSummary, isLoading: isLoadingSummary, error, refetch: refetchSummary } = useMyItemsSummary();

  const itemTypes = itemTypesData?.data?.data || [];
  const summary: ItemTypeSummary[] = myItemsSummary?.summary || [];

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
    const totals = { total: 0, inCare: 0, sold: 0, totalRevenue: 0 };
    summary.forEach((s) => {
      totals.total += s.totalCount;
      s.statusCounts.forEach((sc) => {
        if (sc.status === ItemStatus.WITH_EMPLOYEE) totals.inCare += sc.count;
        else if (sc.status === ItemStatus.SOLD) totals.sold += sc.count;
      });
    });
    return totals;
  };


  const totalStats = getTotalStats();

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Items</h1>
          <p className="text-gray-600">Manage items assigned to you with bulk operations</p>
        </div>
        <Button onClick={() => setIsBulkDialogOpen(true)} className="w-fit">
          <Edit className="h-4 w-4 mr-2" />
          Update Items Status
        </Button>
      </div>

      {/* Bulk Update Modal */}
      <BulkUpdateItemsModal 
        isOpen={isBulkDialogOpen}
        onClose={() => setIsBulkDialogOpen(false)}
        itemTypes={itemTypes}
        selectedItemType={selectedItemType}
        onItemTypeSelect={setSelectedItemType}
      />

      {/* Error State */}
      {error && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-red-600">
              <p>{error?.message || 'An error occurred'}</p>
              <Button 
                variant="outline" 
                onClick={() => refetchSummary()} 
                className="mt-2"
              >
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In My Care</CardTitle>
            <ShoppingBag className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoadingSummary ? '-' : totalStats.inCare}</div>
            <p className="text-xs text-muted-foreground">
              Ready to sell
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sold</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoadingSummary ? '-' : totalStats.sold}</div>
            <p className="text-xs text-muted-foreground">
              Successfully sold
            </p>
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

      {/* Item Types List */}
      <Card>
        <CardHeader>
          <CardTitle>My Item Types</CardTitle>
          <p className="text-sm text-muted-foreground">
            Items assigned to you grouped by type
          </p>
        </CardHeader>
        <CardContent>
          {isLoadingSummary ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item Type</TableHead>
                    <TableHead>In My Care</TableHead>
                    <TableHead>Sold by Me</TableHead>
                    <TableHead>In Inventory</TableHead>
                    <TableHead>Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItemTypes.map((itemType) => {
                    const typeSummary = getItemTypeSummary(itemType._id);
                    const inCareCount = getStatusCount(itemType._id, ItemStatus.WITH_EMPLOYEE);
                    const soldCount = getStatusCount(itemType._id, ItemStatus.SOLD);
                    const inventoryCount = getStatusCount(itemType._id, ItemStatus.IN_INVENTORY);
                    const totalCount = typeSummary.totalCount;

                    // Show all item types that exist in the agency, even if employee has 0 items
                    return (
                      <TableRow key={itemType._id}>
                        <TableCell className="font-medium">{itemType.name}</TableCell>
                        <TableCell>
                          <Badge className="bg-yellow-100 text-yellow-700">
                            {inCareCount}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-green-100 text-green-700">
                            {soldCount}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-blue-100 text-blue-700">
                            {inventoryCount}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm font-medium">{totalCount}</div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              
              {filteredItemTypes.length === 0 && (
                <div className="text-center py-10">
                  <ShoppingBag className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No item types found</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {searchTerm 
                      ? 'Try adjusting your search.' 
                      : 'No item types exist in your agency yet.'}
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function MyItemsPage() {
  return (
    <ProtectedRoute allowedRoles={[UserRole.EMPLOYEE]}>
      <DashboardLayout>
        <MyItemsContent />
      </DashboardLayout>
    </ProtectedRoute>
  );
}