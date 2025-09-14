"use client";

import React, { useState } from "react";
import { ProtectedRoute } from "@/components/auth/protected-route";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ShoppingBag, Search, Edit, Loader2 } from "lucide-react";
import { useItemTypes, useMyItemsSummary } from "@/hooks/use-queries";
import { UserRole, ItemStatus, ItemTypeSummary } from "@/types/api";
import { getGroupingBreakdown } from "@/lib/grouping-utils";
import { BulkUpdateItemsModal } from "./components/bulk-update-items-modal";
import { ItemTypeDetailsModal } from "../items/components/item-type-details-modal";

function MyItemsContent() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedItemType, setSelectedItemType] = useState<string>("");
  const [isBulkDialogOpen, setIsBulkDialogOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedItemTypeForDetails, setSelectedItemTypeForDetails] =
    useState<string>("");

  // Fetch item types using optimized hook
  const { data: itemTypesData } = useItemTypes();

  // Fetch my items summary (items assigned to current employee) using optimized hook
  const {
    data: myItemsSummary,
    isLoading: isLoadingSummary,
    error,
    refetch: refetchSummary,
  } = useMyItemsSummary();

  const itemTypes = itemTypesData?.data?.data || [];
  const summary: ItemTypeSummary[] = myItemsSummary?.summary || [];

  // Filter item types based on search term
  const filteredItemTypes = itemTypes.filter((itemType) =>
    itemType.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get summary for a specific item type
  const getItemTypeSummary = (itemTypeId: string): ItemTypeSummary => {
    return (
      summary.find((s) => s._id === itemTypeId) || {
        _id: itemTypeId,
        itemTypeName: "",
        totalCount: 0,
        statusCounts: [],
      }
    );
  };

  // Get count for specific status
  const getStatusCount = (itemTypeId: string, status: ItemStatus): number => {
    const typeSummary = getItemTypeSummary(itemTypeId);
    const statusCount = typeSummary.statusCounts.find(
      (s) => s.status === status
    );
    return statusCount?.count || 0;
  };

  // Get grouping breakdown for specific status using shared utility
  const getStatusGroupingBreakdown = (itemTypeId: string, status: ItemStatus): string => {
    const itemType = itemTypes.find(type => type._id === itemTypeId);
    const count = getStatusCount(itemTypeId, status);
    return getGroupingBreakdown(count, itemType?.grouping || []);
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
          <h1 className="text-2xl font-bold text-gray-900">My Items</h1>
          <p className="text-gray-600">
            Manage items assigned to you with bulk operations
          </p>
        </div>
        <Button onClick={() => setIsBulkDialogOpen(true)} className="w-fit">
          <Edit className="h-4 w-4 mr-2" />
          Create Bill
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

      <ItemTypeDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        itemType={
          itemTypes.find((type) => type._id === selectedItemTypeForDetails) ||
          null
        }
        summary={getItemTypeSummary(selectedItemTypeForDetails)}
        isLoading={isLoadingSummary}
      />

      {/* Error State */}
      {error && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-red-600">
              <p>{error?.message || "An error occurred"}</p>
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
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">My Item Types</h2>
          <p className="text-sm text-gray-500">
            Click on any row to view detailed breakdown
          </p>
        </div>
        <p className="text-sm text-muted-foreground">
          Items assigned to you grouped by type
        </p>

        {isLoadingSummary ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div className="rounded-md border bg-white">
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
                  const inCareBreakdown = getStatusGroupingBreakdown(itemType._id, ItemStatus.WITH_EMPLOYEE);
                  const soldBreakdown = getStatusGroupingBreakdown(itemType._id, ItemStatus.SOLD);
                  const inventoryBreakdown = getStatusGroupingBreakdown(itemType._id, ItemStatus.IN_INVENTORY);

                  // Show all item types that exist in the agency, even if employee has 0 items
                  return (
                    <TableRow
                      key={itemType._id}
                      className="cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => handleOpenDetails(itemType._id)}
                    >
                      <TableCell className="font-medium">
                        {itemType.name}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-yellow-700 bg-yellow-50 rounded px-2 py-1 inline-block">
                          {inCareBreakdown}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-green-700 bg-green-50 rounded px-2 py-1 inline-block">
                          {soldBreakdown}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-blue-700 bg-blue-50 rounded px-2 py-1 inline-block">
                          {inventoryBreakdown}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm font-medium">
                          {getGroupingBreakdown(typeSummary.totalCount, itemType.grouping || [])}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            {filteredItemTypes.length === 0 && (
              <div className="text-center py-10">
                <ShoppingBag className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  No item types found
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {searchTerm
                    ? "Try adjusting your search."
                    : "No item types exist in your agency yet."}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
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
