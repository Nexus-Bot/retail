'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Agency, UpdateAgencyRequest } from '@/types/api';
import { agenciesAPI } from '@/lib/api';
import { toast } from 'sonner';

interface EditAgencyModalProps {
  isOpen: boolean;
  onClose: () => void;
  agency: Agency | null;
}

export function EditAgencyModal({ isOpen, onClose, agency }: EditAgencyModalProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<UpdateAgencyRequest>({
    name: '',
    status: 'active',
  });

  // Update form data when agency prop changes
  useEffect(() => {
    if (agency) {
      setFormData({
        name: agency.name,
        status: agency.status,
      });
    }
  }, [agency]);

  // Update agency mutation
  const updateAgencyMutation = useMutation({
    mutationFn: (data: { id: string; updateData: UpdateAgencyRequest }) => 
      agenciesAPI.updateAgency(data.id, data.updateData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agencies'] });
      toast.success('Agency updated successfully');
      handleClose();
    },
    onError: (error: unknown) => {
      const errorMessage = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to update agency';
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!agency) return;
    
    // Validation
    if (!formData.name?.trim()) {
      toast.error('Agency name is required');
      return;
    }

    updateAgencyMutation.mutate({ id: agency._id, updateData: formData });
  };

  const handleClose = () => {
    setFormData({
      name: '',
      status: 'active',
    });
    onClose();
  };

  if (!agency) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Agency</DialogTitle>
          <DialogDescription>
            Update agency information
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Agency Name</Label>
            <Input
              id="name"
              name="name"
              type="text"
              placeholder="Enter agency name"
              value={formData.name}
              onChange={handleInputChange}
              required
            />
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={updateAgencyMutation.isPending}
            >
              {updateAgencyMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Update Agency
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}