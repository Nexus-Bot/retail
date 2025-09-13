'use client';

import React, { useState } from 'react';
import { ProtectedRoute } from '@/components/auth/protected-route';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Package, Plus, Search, Edit, Loader2 } from 'lucide-react';
import { UserRole, ItemStatus, ItemTypeSummary } from '@/types/api';
import { useItemTypes, useItemsSummary } from '@/hooks/use-queries';
import { AddItemsModal } from './components/add-items-modal';
import { BulkOperationsModal } from './components/bulk-operations-modal';
import { ItemTypeDetailsModal } from './components/item-type-details-modal';

function ItemsManagementContent() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItemType, setSelectedItemType] = useState<string>('');
  const [isBulkDialogOpen, setIsBulkDialogOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedItemTypeForDetails, setSelectedItemTypeForDetails] = useState<string>('');

  // Fetch item types and their summary using optimized hooks
  const { data: itemTypesData, isLoading: isLoadingTypes } = useItemTypes({
    search: searchTerm || undefined,
  });

  // Fetch items summary by item type (optimized - no unnecessary item fetching)
  const { data: itemsSummary } = useItemsSummary();

  const itemTypes = itemTypesData?.data?.data || [];
  const summary: ItemTypeSummary[] = itemsSummary?.summary || [];

  // Search is now handled server-side in the hook, no need for client-side filtering
  const filteredItemTypes = itemTypes;

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

  // Handle opening item type details
  const handleOpenDetails = (itemTypeId: string) => {
    setSelectedItemTypeForDetails(itemTypeId);
    setIsDetailsModalOpen(true);
  };


  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Items Management</h1>
          <p className="text-gray-600">Manage your inventory with bulk operations</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setIsAddModalOpen(true)} className="w-fit">
            <Plus className="h-4 w-4 mr-2" />
            Add Items
          </Button>
          <Button variant="outline" onClick={() => setIsBulkDialogOpen(true)} className="w-fit">
            <Edit className="h-4 w-4 mr-2" />
            Bulk Actions
          </Button>
        </div>
      </div>


      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Search item types..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Item Types Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Item Types & Inventory Summary</h2>
          <p className="text-sm text-gray-500">Click on any row to view detailed breakdown</p>
        </div>
        
        {isLoadingTypes ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Loading item types...</span>
          </div>
        ) : (
          <div className="rounded-md border bg-white">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Actions</TableHead>
                  <TableHead>Item Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Total Items</TableHead>
                  <TableHead>Available</TableHead>
                  <TableHead>With Employees</TableHead>
                  <TableHead>Sold</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItemTypes.map((itemType) => {
                  const typeSummary = getItemTypeSummary(itemType._id);
                  const availableCount = getStatusCount(itemType._id, ItemStatus.IN_INVENTORY);
                  const withEmployeeCount = getStatusCount(itemType._id, ItemStatus.WITH_EMPLOYEE);
                  const soldCount = getStatusCount(itemType._id, ItemStatus.SOLD);
                  
                  return (
                    <TableRow 
                      key={itemType._id}
                      className="cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => handleOpenDetails(itemType._id)}
                    >
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <div className="flex gap-1">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => {
                              setSelectedItemType(itemType._id);
                              setIsBulkDialogOpen(true);
                            }}
                            title="Bulk Operations"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
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
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
        
        {!isLoadingTypes && filteredItemTypes.length === 0 && (
          <div className="text-center py-10 bg-gray-50 rounded-md border">
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
      </div>

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

      <ItemTypeDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        itemType={itemTypes.find(type => type._id === selectedItemTypeForDetails) || null}
        summary={getItemTypeSummary(selectedItemTypeForDetails)}
        isLoading={isLoadingTypes}
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