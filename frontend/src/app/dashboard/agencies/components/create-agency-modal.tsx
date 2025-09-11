'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CreateAgencyRequest } from '@/types/api';
import { agenciesAPI } from '@/lib/api';
import { toast } from 'sonner';

interface CreateAgencyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateAgencyModal({ isOpen, onClose }: CreateAgencyModalProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<CreateAgencyRequest>({
    name: '',
  });

  // Create agency mutation
  const createAgencyMutation = useMutation({
    mutationFn: (data: CreateAgencyRequest) => agenciesAPI.createAgency(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agencies'] });
      toast.success('Agency created successfully');
      handleClose();
    },
    onError: (error: unknown) => {
      const errorMessage = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to create agency';
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
    
    // Validation
    if (!formData.name.trim()) {
      toast.error('Agency name is required');
      return;
    }

    createAgencyMutation.mutate(formData);
  };

  const handleClose = () => {
    setFormData({
      name: '',
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-full max-w-[90vw] sm:max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle>Create New Agency</DialogTitle>
          <DialogDescription>
            Add a new agency to the system
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
              disabled={createAgencyMutation.isPending}
            >
              {createAgencyMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Agency
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}