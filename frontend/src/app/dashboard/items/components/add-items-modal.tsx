'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Package, Loader2 } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CreateItemsRequest } from '@/types/api';
import { itemTypesAPI, itemsAPI } from '@/lib/api';
import { useAuth } from '@/contexts/auth-context';
import { toast } from 'sonner';

interface AddItemsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddItemsModal({ isOpen, onClose }: AddItemsModalProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    itemTypeId: '',
    quantity: 1,
    groupQuantity: '',
    groupName: '',
    purchasePrice: '',
    sellPrice: '',
  });

  // Fetch item types from the backend
  const { data: itemTypesData, isLoading: itemTypesLoading } = useQuery({
    queryKey: ['item-types', user?.agency?._id],
    queryFn: () => itemTypesAPI.getItemTypes({ limit: 100, isActive: true }),
    enabled: !!user?.agency?._id && isOpen,
    staleTime: 60000,
    gcTime: 5 * 60 * 1000,
    retry: 1,
  });

  const itemTypes = itemTypesData?.data?.data || [];
  const selectedItemType = itemTypes.find(type => type._id === formData.itemTypeId);

  const createItemsMutation = useMutation({
    mutationFn: (data: CreateItemsRequest) => itemsAPI.createItems(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['itemsSummary'] });
      toast.success('Items added successfully');
      handleClose();
    },
    onError: (error: unknown) => {
      const errorMessage = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to add items';
      toast.error(errorMessage);
    },
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleItemTypeChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      itemTypeId: value,
      groupName: '', // Reset group when item type changes
    }));
  };

  const handleGroupNameChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      groupName: value
    }));
  };

  const calculateTotalItems = () => {
    if (formData.groupQuantity && formData.groupName && selectedItemType?.grouping) {
      const grouping = selectedItemType.grouping.find(g => g.groupName === formData.groupName);
      if (grouping) {
        return parseInt(formData.groupQuantity) * grouping.unitsPerGroup;
      }
    }
    return formData.quantity;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.itemTypeId.trim()) {
      toast.error('Item type is required');
      return;
    }

    if (!formData.purchasePrice.trim()) {
      toast.error('Purchase price is required');
      return;
    }

    const submitData: CreateItemsRequest = {
      itemTypeId: formData.itemTypeId,
      quantity: formData.groupQuantity ? undefined : formData.quantity,
      groupQuantity: formData.groupQuantity ? parseInt(formData.groupQuantity) : undefined,
      groupName: formData.groupName || undefined,
      purchasePrice: parseFloat(formData.purchasePrice),
      sellPrice: formData.sellPrice ? parseFloat(formData.sellPrice) : undefined,
    };

    createItemsMutation.mutate(submitData);
  };

  const handleClose = () => {
    setFormData({
      itemTypeId: '',
      quantity: 1,
      groupQuantity: '',
      groupName: '',
      purchasePrice: '',
      sellPrice: '',
    });
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
        
        <form onSubmit={handleSubmit} className="space-y-6">
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

          {/* Quantity Options */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Quantity</h3>
            
            {/* Individual Quantity */}
            <div className="space-y-2">
              <Label htmlFor="quantity">Individual Items</Label>
              <Input
                id="quantity"
                name="quantity"
                type="number"
                min="1"
                placeholder="Number of individual items"
                value={formData.quantity}
                onChange={handleInputChange}
                disabled={createItemsMutation.isPending}
              />
            </div>

            {/* Group Quantity (if available) */}
            {selectedItemType && selectedItemType.grouping && selectedItemType.grouping.length > 0 && (
              <>
                <div className="text-center text-sm text-gray-500">OR</div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="groupName">Group Type</Label>
                    <Select value={formData.groupName} onValueChange={handleGroupNameChange} disabled={createItemsMutation.isPending}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select group type" />
                      </SelectTrigger>
                      <SelectContent>
                        {selectedItemType.grouping.map((group, index) => (
                          <SelectItem key={index} value={group.groupName}>
                            {group.groupName} ({group.unitsPerGroup} items)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="groupQuantity">Number of Groups</Label>
                    <Input
                      id="groupQuantity"
                      name="groupQuantity"
                      type="number"
                      min="1"
                      placeholder="Number of groups"
                      value={formData.groupQuantity}
                      onChange={handleInputChange}
                      disabled={createItemsMutation.isPending || !formData.groupName}
                    />
                  </div>
                </div>
              </>
            )}

            {/* Total Calculation */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="text-sm font-medium text-blue-900">
                Total items to be created: <span className="text-lg">{calculateTotalItems()}</span>
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="purchasePrice">Purchase Price (per item) *</Label>
              <Input
                id="purchasePrice"
                name="purchasePrice"
                type="number"
                min="0"
                step="0.01"
                placeholder="₹0.00"
                value={formData.purchasePrice}
                onChange={handleInputChange}
                required
                disabled={createItemsMutation.isPending}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="sellPrice">Sell Price (per item)</Label>
              <Input
                id="sellPrice"
                name="sellPrice"
                type="number"
                min="0"
                step="0.01"
                placeholder="₹0.00 (optional)"
                value={formData.sellPrice}
                onChange={handleInputChange}
                disabled={createItemsMutation.isPending}
              />
            </div>
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
              type="submit" 
              disabled={createItemsMutation.isPending || !formData.itemTypeId || !formData.purchasePrice}
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
        </form>
      </DialogContent>
    </Dialog>
  );
}