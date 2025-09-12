'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { ItemStatus, BulkUpdateItemsRequest, ItemType, Customer } from '@/types/api';
import { useBulkUpdateItemsMutation, useCustomers } from '@/hooks/use-queries';
import { toast } from 'sonner';

interface BulkUpdateItemsModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemTypes: ItemType[];
  selectedItemType: string;
  onItemTypeSelect: (itemTypeId: string) => void;
}

interface BulkForm {
  currentStatus: ItemStatus;
  newStatus: ItemStatus;
  useGrouping: boolean;
  quantity: string;
  groupQuantity: string;
  groupName: string;
  sellPrice: string;
  saleTo: string; // Customer ID for sales
  notes: string;
}

export function BulkUpdateItemsModal({ 
  isOpen, 
  onClose, 
  itemTypes, 
  selectedItemType, 
  onItemTypeSelect 
}: BulkUpdateItemsModalProps) {
  const { user } = useAuth();
  
  const [bulkForm, setBulkForm] = useState<BulkForm>({
    currentStatus: ItemStatus.WITH_EMPLOYEE,
    newStatus: ItemStatus.SOLD,
    useGrouping: false,
    quantity: '1',
    groupQuantity: '1',
    groupName: '',
    sellPrice: '',
    saleTo: '',
    notes: ''
  });

  // Fetch customers for sales
  const { data: customersData } = useCustomers();
  const customers = customersData?.data.data || [];

  // Get selected item type details
  const selectedItemTypeData = itemTypes.find(type => type._id === selectedItemType);
  const availableGroupings = selectedItemTypeData?.grouping || [];

  // Bulk update mutation using optimized hook
  const bulkUpdateMutation = useBulkUpdateItemsMutation();

  const handleBulkUpdate = () => {
    if (!selectedItemType) {
      toast.error('Please select an item type');
      return;
    }

    // Validate required fields for specific transitions
    if (bulkForm.currentStatus === ItemStatus.WITH_EMPLOYEE && bulkForm.newStatus === ItemStatus.SOLD) {
      // Sale transaction requires customer and sell price
      if (!bulkForm.saleTo) {
        toast.error('Please select a customer for the sale');
        return;
      }
      if (!bulkForm.sellPrice || parseFloat(bulkForm.sellPrice) <= 0) {
        toast.error('Please enter a valid sell price');
        return;
      }
    }

    if (
      (bulkForm.currentStatus === ItemStatus.IN_INVENTORY && bulkForm.newStatus === ItemStatus.WITH_EMPLOYEE) ||
      (bulkForm.currentStatus === ItemStatus.SOLD && bulkForm.newStatus === ItemStatus.WITH_EMPLOYEE)
    ) {
      // Assigning to employee requires currentHolder
      if (!user?._id) {
        toast.error('User ID not found');
        return;
      }
    }

    const updateData: BulkUpdateItemsRequest = {
      itemTypeId: selectedItemType,
      currentStatus: bulkForm.currentStatus,
      status: bulkForm.newStatus,
    };

    // Add quantity or grouping
    if (bulkForm.useGrouping && bulkForm.groupName) {
      updateData.groupName = bulkForm.groupName;
      updateData.groupQuantity = parseInt(bulkForm.groupQuantity) || 1;
    } else {
      updateData.quantity = parseInt(bulkForm.quantity) || 1;
    }

    // Add required fields based on transition
    if (bulkForm.currentStatus === ItemStatus.WITH_EMPLOYEE && bulkForm.newStatus === ItemStatus.SOLD) {
      // Sale transaction
      updateData.saleTo = bulkForm.saleTo;
      updateData.sellPrice = parseFloat(bulkForm.sellPrice);
    } else if (
      (bulkForm.currentStatus === ItemStatus.IN_INVENTORY && bulkForm.newStatus === ItemStatus.WITH_EMPLOYEE) ||
      (bulkForm.currentStatus === ItemStatus.SOLD && bulkForm.newStatus === ItemStatus.WITH_EMPLOYEE)
    ) {
      // Assigning to employee
      updateData.currentHolder = user?._id;
    }

    if (bulkForm.notes) {
      updateData.notes = bulkForm.notes;
    }

    bulkUpdateMutation.mutate(updateData, {
      onSuccess: (response) => {
        onClose();
        setBulkForm({
          currentStatus: ItemStatus.WITH_EMPLOYEE,
          newStatus: ItemStatus.SOLD,
          useGrouping: false,
          quantity: '1',
          groupQuantity: '1',
          groupName: '',
          sellPrice: '',
          saleTo: '',
          notes: ''
        });
        const itemsUpdated = response.data.data?.itemsUpdated || 0;
        toast.success(`${itemsUpdated} items updated successfully`);
      },
      onError: (error: unknown) => {
        const errorMessage = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to update items';
        toast.error(errorMessage);
      },
    });
  };

  const handleClose = () => {
    setBulkForm({
      currentStatus: ItemStatus.WITH_EMPLOYEE,
      newStatus: ItemStatus.SOLD,
      useGrouping: false,
      quantity: '1',
      groupQuantity: '1',
      groupName: '',
      sellPrice: '',
      saleTo: '',
      notes: ''
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-full max-w-[90vw] sm:max-w-lg mx-auto">
        <DialogHeader>
          <DialogTitle>Update Items Status</DialogTitle>
          <DialogDescription>
            Change status of items assigned to you
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="itemType">Item Type</Label>
            <Select value={selectedItemType} onValueChange={onItemTypeSelect}>
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Current Status</Label>
              <Select 
                value={bulkForm.currentStatus} 
                onValueChange={(value) => {
                  const newCurrentStatus = value as ItemStatus;
                  setBulkForm({
                    ...bulkForm, 
                    currentStatus: newCurrentStatus,
                    // Reset dependent fields when changing current status
                    newStatus: newCurrentStatus === ItemStatus.WITH_EMPLOYEE ? ItemStatus.SOLD : ItemStatus.WITH_EMPLOYEE,
                    sellPrice: '',
                    saleTo: ''
                  });
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ItemStatus.WITH_EMPLOYEE}>In My Care</SelectItem>
                  <SelectItem value={ItemStatus.SOLD}>Sold by Me</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Action</Label>
              <Select 
                value={bulkForm.newStatus} 
                onValueChange={(value) => setBulkForm({...bulkForm, newStatus: value as ItemStatus, sellPrice: '', saleTo: ''})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {bulkForm.currentStatus === ItemStatus.WITH_EMPLOYEE && (
                    <SelectItem value={ItemStatus.SOLD}>Sell Items</SelectItem>
                  )}
                  {bulkForm.currentStatus === ItemStatus.SOLD && (
                    <SelectItem value={ItemStatus.WITH_EMPLOYEE}>Process Returns</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Sale Transaction Fields */}
          {bulkForm.currentStatus === ItemStatus.WITH_EMPLOYEE && bulkForm.newStatus === ItemStatus.SOLD && (
            <div className="space-y-4 p-4 border rounded-lg bg-green-50">
              <h3 className="text-sm font-medium text-green-800">Sale Transaction</h3>
              
              <div className="space-y-2">
                <Label htmlFor="saleTo">Customer *</Label>
                <Select 
                  value={bulkForm.saleTo} 
                  onValueChange={(value) => setBulkForm({...bulkForm, saleTo: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((customer: Customer) => (
                      <SelectItem key={customer._id} value={customer._id}>
                        {customer.name} - {customer.mobile}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sellPrice">Sell Price *</Label>
                <Input
                  id="sellPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Enter sell price..."
                  value={bulkForm.sellPrice}
                  onChange={(e) => setBulkForm({...bulkForm, sellPrice: e.target.value})}
                />
              </div>
            </div>
          )}

          {/* Return Processing Info */}
          {bulkForm.currentStatus === ItemStatus.SOLD && bulkForm.newStatus === ItemStatus.WITH_EMPLOYEE && (
            <div className="p-4 border rounded-lg bg-blue-50">
              <h3 className="text-sm font-medium text-blue-800">Return Processing</h3>
              <p className="text-sm text-blue-600 mt-1">
                Items will be returned to your care for processing.
              </p>
            </div>
          )}

          {/* Quantity Selection */}
          <div className="space-y-3">
            <Label className="text-base">Select Items</Label>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="byQuantity"
                  name="selectionMode"
                  checked={!bulkForm.useGrouping}
                  onChange={() => setBulkForm({...bulkForm, useGrouping: false})}
                />
                <Label htmlFor="byQuantity">By Quantity</Label>
              </div>
              
              {!bulkForm.useGrouping && (
                <div className="ml-6 space-y-2">
                  <Label htmlFor="quantity">Number of Items</Label>
                  <Input
                    id="quantity"
                    type="text"
                    inputMode="numeric"
                    value={bulkForm.quantity}
                    onChange={(e) => setBulkForm({...bulkForm, quantity: e.target.value})}
                  />
                </div>
              )}
              
              {availableGroupings.length > 0 && (
                <>
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="byGrouping"
                      name="selectionMode"
                      checked={bulkForm.useGrouping}
                      onChange={() => setBulkForm({...bulkForm, useGrouping: true})}
                    />
                    <Label htmlFor="byGrouping">By Grouping</Label>
                  </div>
                  
                  {bulkForm.useGrouping && (
                    <div className="ml-6 space-y-3">
                      <div className="space-y-2">
                        <Label>Grouping Type</Label>
                        <Select 
                          value={bulkForm.groupName} 
                          onValueChange={(value) => setBulkForm({...bulkForm, groupName: value})}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select grouping" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableGroupings.map((group) => (
                              <SelectItem key={group.groupName} value={group.groupName}>
                                {group.groupName} ({group.unitsPerGroup} units)
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="groupQuantity">Number of Groups</Label>
                        <Input
                          id="groupQuantity"
                          type="text"
                          inputMode="numeric"
                          value={bulkForm.groupQuantity}
                          onChange={(e) => setBulkForm({...bulkForm, groupQuantity: e.target.value})}
                        />
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>


          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Input
              id="notes"
              placeholder="Add any notes..."
              value={bulkForm.notes}
              onChange={(e) => setBulkForm({...bulkForm, notes: e.target.value})}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleBulkUpdate}
            disabled={bulkUpdateMutation.isPending}
          >
            {bulkUpdateMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Update Items
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}