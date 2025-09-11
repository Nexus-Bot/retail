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
import { UserRole } from '@/types/api';
import { useAuth } from '@/contexts/auth-context';
import { itemTypesAPI } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import type { ItemType } from '@/types/api';
import { CreateItemTypeModal } from './components/create-item-type-modal';
import { EditItemTypeModal } from './components/edit-item-type-modal';

function ItemTypesContent() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedItemType, setSelectedItemType] = useState<ItemType | null>(null);

  // Fetch item types from the backend
  const { data: itemTypesData, isLoading, error } = useQuery({
    queryKey: ['item-types', user?.agency?._id, searchTerm],
    queryFn: () => itemTypesAPI.getItemTypes({ 
      search: searchTerm || undefined,
      limit: 100 
    }),
    enabled: !!user?.agency?._id,
    staleTime: 60000,
    gcTime: 5 * 60 * 1000,
    retry: 1,
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Item Types</h1>
          <p className="text-gray-600">Manage your product definitions</p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Item Type
        </Button>
      </div>

      {/* Stats Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Item Types</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Loading...</span>
              </div>
            ) : (
              <div className="text-2xl font-bold">{itemTypes.length}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">With Grouping</CardTitle>
            <Package className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {itemTypes.filter(it => it.grouping && it.grouping.length > 0).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <Package className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {itemTypes.filter(it => it.isActive).length}
            </div>
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
          <CardTitle>Item Types List</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Loading item types...</span>
            </div>
          ) : error ? (
            <div className="text-center py-10">
              <div className="text-red-500">Failed to load item types</div>
              <p className="text-sm text-gray-500 mt-2">
                Please try again later
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Grouping</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {itemTypes.map((itemType) => (
                    <TableRow key={itemType._id}>
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
                      <TableCell>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleEdit(itemType)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          
          {!isLoading && !error && itemTypes.length === 0 && (
            <div className="text-center py-10">
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
        </CardContent>
      </Card>

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