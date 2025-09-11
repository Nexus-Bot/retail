'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, Plus, Trash2, Package } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CreateItemTypeRequest } from '@/types/api';

// Local type for form state that allows strings for unitsPerGroup
interface ItemTypeGroupingForm {
  groupName: string;
  unitsPerGroup: string | number;
}
import { itemTypesAPI } from '@/lib/api';
import { toast } from 'sonner';

interface CreateItemTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateItemTypeModal({ isOpen, onClose }: CreateItemTypeModalProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<CreateItemTypeRequest>({
    name: '',
    description: '',
  });
  const [groupings, setGroupings] = useState<ItemTypeGroupingForm[]>([]);

  const createItemTypeMutation = useMutation({
    mutationFn: (data: CreateItemTypeRequest) => itemTypesAPI.createItemType(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['item-types'] });
      toast.success('Item type created successfully');
      handleClose();
    },
    onError: (error: unknown) => {
      const errorMessage = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to create item type';
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

  const addGrouping = () => {
    setGroupings(prev => [...prev, { groupName: '', unitsPerGroup: '' }]);
  };

  const removeGrouping = (index: number) => {
    setGroupings(prev => prev.filter((_, i) => i !== index));
  };

  const updateGrouping = (index: number, field: keyof ItemTypeGroupingForm, value: string | number) => {
    setGroupings(prev => prev.map((grouping, i) => 
      i === index ? { ...grouping, [field]: value } : grouping
    ));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Item type name is required');
      return;
    }

    if (groupings.some(g => !g.groupName.trim() || !g.unitsPerGroup || (typeof g.unitsPerGroup === 'number' && g.unitsPerGroup <= 0))) {
      toast.error('All groupings must have a valid name and units per group');
      return;
    }

    const submitData = {
      ...formData,
      description: formData.description || undefined,
      grouping: groupings.length > 0 ? groupings.map(g => ({
        ...g,
        unitsPerGroup: typeof g.unitsPerGroup === 'string' ? parseInt(g.unitsPerGroup) : g.unitsPerGroup
      })) : undefined,
    };

    createItemTypeMutation.mutate(submitData);
  };

  const handleClose = () => {
    setFormData({
      name: '',
      description: '',
    });
    setGroupings([]);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-full max-w-[90vw] sm:max-w-2xl mx-auto max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Item Type</DialogTitle>
          <DialogDescription>
            Define a new product type for your inventory
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
          </div>

          {/* Grouping Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium">Grouping (Optional)</h3>
                <p className="text-sm text-gray-600">
                  Define bulk groupings for this item type (e.g., bags, boxes, cartons)
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addGrouping}
                disabled={createItemTypeMutation.isPending}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Grouping
              </Button>
            </div>

            {groupings.map((grouping, index) => (
              <div key={index} className="flex flex-col sm:flex-row sm:items-end space-y-4 sm:space-y-0 sm:space-x-4 p-4 border rounded-lg">
                <div className="flex-1 space-y-2">
                  <Label htmlFor={`groupName-${index}`}>Group Name</Label>
                  <Input
                    id={`groupName-${index}`}
                    type="text"
                    placeholder="e.g., bag, box, carton"
                    value={grouping.groupName}
                    onChange={(e) => updateGrouping(index, 'groupName', e.target.value)}
                    disabled={createItemTypeMutation.isPending}
                  />
                </div>
                <div className="flex-1 space-y-2">
                  <Label htmlFor={`unitsPerGroup-${index}`}>Units per Group</Label>
                  <Input
                    id={`unitsPerGroup-${index}`}
                    type="text"
                    inputMode="numeric"
                    placeholder="e.g., 16"
                    value={grouping.unitsPerGroup}
                    onChange={(e) => {
                      const value = e.target.value;
                      updateGrouping(index, 'unitsPerGroup', value === '' ? '' : parseInt(value) || '');
                    }}
                    disabled={createItemTypeMutation.isPending}
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeGrouping(index)}
                  disabled={createItemTypeMutation.isPending}
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
              disabled={createItemTypeMutation.isPending}
            >
              {createItemTypeMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Item Type
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}