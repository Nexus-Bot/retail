"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Loader2,
  ArrowRight,
  Package,
  Users,
  CheckCircle,
} from "lucide-react";
import { QuantitySelector, calculateTotalQuantity, getTotalGroupingBreakdown, QuantitySubItem } from "@/components/quantity-selector";
import {
  UserRole,
  ItemStatus,
  BulkUpdateItemsRequest,
  ItemType,
  ItemTypeSummary,
} from "@/types/api";
import { useUsers, useBulkUpdateItemsMutation } from "@/hooks/use-queries";
import { getGroupingBreakdown } from "@/lib/grouping-utils";
import { toast } from "sonner";

interface BulkOperationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemTypes: ItemType[];
  selectedItemType: string;
  onItemTypeChange: (itemTypeId: string) => void;
  summary?: ItemTypeSummary[];
}

export function BulkOperationsModal({
  isOpen,
  onClose,
  itemTypes,
  selectedItemType,
  onItemTypeChange,
  summary = [],
}: BulkOperationsModalProps) {
  const [operationType, setOperationType] = useState<
    "assign" | "return_to_inventory" | ""
  >("");
  const [subItems, setSubItems] = useState<QuantitySubItem[]>([]);
  const [bulkForm, setBulkForm] = useState({
    currentHolder: "",
    notes: "",
  });

  // Helper function to reset form state
  const resetForm = () => {
    setOperationType("");
    setSubItems([]);
    setBulkForm({
      currentHolder: "",
      notes: "",
    });
  };

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [isOpen, selectedItemType]);

  // Fetch employees for assignment and return operations
  const { data: employeesData } = useUsers({
    role: UserRole.EMPLOYEE,
    enabled:
      (operationType === "assign" || operationType === "return_to_inventory") &&
      isOpen,
  });

  const employees = employeesData?.data?.data || [];

  // Get selected item type details
  const selectedItemTypeData = itemTypes.find(
    (type) => type._id === selectedItemType
  );
  const availableGroupings = selectedItemTypeData?.grouping || [];

  // Get item counts for selected item type
  const getItemTypeSummary = () => {
    return (
      summary.find((s) => s._id === selectedItemType) || {
        _id: selectedItemType,
        itemTypeName: selectedItemTypeData?.name || "",
        totalCount: 0,
        statusCounts: [],
      }
    );
  };

  const getStatusCount = (status: ItemStatus): number => {
    const typeSummary = getItemTypeSummary();
    const statusCount = typeSummary.statusCounts.find(
      (s) => s.status === status
    );
    return statusCount?.count || 0;
  };

  const getStatusGroupingBreakdown = (status: ItemStatus): string => {
    const count = getStatusCount(status);
    return getGroupingBreakdown(count, selectedItemTypeData?.grouping || []);
  };

  // Bulk update mutation using optimized hook
  const bulkUpdateMutation = useBulkUpdateItemsMutation();

  const handleBulkUpdate = () => {
    if (!selectedItemType || !operationType) {
      toast.error("Please select an item type and operation");
      return;
    }

    let updateData: BulkUpdateItemsRequest;

    // Build request based on operation type
    switch (operationType) {
      case "assign":
        if (!bulkForm.currentHolder) {
          toast.error("Please select an employee");
          return;
        }
        updateData = {
          itemTypeId: selectedItemType,
          currentStatus: ItemStatus.IN_INVENTORY,
          status: ItemStatus.WITH_EMPLOYEE,
          currentHolder: bulkForm.currentHolder,
        };
        break;

      case "return_to_inventory":
        if (!bulkForm.currentHolder) {
          toast.error("Please select which employee's items to return");
          return;
        }
        updateData = {
          itemTypeId: selectedItemType,
          currentStatus: ItemStatus.WITH_EMPLOYEE,
          status: ItemStatus.IN_INVENTORY,
          currentHolder: bulkForm.currentHolder,
        };
        break;

      default:
        toast.error("Invalid operation type");
        return;
    }

    // Handle multiple sub-items - for now, we'll process them one by one
    // TODO: Backend could be enhanced to handle multiple sub-items in single request
    if (subItems.length === 1) {
      const subItem = subItems[0];
      if (subItem.quantityType === "group" && subItem.groupName) {
        updateData.groupName = subItem.groupName;
        updateData.groupQuantity = parseInt(subItem.groupQuantity) || 1;
      } else {
        updateData.quantity = parseInt(subItem.quantity) || 1;
      }
    } else {
      // For multiple sub-items, calculate total quantity for now
      updateData.quantity = calculateTotalItems();
    }

    if (bulkForm.notes) {
      updateData.notes = bulkForm.notes;
    }

    bulkUpdateMutation.mutate(updateData, {
      onSuccess: (response) => {
        handleClose();
        const itemsUpdated =
          (response.data.data as { itemsUpdated: number })?.itemsUpdated || 0;
        toast.success(`${itemsUpdated} items updated successfully`);
      },
      onError: (error: unknown) => {
        const errorMessage =
          (error as { response?: { data?: { message?: string } } })?.response
            ?.data?.message || "Failed to update items";
        toast.error(errorMessage);
      },
    });
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  // Sub-item management functions
  const addSubItem = (type: "individual" | "group", groupName?: string) => {
    const newId = Date.now().toString();
    const newSubItem: QuantitySubItem = {
      id: newId,
      quantityType: type,
      quantity: "1",
      groupQuantity: "1",
      groupName: groupName || availableGroupings[0]?.groupName || "",
    };
    setSubItems([...subItems, newSubItem]);
  };

  const removeSubItem = (id: string) => {
    setSubItems(subItems.filter((item) => item.id !== id));
  };

  const updateSubItem = (id: string, updates: Partial<QuantitySubItem>) => {
    setSubItems(
      subItems.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  };

  const calculateTotalItems = () => {
    return calculateTotalQuantity(subItems, availableGroupings);
  };

  const getTotalItemsDisplay = () => {
    return getTotalGroupingBreakdown(subItems, availableGroupings);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-full max-w-[95vw] sm:max-w-2xl mx-auto max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bulk Operations</DialogTitle>
          <DialogDescription>
            Perform bulk operations on items - assign or return items
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Item Type Selection & Current Counts */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="itemType">Item Type</Label>
              <Select value={selectedItemType} onValueChange={onItemTypeChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select item type" />
                </SelectTrigger>
                <SelectContent>
                  {itemTypes.map((type) => (
                    <SelectItem key={type._id} value={type._id}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Current Status Summary */}
            {selectedItemType && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">
                    Current Inventory Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="space-y-1">
                      <Package className="h-5 w-5 mx-auto text-blue-500" />
                      <div className="font-bold text-blue-600">
                        {getStatusGroupingBreakdown(ItemStatus.IN_INVENTORY)}
                      </div>
                      <div className="text-xs text-gray-600">Available</div>
                    </div>
                    <div className="space-y-1">
                      <Users className="h-5 w-5 mx-auto text-yellow-500" />
                      <div className="font-bold text-yellow-600">
                        {getStatusGroupingBreakdown(ItemStatus.WITH_EMPLOYEE)}
                      </div>
                      <div className="text-xs text-gray-600">
                        With Employees
                      </div>
                    </div>
                    <div className="space-y-1">
                      <CheckCircle className="h-5 w-5 mx-auto text-green-500" />
                      <div className="font-bold text-green-600">
                        {getStatusGroupingBreakdown(ItemStatus.SOLD)}
                      </div>
                      <div className="text-xs text-gray-600">Sold</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Operation Type Selection */}
          <div className="space-y-4">
            <Label>Choose Operation</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Card
                className={`cursor-pointer transition-all ${
                  operationType === "assign"
                    ? "ring-2 ring-blue-500 bg-blue-50"
                    : "hover:bg-gray-50"
                }`}
                onClick={() => setOperationType("assign")}
              >
                <CardContent className="p-4 flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <div className="flex items-center text-blue-600">
                      <Package className="h-4 w-4 mr-1" />
                      <ArrowRight className="h-3 w-3 mx-1" />
                      <Users className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-sm">
                      Assign to Employee
                    </div>
                    <div className="text-xs text-gray-500">
                      Inventory → Employee
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card
                className={`cursor-pointer transition-all ${
                  operationType === "return_to_inventory"
                    ? "ring-2 ring-orange-500 bg-orange-50"
                    : "hover:bg-gray-50"
                }`}
                onClick={() => setOperationType("return_to_inventory")}
              >
                <CardContent className="p-4 flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <div className="flex items-center text-orange-600">
                      <Users className="h-4 w-4 mr-1" />
                      <ArrowRight className="h-3 w-3 mx-1" />
                      <Package className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-sm">
                      Return to Inventory
                    </div>
                    <div className="text-xs text-gray-500">
                      Employee → Inventory
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Operation-specific fields */}
          {operationType && (
            <>
              {/* Quantity Selection with Sub-Items */}
              <QuantitySelector
                subItems={subItems}
                availableGroupings={availableGroupings}
                onAddSubItem={addSubItem}
                onRemoveSubItem={removeSubItem}
                onUpdateSubItem={updateSubItem}
              />

              {/* Total Count Display */}
              {subItems.length > 0 && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-700">
                      Total Items to Process:
                    </span>
                    <Badge variant="outline" className="font-bold text-base">
                      {getTotalItemsDisplay()}
                    </Badge>
                  </div>
                </div>
              )}

              {/* Operation-specific form fields */}
              <div className="space-y-4">
                {/* Employee Selection - required for both operations */}
                <div className="space-y-2">
                    <Label htmlFor="employee">
                      {operationType === "assign"
                        ? "Assign to Employee"
                        : "Return from Employee"}
                    </Label>
                    <Select
                      value={bulkForm.currentHolder}
                      onValueChange={(value) =>
                        setBulkForm({ ...bulkForm, currentHolder: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select employee" />
                      </SelectTrigger>
                      <SelectContent>
                        {employees.map((emp) => (
                          <SelectItem key={emp._id} value={emp._id}>
                            {emp.username}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                {/* Notes */}
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Input
                    id="notes"
                    value={bulkForm.notes}
                    onChange={(e) =>
                      setBulkForm({ ...bulkForm, notes: e.target.value })
                    }
                    placeholder="Add notes about this operation"
                  />
                </div>
              </div>
            </>
          )}
        </div>

        <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={handleClose}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            onClick={handleBulkUpdate}
            disabled={
              bulkUpdateMutation.isPending ||
              !selectedItemType ||
              !operationType
            }
            className="w-full sm:w-auto"
          >
            {bulkUpdateMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              `Process ${getTotalItemsDisplay()}`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
