'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { UserRole, ItemStatus, BulkUpdateItemsRequest, ItemType } from '@/types/api';
import { itemsAPI, usersAPI } from '@/lib/api';
import { useAuth } from '@/contexts/auth-context';
import { toast } from 'sonner';

interface BulkOperationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemTypes: ItemType[];
  selectedItemType: string;
  onItemTypeChange: (itemTypeId: string) => void;
}

export function BulkOperationsModal({ 
  isOpen, 
  onClose, 
  itemTypes, 
  selectedItemType, 
  onItemTypeChange 
}: BulkOperationsModalProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [bulkForm, setBulkForm] = useState({
    currentStatus: ItemStatus.IN_INVENTORY,
    newStatus: ItemStatus.WITH_EMPLOYEE,
    useGrouping: false,
    quantity: 1,
    groupQuantity: 1,
    groupName: '',
    currentHolder: '',
    sellPrice: '',
    notes: ''
  });

  // Fetch employees for assignment
  const { data: employeesData } = useQuery({
    queryKey: ['employees', user?.agency?._id],
    queryFn: () => usersAPI.getUsers({ role: UserRole.EMPLOYEE }),
    enabled: !!user?.agency?._id && bulkForm.newStatus === ItemStatus.WITH_EMPLOYEE && isOpen,
  });

  const employees = employeesData?.data?.data || [];
  
  // Get selected item type details
  const selectedItemTypeData = itemTypes.find(type => type._id === selectedItemType);
  const availableGroupings = selectedItemTypeData?.grouping || [];

  // Bulk update mutation
  const bulkUpdateMutation = useMutation({
    mutationFn: (data: BulkUpdateItemsRequest) => itemsAPI.bulkUpdateItems(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['itemsSummary'] });
      handleClose();
      const itemsUpdated = (response.data.data as { itemsUpdated: number })?.itemsUpdated || 0;
      toast.success(`${itemsUpdated} items updated successfully`);
    },
    onError: (error: unknown) => {
      const errorMessage = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to update items';
      toast.error(errorMessage);
    },
  });

  const handleBulkUpdate = () => {
    if (!selectedItemType) {
      toast.error('Please select an item type');
      return;
    }

    const updateData: BulkUpdateItemsRequest = {
      itemTypeId: selectedItemType,
      currentStatus: bulkForm.currentStatus,
      status: bulkForm.newStatus,
    };

    // Add quantity or grouping
    if (bulkForm.useGrouping && bulkForm.groupName) {
      updateData.groupName = bulkForm.groupName;
      updateData.groupQuantity = bulkForm.groupQuantity;
    } else {
      updateData.quantity = bulkForm.quantity;
    }

    // Add conditional fields based on new status
    if (bulkForm.newStatus === ItemStatus.WITH_EMPLOYEE && bulkForm.currentHolder) {
      updateData.currentHolder = bulkForm.currentHolder;
    }
    
    if (bulkForm.newStatus === ItemStatus.SOLD && bulkForm.sellPrice) {
      updateData.sellPrice = parseFloat(bulkForm.sellPrice);
    }

    if (bulkForm.notes) {
      updateData.notes = bulkForm.notes;
    }

    bulkUpdateMutation.mutate(updateData);
  };

  const handleClose = () => {
    setBulkForm({
      currentStatus: ItemStatus.IN_INVENTORY,
      newStatus: ItemStatus.WITH_EMPLOYEE,
      useGrouping: false,
      quantity: 1,
      groupQuantity: 1,
      groupName: '',
      currentHolder: '',
      sellPrice: '',
      notes: ''
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bulk Update Items</DialogTitle>
          <DialogDescription>
            Update multiple items of the same type
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Item Type Selection */}
          <div>
            <Label htmlFor="itemType">Item Type</Label>
            <Select value={selectedItemType} onValueChange={onItemTypeChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select item type" />
              </SelectTrigger>
              <SelectContent>
                {itemTypes.map(type => (
                  <SelectItem key={type._id} value={type._id}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Status Flow */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="currentStatus">Current Status</Label>
              <Select value={bulkForm.currentStatus} onValueChange={(value: ItemStatus) => setBulkForm({...bulkForm, currentStatus: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ItemStatus.IN_INVENTORY}>In Inventory</SelectItem>
                  <SelectItem value={ItemStatus.WITH_EMPLOYEE}>With Employee</SelectItem>
                  <SelectItem value={ItemStatus.SOLD}>Sold</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="newStatus">New Status</Label>
              <Select value={bulkForm.newStatus} onValueChange={(value: ItemStatus) => setBulkForm({...bulkForm, newStatus: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ItemStatus.IN_INVENTORY}>In Inventory</SelectItem>
                  <SelectItem value={ItemStatus.WITH_EMPLOYEE}>With Employee</SelectItem>
                  <SelectItem value={ItemStatus.SOLD}>Sold</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Quantity Selection */}
          <div>
            <div className="flex items-center space-x-2 mb-3">
              <input
                type="radio"
                id="useQuantity"
                name="quantityType"
                checked={!bulkForm.useGrouping}
                onChange={() => setBulkForm({...bulkForm, useGrouping: false})}
              />
              <Label htmlFor="useQuantity">Update by Quantity</Label>
            </div>
            {!bulkForm.useGrouping && (
              <Input
                type="number"
                min="1"
                value={bulkForm.quantity}
                onChange={(e) => setBulkForm({...bulkForm, quantity: parseInt(e.target.value) || 1})}
                placeholder="Enter quantity"
              />
            )}
          </div>

          {/* Grouping Selection */}
          {availableGroupings.length > 0 && (
            <div>
              <div className="flex items-center space-x-2 mb-3">
                <input
                  type="radio"
                  id="useGrouping"
                  name="quantityType"
                  checked={bulkForm.useGrouping}
                  onChange={() => setBulkForm({...bulkForm, useGrouping: true})}
                />
                <Label htmlFor="useGrouping">Update by Grouping</Label>
              </div>
              {bulkForm.useGrouping && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="groupName">Group Type</Label>
                    <Select value={bulkForm.groupName} onValueChange={(value) => setBulkForm({...bulkForm, groupName: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select group" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableGroupings.map(group => (
                          <SelectItem key={group.groupName} value={group.groupName}>
                            {group.groupName} ({group.unitsPerGroup} units each)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="groupQuantity">Number of Groups</Label>
                    <Input
                      type="number"
                      min="1"
                      value={bulkForm.groupQuantity}
                      onChange={(e) => setBulkForm({...bulkForm, groupQuantity: parseInt(e.target.value) || 1})}
                      placeholder="Enter number"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Conditional Fields */}
          {bulkForm.newStatus === ItemStatus.WITH_EMPLOYEE && (
            <div>
              <Label htmlFor="employee">Assign to Employee</Label>
              <Select value={bulkForm.currentHolder} onValueChange={(value) => setBulkForm({...bulkForm, currentHolder: value})}>
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
          )}

          {bulkForm.newStatus === ItemStatus.SOLD && (
            <div>
              <Label htmlFor="sellPrice">Sell Price per Unit</Label>
              <Input
                type="number"
                step="0.01"
                value={bulkForm.sellPrice}
                onChange={(e) => setBulkForm({...bulkForm, sellPrice: e.target.value})}
                placeholder="Enter price per unit"
              />
            </div>
          )}

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Input
              id="notes"
              value={bulkForm.notes}
              onChange={(e) => setBulkForm({...bulkForm, notes: e.target.value})}
              placeholder="Add notes about this operation"
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
          >
            Cancel
          </Button>
          <Button
            onClick={handleBulkUpdate}
            disabled={bulkUpdateMutation.isPending || !selectedItemType}
          >
            {bulkUpdateMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Updating...
              </>
            ) : (
              'Update Items'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}