'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';
import { CreateRouteRequest } from '@/types/api';
import { useCreateRouteMutation } from '@/hooks/use-queries';
import { toast } from 'sonner';

interface CreateRouteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateRouteModal({ isOpen, onClose }: CreateRouteModalProps) {
  const [formData, setFormData] = useState<CreateRouteRequest>({
    name: '',
  });

  // Create route mutation
  const createRouteMutation = useCreateRouteMutation();

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
      toast.error('Route name is required');
      return;
    }
    
    if (formData.name.length < 2) {
      toast.error('Route name must be at least 2 characters');
      return;
    }
    
    if (formData.name.length > 50) {
      toast.error('Route name must not exceed 50 characters');
      return;
    }

    createRouteMutation.mutate(formData, {
      onSuccess: () => {
        toast.success('Route created successfully');
        handleClose();
      },
      onError: (error: unknown) => {
        const errorMessage = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to create route';
        toast.error(errorMessage);
      },
    });
  };

  const handleClose = () => {
    setFormData({
      name: '',
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-full max-w-[90vw] sm:max-w-md mx-auto max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">Create New Route</DialogTitle>
          <DialogDescription className="text-sm sm:text-base">
            Add a new delivery route to your agency
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Route Name</Label>
            <Input
              id="name"
              name="name"
              type="text"
              placeholder="Enter route name"
              value={formData.name}
              onChange={handleInputChange}
              required
              minLength={2}
              maxLength={50}
            />
            <p className="text-xs text-gray-500">
              Route name should be unique and descriptive (e.g., "Downtown Area", "North District")
            </p>
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
              disabled={createRouteMutation.isPending}
              className="w-full sm:w-auto"
            >
              {createRouteMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Route
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}