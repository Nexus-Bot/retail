'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';
import { CreateCustomerRequest } from '@/types/api';
import { useCreateCustomerMutation, useRoutes } from '@/hooks/use-queries';
import { toast } from 'sonner';

interface CreateCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateCustomerModal({ isOpen, onClose }: CreateCustomerModalProps) {
  const [formData, setFormData] = useState<CreateCustomerRequest>({
    name: '',
    mobile: '',
    routeId: '',
  });

  // Fetch routes for the dropdown
  const { data: routesResponse, isLoading: routesLoading } = useRoutes({
    limit: 100,
    enabled: isOpen, // Only fetch when modal is open
  });
  
  const routes = routesResponse?.data?.data || [];

  // Create customer mutation
  const createCustomerMutation = useCreateCustomerMutation();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRouteChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      routeId: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name.trim()) {
      toast.error('Customer name is required');
      return;
    }
    
    if (!formData.mobile.trim()) {
      toast.error('Mobile number is required');
      return;
    }

    // Basic mobile number validation (10-15 digits with optional + and spaces/dashes)
    const mobileRegex = /^\+?[\d\s\-()]{10,15}$/;
    if (!mobileRegex.test(formData.mobile.trim())) {
      toast.error('Please enter a valid mobile number');
      return;
    }
    
    if (!formData.routeId) {
      toast.error('Route is required');
      return;
    }

    createCustomerMutation.mutate(formData, {
      onSuccess: () => {
        toast.success('Customer created successfully');
        handleClose();
      },
      onError: (error: unknown) => {
        const errorMessage = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to create customer';
        toast.error(errorMessage);
      },
    });
  };

  const handleClose = () => {
    setFormData({
      name: '',
      mobile: '',
      routeId: '',
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-full max-w-[90vw] sm:max-w-md mx-auto max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">Add New Customer</DialogTitle>
          <DialogDescription className="text-sm sm:text-base">
            Add a new customer to your agency
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Customer Name</Label>
            <Input
              id="name"
              name="name"
              type="text"
              placeholder="Enter customer name"
              value={formData.name}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="mobile">Mobile Number</Label>
            <Input
              id="mobile"
              name="mobile"
              type="tel"
              placeholder="Enter mobile number"
              value={formData.mobile}
              onChange={handleInputChange}
              required
            />
            <p className="text-xs text-gray-500">
              Format: 10-15 digits (e.g., +1234567890, 123-456-7890)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="route">Route</Label>
            <Select 
              value={formData.routeId} 
              onValueChange={handleRouteChange}
              disabled={routesLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder={routesLoading ? "Loading routes..." : "Select a route"} />
              </SelectTrigger>
              <SelectContent>
                {routes.map((route: any) => (
                  <SelectItem key={route._id} value={route._id}>
                    {route.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {routes.length === 0 && !routesLoading && (
              <p className="text-xs text-amber-600">
                No routes available. Please create a route first.
              </p>
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
              type="submit" 
              disabled={createCustomerMutation.isPending || routes.length === 0}
              className="w-full sm:w-auto"
            >
              {createCustomerMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Add Customer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}