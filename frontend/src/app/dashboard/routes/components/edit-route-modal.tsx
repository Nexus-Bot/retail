'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';
import { Route as ApiRoute, UpdateRouteRequest } from '@/types/api';
import { useUpdateRouteMutation } from '@/hooks/use-queries';
import { toast } from 'sonner';

interface EditRouteModalProps {
  isOpen: boolean;
  onClose: () => void;
  route: ApiRoute | null;
}

export function EditRouteModal({ isOpen, onClose, route }: EditRouteModalProps) {
  const [formData, setFormData] = useState<UpdateRouteRequest>({
    name: '',
  });

  // Update form data when route prop changes
  useEffect(() => {
    if (route) {
      setFormData({
        name: route.name,
      });
    }
  }, [route]);

  // Update route mutation
  const updateRouteMutation = useUpdateRouteMutation();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!route) return;
    
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

    updateRouteMutation.mutate({ id: route._id, data: formData }, {
      onSuccess: () => {
        toast.success('Route updated successfully');
        handleClose();
      },
      onError: (error: unknown) => {
        const errorMessage = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to update route';
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

  if (!route) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-full max-w-[90vw] sm:max-w-md mx-auto max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">Edit Route</DialogTitle>
          <DialogDescription className="text-sm sm:text-base">
            Update the route information
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
              disabled={updateRouteMutation.isPending}
              className="w-full sm:w-auto"
            >
              {updateRouteMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Update Route
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}