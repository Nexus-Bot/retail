'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, Plus, Trash2, Package } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ItemType, UpdateItemTypeRequest, ItemTypeGrouping } from '@/types/api';
import { itemTypesAPI } from '@/lib/api';
import { toast } from 'sonner';

interface EditItemTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemType: ItemType | null;
}

export function EditItemTypeModal({ isOpen, onClose, itemType }: EditItemTypeModalProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<UpdateItemTypeRequest>({
    name: '',
    description: '',
    isActive: true,
  });
  const [groupings, setGroupings] = useState<ItemTypeGrouping[]>([]);

  useEffect(() => {
    if (itemType) {
      setFormData({
        name: itemType.name,
        description: itemType.description || '',
        isActive: itemType.isActive,
      });
      setGroupings(itemType.grouping || []);
    }
  }, [itemType]);

  const updateItemTypeMutation = useMutation({
    mutationFn: (data: { id: string; updateData: UpdateItemTypeRequest }) => 
      itemTypesAPI.updateItemType(data.id, data.updateData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['item-types'] });
      toast.success('Item type updated successfully');
      handleClose();
    },
    onError: (error: unknown) => {
      const errorMessage = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to update item type';
      toast.error(errorMessage);
    },
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSwitchChange = (checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      isActive: checked
    }));
  };

  const addGrouping = () => {
    setGroupings(prev => [...prev, { groupName: '', unitsPerGroup: 1 }]);
  };

  const removeGrouping = (index: number) => {
    setGroupings(prev => prev.filter((_, i) => i !== index));
  };

  const updateGrouping = (index: number, field: keyof ItemTypeGrouping, value: string | number) => {
    setGroupings(prev => prev.map((grouping, i) => 
      i === index ? { ...grouping, [field]: value } : grouping
    ));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!itemType) return;
    
    if (!formData.name?.trim()) {
      toast.error('Item type name is required');
      return;
    }

    if (groupings.some(g => !g.groupName.trim() || g.unitsPerGroup <= 0)) {
      toast.error('All groupings must have a valid name and units per group');
      return;
    }

    const submitData = {
      ...formData,
      description: formData.description || undefined,
      grouping: groupings.length > 0 ? groupings : undefined,
    };

    updateItemTypeMutation.mutate({ id: itemType._id, updateData: submitData });
  };

  const handleClose = () => {
    setFormData({
      name: '',
      description: '',
      isActive: true,
    });
    setGroupings([]);
    onClose();
  };

  if (!itemType) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Item Type</DialogTitle>
          <DialogDescription>
            Update the item type information and groupings
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Item Type Name *</Label>
              <Input
                id="name"
                name="name"
                type="text"
                placeholder="e.g., Tea Packet 500gm"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Optional description for this item type"
                value={formData.description}
                onChange={handleInputChange}
                className="min-h-20"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={handleSwitchChange}
                disabled={updateItemTypeMutation.isPending}
              />
              <Label htmlFor="isActive">Active</Label>
            </div>
          </div>

          {/* Grouping Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium">Grouping</h3>
                <p className="text-sm text-gray-600">
                  Define bulk groupings for this item type (e.g., bags, boxes, cartons)
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addGrouping}
                disabled={updateItemTypeMutation.isPending}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Grouping
              </Button>
            </div>

            {groupings.map((grouping, index) => (
              <div key={index} className="flex items-end space-x-4 p-4 border rounded-lg">
                <div className="flex-1 space-y-2">
                  <Label htmlFor={`groupName-${index}`}>Group Name</Label>
                  <Input
                    id={`groupName-${index}`}
                    type="text"
                    placeholder="e.g., bag, box, carton"
                    value={grouping.groupName}
                    onChange={(e) => updateGrouping(index, 'groupName', e.target.value)}
                    disabled={updateItemTypeMutation.isPending}
                  />
                </div>
                <div className="flex-1 space-y-2">
                  <Label htmlFor={`unitsPerGroup-${index}`}>Units per Group</Label>
                  <Input
                    id={`unitsPerGroup-${index}`}
                    type="number"
                    min="1"
                    placeholder="e.g., 16"
                    value={grouping.unitsPerGroup}
                    onChange={(e) => updateGrouping(index, 'unitsPerGroup', parseInt(e.target.value) || 1)}
                    disabled={updateItemTypeMutation.isPending}
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeGrouping(index)}
                  disabled={updateItemTypeMutation.isPending}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}

            {groupings.length === 0 && (
              <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
                <Package className="mx-auto h-8 w-8 text-gray-400" />
                <p className="mt-2 text-sm text-gray-500">No groupings added</p>
                <p className="text-xs text-gray-400">Groupings help with bulk item management</p>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={updateItemTypeMutation.isPending}
            >
              {updateItemTypeMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Update Item Type
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}