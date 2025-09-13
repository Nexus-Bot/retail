'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Package, Loader2 } from 'lucide-react';
import { CreateItemsRequest } from '@/types/api';
import { useItemTypes, useCreateItemsMutation } from '@/hooks/use-queries';
import { toast } from 'sonner';
import { QuantitySelector, calculateTotalQuantity, QuantitySubItem } from '@/components/quantity-selector';

interface AddItemsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddItemsModal({ isOpen, onClose }: AddItemsModalProps) {
  const [formData, setFormData] = useState({
    itemTypeId: '',
  });
  const [subItems, setSubItems] = useState<QuantitySubItem[]>([]);

  // Fetch item types from the backend using optimized hook
  const { data: itemTypesData, isLoading: itemTypesLoading } = useItemTypes({
    limit: 100
  });

  const itemTypes = itemTypesData?.data?.data || [];
  const selectedItemType = itemTypes.find(type => type._id === formData.itemTypeId);

  // Use optimized mutation hook
  const createItemsMutation = useCreateItemsMutation();

  // Override the mutation to add success/error handling
  const handleCreateItems = (data: CreateItemsRequest) => {
    createItemsMutation.mutate(data, {
      onSuccess: () => {
        toast.success('Items added successfully');
        handleClose();
      },
      onError: (error: unknown) => {
        const errorMessage = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to add items';
        toast.error(errorMessage);
      },
    });
  };

  // Get selected item type details
  const availableGroupings = selectedItemType?.grouping || [];

  const handleItemTypeChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      itemTypeId: value
    }));
    // Reset sub-items when item type changes
    setSubItems([]);
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

  const handleSubmit = () => {
    
    if (!formData.itemTypeId.trim()) {
      toast.error('Item type is required');
      return;
    }

    if (subItems.length === 0) {
      toast.error('Please add at least one quantity item');
      return;
    }

    // For now, we'll handle multiple sub-items by processing them one by one
    // since the backend CreateItemsRequest expects single item data
    // TODO: Backend could be enhanced to handle multiple sub-items in single request
    if (subItems.length === 1) {
      const subItem = subItems[0];
      const submitData: CreateItemsRequest = {
        itemTypeId: formData.itemTypeId,
      };
      
      if (subItem.quantityType === "group" && subItem.groupName) {
        submitData.groupName = subItem.groupName;
        submitData.groupQuantity = parseInt(subItem.groupQuantity) || 1;
      } else {
        submitData.quantity = parseInt(subItem.quantity) || 1;
      }
      
      handleCreateItems(submitData);
    } else {
      // For multiple sub-items, calculate total quantity for now
      const submitData: CreateItemsRequest = {
        itemTypeId: formData.itemTypeId,
        quantity: calculateTotalItems(),
      };
      
      handleCreateItems(submitData);
    }
  };

  const handleClose = () => {
    setFormData({
      itemTypeId: '',
    });
    setSubItems([]);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-full max-w-[90vw] sm:max-w-2xl mx-auto max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Package className="mr-2 h-5 w-5" />
            Add New Items
          </DialogTitle>
          <DialogDescription>
            Add items to your inventory
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Item Type */}
          <div className="space-y-2">
            <Label htmlFor="itemTypeId">Item Type *</Label>
            <Select value={formData.itemTypeId} onValueChange={handleItemTypeChange} disabled={createItemsMutation.isPending || itemTypesLoading}>
              <SelectTrigger>
                <SelectValue placeholder={itemTypesLoading ? "Loading item types..." : "Select item type"} />
              </SelectTrigger>
              <SelectContent>
                {itemTypes.map((type) => (
                  <SelectItem key={type._id} value={type._id}>
                    {type.name}
                  </SelectItem>
                ))}
                {itemTypes.length === 0 && !itemTypesLoading && (
                  <SelectItem value="" disabled>
                    No item types available
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
            {!itemTypesLoading && itemTypes.length === 0 && (
              <p className="text-sm text-yellow-600">
                No item types found. Create one first from the dashboard.
              </p>
            )}
          </div>

          {/* Quantity Selection with Sub-Items */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Quantity</h3>
            
            <QuantitySelector
              subItems={subItems}
              availableGroupings={availableGroupings}
              onAddSubItem={addSubItem}
              onRemoveSubItem={removeSubItem}
              onUpdateSubItem={updateSubItem}
              className="space-y-4"
            />

            {/* Total Calculation */}
            {subItems.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="text-sm font-medium text-blue-900">
                  Total items to be created: <span className="text-lg">{calculateTotalItems()}</span>
                </div>
              </div>
            )}
          </div>

          
          <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-0">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClose}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={createItemsMutation.isPending || !formData.itemTypeId || subItems.length === 0}
              className="w-full sm:w-auto"
            >
              {createItemsMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                `Add ${calculateTotalItems()} Items`
              )}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}