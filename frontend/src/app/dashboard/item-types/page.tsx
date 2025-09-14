'use client';

import React, { useState } from 'react';
import { ProtectedRoute } from '@/components/auth/protected-route';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Package, Plus, Search, Edit, Loader2 } from 'lucide-react';
import { UserRole } from '@/types/api';
import { useItemTypes } from '@/hooks/use-queries';
import type { ItemType } from '@/types/api';
import { CreateItemTypeModal } from './components/create-item-type-modal';
import { EditItemTypeModal } from './components/edit-item-type-modal';

function ItemTypesContent() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedItemType, setSelectedItemType] = useState<ItemType | null>(null);

  // Fetch item types from the backend using optimized hook
  const { data: itemTypesData, isLoading, error } = useItemTypes({
    search: searchTerm || undefined,
    limit: 100
  });

  const itemTypes = itemTypesData?.data?.data || [];

  const handleEdit = (itemType: ItemType) => {
    setSelectedItemType(itemType);
    setIsEditModalOpen(true);
  };

  const formatGrouping = (grouping?: Array<{ groupName: string; unitsPerGroup: number }>) => {
    if (!grouping || grouping.length === 0) return 'None';
    return grouping.map(g => `${g.groupName} (${g.unitsPerGroup})`).join(', ');
  };

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Item Types</h1>
          <p className="text-gray-600">Manage your product definitions</p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)} className="w-fit">
          <Plus className="h-4 w-4 mr-2" />
          Create Item Type
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-gray-50 border rounded-lg p-3 text-center">
          <div className="flex items-center justify-center mb-1">
            <Package className="h-4 w-4 text-gray-500 mr-1" />
            <span className="text-xs font-medium text-gray-600">Total</span>
          </div>
          {isLoading ? (
            <div className="flex items-center justify-center">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          ) : (
            <div className="text-xl font-bold text-gray-900">{itemTypes.length}</div>
          )}
        </div>
        <div className="bg-blue-50 border rounded-lg p-3 text-center">
          <div className="flex items-center justify-center mb-1">
            <Package className="h-4 w-4 text-blue-500 mr-1" />
            <span className="text-xs font-medium text-blue-600">Grouped</span>
          </div>
          <div className="text-xl font-bold text-blue-900">
            {itemTypes.filter(it => it.grouping && it.grouping.length > 0).length}
          </div>
        </div>
        <div className="bg-green-50 border rounded-lg p-3 text-center">
          <div className="flex items-center justify-center mb-1">
            <Package className="h-4 w-4 text-green-500 mr-1" />
            <span className="text-xs font-medium text-green-600">Active</span>
          </div>
          <div className="text-xl font-bold text-green-900">
            {itemTypes.filter(it => it.isActive).length}
          </div>
        </div>
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
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Item Types List</h2>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Loading item types...</span>
          </div>
        ) : error ? (
          <div className="text-center py-10 bg-gray-50 rounded-md border">
            <div className="text-red-500">Failed to load item types</div>
            <p className="text-sm text-gray-500 mt-2">
              Please try again later
            </p>
          </div>
        ) : (
          <div className="rounded-md border bg-white">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Actions</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Grouping</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {itemTypes.map((itemType) => (
                  <TableRow key={itemType._id}>
                    <TableCell>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleEdit(itemType)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </TableCell>
                    <TableCell className="font-medium">{itemType.name}</TableCell>
                    <TableCell>{itemType.description || '-'}</TableCell>
                    <TableCell>{formatGrouping(itemType.grouping)}</TableCell>
                    <TableCell>
                      <Badge variant={itemType.isActive ? 'default' : 'secondary'}>
                        {itemType.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(itemType.createdAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
        
        {!isLoading && !error && itemTypes.length === 0 && (
          <div className="text-center py-10 bg-gray-50 rounded-md border">
            <Package className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No item types found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm 
                ? 'Try adjusting your search.' 
                : 'Get started by creating your first item type.'}
            </p>
            {!searchTerm && (
              <Button 
                className="mt-4"
                onClick={() => setIsCreateModalOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Item Type
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      <CreateItemTypeModal 
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
      
      <EditItemTypeModal 
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedItemType(null);
        }}
        itemType={selectedItemType}
      />
    </div>
  );
}

export default function ItemTypesPage() {
  return (
    <ProtectedRoute allowedRoles={[UserRole.OWNER]}>
      <DashboardLayout>
        <ItemTypesContent />
      </DashboardLayout>
    </ProtectedRoute>
  );
}