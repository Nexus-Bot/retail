'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { ItemStatus, BulkUpdateItemsRequest, ItemType, Customer } from '@/types/api';
import { useBulkUpdateItemsMutation, useCustomers, useMyItemsSummary } from '@/hooks/use-queries';
import { toast } from 'sonner';

interface BulkUpdateItemsModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemTypes: ItemType[];
  selectedItemType: string;
  onItemTypeSelect: (itemTypeId: string) => void;
}

interface BillingItem {
  itemTypeId: string;
  itemTypeName: string;
  useGrouping: boolean;
  quantity: string;
  groupQuantity: string;
  groupName: string;
  totalPrice: string; // Total price for this line item
  availableGroupings: any[];
  maxAvailable: number; // Maximum available items for current status
}

interface BulkForm {
  currentStatus: ItemStatus;
  newStatus: ItemStatus;
  saleTo: string; // Customer ID for sales
  notes: string;
  billingItems: BillingItem[];
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
    saleTo: '',
    notes: '',
    billingItems: []
  });

  // Fetch customers for sales
  const { data: customersData } = useCustomers();
  const customers = customersData?.data.data || [];

  // Fetch my items summary to get available quantities
  const { data: myItemsSummary } = useMyItemsSummary();
  const summary = myItemsSummary?.summary || [];

  // Get available count for a specific item type and status
  const getAvailableCount = (itemTypeId: string, status: ItemStatus): number => {
    const typeSummary = summary.find((s) => s._id === itemTypeId);
    if (!typeSummary) return 0;
    const statusCount = typeSummary.statusCounts.find((sc) => sc.status === status);
    return statusCount?.count || 0;
  };

  // Add new billing item
  const addBillingItem = () => {
    if (!selectedItemType) {
      toast.error('Please select an item type first');
      return;
    }

    const selectedItemTypeData = itemTypes.find(type => type._id === selectedItemType);
    if (!selectedItemTypeData) return;

    // Check if item type already exists
    if (bulkForm.billingItems.some(item => item.itemTypeId === selectedItemType)) {
      toast.error('This item type is already added to the bill');
      return;
    }

    // Check if employee has items available for the current status
    const availableCount = getAvailableCount(selectedItemType, bulkForm.currentStatus);
    if (availableCount === 0) {
      toast.error(`You don't have any ${selectedItemTypeData.name} items in ${bulkForm.currentStatus === ItemStatus.WITH_EMPLOYEE ? 'your care' : 'sold status'}`);
      return;
    }

    const newItem: BillingItem = {
      itemTypeId: selectedItemType,
      itemTypeName: selectedItemTypeData.name,
      useGrouping: false,
      quantity: '1',
      groupQuantity: '1',
      groupName: '',
      totalPrice: '',
      availableGroupings: selectedItemTypeData.grouping || [],
      maxAvailable: availableCount
    };

    setBulkForm({
      ...bulkForm,
      billingItems: [...bulkForm.billingItems, newItem]
    });

    // Clear item type selection
    onItemTypeSelect('');
  };

  // Remove billing item
  const removeBillingItem = (index: number) => {
    const updatedItems = bulkForm.billingItems.filter((_, i) => i !== index);
    setBulkForm({ ...bulkForm, billingItems: updatedItems });
  };

  // Update billing item
  const updateBillingItem = (index: number, updates: Partial<BillingItem>) => {
    const updatedItems = bulkForm.billingItems.map((item, i) => 
      i === index ? { ...item, ...updates } : item
    );
    setBulkForm({ ...bulkForm, billingItems: updatedItems });
  };

  // Calculate grand total
  const calculateGrandTotal = (): number => {
    return bulkForm.billingItems.reduce((total, item) => {
      const price = parseFloat(item.totalPrice) || 0;
      return total + price;
    }, 0);
  };

  // Bulk update mutation using optimized hook
  const bulkUpdateMutation = useBulkUpdateItemsMutation();

  const handleBulkUpdate = async () => {
    // Validate billing items
    if (bulkForm.billingItems.length === 0) {
      toast.error('Please add at least one item to the bill');
      return;
    }

    // Validate quantities don't exceed available limits
    for (let i = 0; i < bulkForm.billingItems.length; i++) {
      const item = bulkForm.billingItems[i];
      let requestedQuantity: number;

      if (item.useGrouping && item.groupName) {
        const selectedGrouping = item.availableGroupings.find(g => g.groupName === item.groupName);
        const unitsPerGroup = selectedGrouping?.unitsPerGroup || 1;
        requestedQuantity = parseInt(item.groupQuantity) * unitsPerGroup;
      } else {
        requestedQuantity = parseInt(item.quantity) || 1;
      }

      if (requestedQuantity > item.maxAvailable) {
        toast.error(`${item.itemTypeName}: Requested ${requestedQuantity} items but only ${item.maxAvailable} available`);
        return;
      }
    }

    // Validate required fields for specific transitions
    if (bulkForm.currentStatus === ItemStatus.WITH_EMPLOYEE && bulkForm.newStatus === ItemStatus.SOLD) {
      // Sale transaction requires customer
      if (!bulkForm.saleTo) {
        toast.error('Please select a customer for the sale');
        return;
      }
      
      // Validate each billing item has total price
      for (let i = 0; i < bulkForm.billingItems.length; i++) {
        const item = bulkForm.billingItems[i];
        if (!item.totalPrice || parseFloat(item.totalPrice) <= 0) {
          toast.error(`Please enter a valid total price for ${item.itemTypeName}`);
          return;
        }
      }
    }

    if (bulkForm.currentStatus === ItemStatus.SOLD && bulkForm.newStatus === ItemStatus.WITH_EMPLOYEE) {
      // Return processing requires customer validation
      if (!bulkForm.saleTo) {
        toast.error('Please select the customer who is returning the items');
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

    // Process each billing item as a separate update request
    let totalItemsUpdated = 0;
    const errors: string[] = [];

    for (const billingItem of bulkForm.billingItems) {
      const updateData: BulkUpdateItemsRequest = {
        itemTypeId: billingItem.itemTypeId,
        currentStatus: bulkForm.currentStatus,
        status: bulkForm.newStatus,
      };

      // Add quantity or grouping
      if (billingItem.useGrouping && billingItem.groupName) {
        updateData.groupName = billingItem.groupName;
        updateData.groupQuantity = parseInt(billingItem.groupQuantity) || 1;
      } else {
        updateData.quantity = parseInt(billingItem.quantity) || 1;
      }

      // Add required fields based on transition
      if (bulkForm.currentStatus === ItemStatus.WITH_EMPLOYEE && bulkForm.newStatus === ItemStatus.SOLD) {
        // Sale transaction - calculate unit price from total
        updateData.saleTo = bulkForm.saleTo;
        const totalQuantity = billingItem.useGrouping && billingItem.groupName 
          ? parseInt(billingItem.groupQuantity) * (billingItem.availableGroupings.find(g => g.groupName === billingItem.groupName)?.unitsPerGroup || 1)
          : parseInt(billingItem.quantity) || 1;
        updateData.sellPrice = parseFloat(billingItem.totalPrice) / totalQuantity;
      } else if (bulkForm.currentStatus === ItemStatus.SOLD && bulkForm.newStatus === ItemStatus.WITH_EMPLOYEE) {
        // Return processing
        updateData.saleTo = bulkForm.saleTo;
        updateData.currentHolder = user?._id;
      } else if (bulkForm.currentStatus === ItemStatus.IN_INVENTORY && bulkForm.newStatus === ItemStatus.WITH_EMPLOYEE) {
        // Assigning to employee from inventory
        updateData.currentHolder = user?._id;
      }

      if (bulkForm.notes) {
        updateData.notes = bulkForm.notes;
      }

      try {
        const response = await new Promise<any>((resolve, reject) => {
          bulkUpdateMutation.mutate(updateData, {
            onSuccess: resolve,
            onError: reject
          });
        });
        totalItemsUpdated += response.data.data?.itemsUpdated || 0;
      } catch (error: any) {
        const errorMessage = error?.response?.data?.message || `Failed to update ${billingItem.itemTypeName}`;
        errors.push(errorMessage);
      }
    }

    // Show results
    if (errors.length === 0) {
      onClose();
      resetForm();
      toast.success(`${totalItemsUpdated} items updated successfully across ${bulkForm.billingItems.length} item types`);
    } else if (errors.length < bulkForm.billingItems.length) {
      toast.success(`Partially completed: ${totalItemsUpdated} items updated. Some errors occurred: ${errors.join(', ')}`);
    } else {
      toast.error(`All operations failed: ${errors.join(', ')}`);
    }
  };

  const resetForm = () => {
    setBulkForm({
      currentStatus: ItemStatus.WITH_EMPLOYEE,
      newStatus: ItemStatus.SOLD,
      saleTo: '',
      notes: '',
      billingItems: []
    });
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-full max-w-[95vw] sm:max-w-2xl mx-auto max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {bulkForm.currentStatus === ItemStatus.WITH_EMPLOYEE && bulkForm.newStatus === ItemStatus.SOLD
              ? 'Point of Sale - Create Bill'
              : bulkForm.currentStatus === ItemStatus.SOLD && bulkForm.newStatus === ItemStatus.WITH_EMPLOYEE
              ? 'Process Returns'
              : 'Update Items Status'}
          </DialogTitle>
          <DialogDescription>
            {bulkForm.currentStatus === ItemStatus.WITH_EMPLOYEE && bulkForm.newStatus === ItemStatus.SOLD
              ? 'Add multiple items to create a complete bill for your customer'
              : bulkForm.currentStatus === ItemStatus.SOLD && bulkForm.newStatus === ItemStatus.WITH_EMPLOYEE
              ? 'Process returns for items sold to customers'
              : 'Change status of items assigned to you'}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Transaction Type */}
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
                    newStatus: newCurrentStatus === ItemStatus.WITH_EMPLOYEE ? ItemStatus.SOLD : ItemStatus.WITH_EMPLOYEE,
                    billingItems: [],
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
                onValueChange={(value) => setBulkForm({...bulkForm, newStatus: value as ItemStatus, billingItems: [], saleTo: ''})}
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

          {/* Customer Selection */}
          {((bulkForm.currentStatus === ItemStatus.WITH_EMPLOYEE && bulkForm.newStatus === ItemStatus.SOLD) ||
            (bulkForm.currentStatus === ItemStatus.SOLD && bulkForm.newStatus === ItemStatus.WITH_EMPLOYEE)) && (
            <div className="space-y-2">
              <Label htmlFor="customer">
                {bulkForm.newStatus === ItemStatus.SOLD ? 'Customer *' : 'Customer Returning Items *'}
              </Label>
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
              {bulkForm.newStatus === ItemStatus.WITH_EMPLOYEE && (
                <p className="text-sm text-blue-600">
                  Only items originally sold to this customer can be returned.
                </p>
              )}
            </div>
          )}

          {/* Add Item Section */}
          <div className="border rounded-lg p-4 bg-gray-50">
            <Label className="font-medium mb-3 block">Add Item to Bill</Label>
            <div className="space-y-3">
              <div>
                <Select value={selectedItemType} onValueChange={onItemTypeSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select item type to add" />
                  </SelectTrigger>
                  <SelectContent>
                    {itemTypes
                      .filter((type) => {
                        // Only show item types that the employee has items for in the current status
                        const availableCount = getAvailableCount(type._id, bulkForm.currentStatus);
                        return availableCount > 0;
                      })
                      .map((type) => {
                        const availableCount = getAvailableCount(type._id, bulkForm.currentStatus);
                        return (
                          <SelectItem key={type._id} value={type._id}>
                            {type.name} ({availableCount} available)
                          </SelectItem>
                        );
                      })}
                  </SelectContent>
                </Select>
                {itemTypes.filter(type => getAvailableCount(type._id, bulkForm.currentStatus) > 0).length === 0 && (
                  <p className="text-sm text-gray-500 mt-2">
                    No items available for {bulkForm.currentStatus === ItemStatus.WITH_EMPLOYEE ? 'selling' : 'returns'}
                  </p>
                )}
              </div>
              <Button onClick={addBillingItem} className="w-full" size="lg">
                <Plus className="h-4 w-4 mr-2" />
                Add to {bulkForm.newStatus === ItemStatus.SOLD ? 'Bill' : 'Returns'}
              </Button>
            </div>
          </div>

          {/* Billing Items Cards */}
          {bulkForm.billingItems.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-medium text-lg">
                {bulkForm.newStatus === ItemStatus.SOLD ? 'Bill Items' : 'Return Items'}
              </h3>
              
              {bulkForm.billingItems.map((item, index) => (
                <div key={index} className="border rounded-lg p-4 bg-white shadow-sm">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-medium text-base">{item.itemTypeName}</h4>
                      <p className="text-sm text-green-600 font-medium">
                        Available: {item.maxAvailable} items
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeBillingItem(index)}
                      className="ml-2"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="space-y-4">
                    {/* Quantity Selection */}
                    <div className="space-y-3">
                      <Label className="font-medium">Quantity</Label>
                      
                      <div className="space-y-3">
                        <div className="flex items-center space-x-3">
                          <input
                            type="radio"
                            id={`qty-${index}`}
                            name={`selection-${index}`}
                            checked={!item.useGrouping}
                            onChange={() => updateBillingItem(index, { useGrouping: false })}
                            className="h-4 w-4"
                          />
                          <Label htmlFor={`qty-${index}`} className="text-sm font-normal">By Quantity</Label>
                          {!item.useGrouping && (
                            <Input
                              type="number"
                              min="1"
                              placeholder="Qty"
                              value={item.quantity}
                              onChange={(e) => updateBillingItem(index, { quantity: e.target.value })}
                              className="w-20 ml-2"
                            />
                          )}
                        </div>
                        
                        {item.availableGroupings.length > 0 && (
                          <div className="space-y-2">
                            <div className="flex items-center space-x-3">
                              <input
                                type="radio"
                                id={`grp-${index}`}
                                name={`selection-${index}`}
                                checked={item.useGrouping}
                                onChange={() => updateBillingItem(index, { useGrouping: true })}
                                className="h-4 w-4"
                              />
                              <Label htmlFor={`grp-${index}`} className="text-sm font-normal">By Grouping</Label>
                            </div>
                            
                            {item.useGrouping && (
                              <div className="ml-7 space-y-3">
                                <div>
                                  <Label className="text-sm">Grouping Type</Label>
                                  <Select 
                                    value={item.groupName} 
                                    onValueChange={(value) => updateBillingItem(index, { groupName: value })}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select grouping" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {item.availableGroupings.map((group) => (
                                        <SelectItem key={group.groupName} value={group.groupName}>
                                          {group.groupName} ({group.unitsPerGroup} units)
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div>
                                  <Label className="text-sm">Number of Groups</Label>
                                  <Input
                                    type="number"
                                    min="1"
                                    placeholder="Groups"
                                    value={item.groupQuantity}
                                    onChange={(e) => updateBillingItem(index, { groupQuantity: e.target.value })}
                                    className="w-full"
                                  />
                                  {item.groupName && (
                                    <p className="text-xs text-gray-500 mt-1">
                                      Max groups available: {Math.floor(item.maxAvailable / (item.availableGroupings.find(g => g.groupName === item.groupName)?.unitsPerGroup || 1))}
                                    </p>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Total Price for Sales */}
                    {bulkForm.newStatus === ItemStatus.SOLD && (
                      <div>
                        <Label className="font-medium">Total Price</Label>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="text-lg">₹</span>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            value={item.totalPrice}
                            onChange={(e) => updateBillingItem(index, { totalPrice: e.target.value })}
                            className="flex-1 text-lg font-medium"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {/* Grand Total */}
              {bulkForm.newStatus === ItemStatus.SOLD && bulkForm.billingItems.length > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-medium text-green-800">Grand Total:</span>
                    <span className="text-2xl font-bold text-green-900">₹{calculateGrandTotal().toLocaleString()}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Input
              id="notes"
              placeholder="Add any notes about this transaction..."
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
            disabled={bulkUpdateMutation.isPending || bulkForm.billingItems.length === 0}
          >
            {bulkUpdateMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {bulkForm.newStatus === ItemStatus.SOLD ? 'Complete Sale' : 'Process Returns'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}