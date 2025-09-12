'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { Customer as ApiCustomer } from '@/types/api';
import { useDeleteCustomerMutation } from '@/hooks/use-queries';
import { toast } from 'sonner';

interface DeleteCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: ApiCustomer | null;
}

export function DeleteCustomerModal({ isOpen, onClose, customer }: DeleteCustomerModalProps) {
  // Delete customer mutation
  const deleteCustomerMutation = useDeleteCustomerMutation();

  const handleDelete = () => {
    if (!customer) return;

    deleteCustomerMutation.mutate(customer._id, {
      onSuccess: () => {
        toast.success('Customer deleted successfully');
        onClose();
      },
      onError: (error: unknown) => {
        const errorMessage = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to delete customer';
        toast.error(errorMessage);
      },
    });
  };

  if (!customer) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-[90vw] sm:max-w-md mx-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <DialogTitle className="text-lg sm:text-xl">Delete Customer</DialogTitle>
              <DialogDescription className="text-sm sm:text-base">
                This action cannot be undone.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        
        <div className="py-4">
          <p className="text-sm text-gray-700">
            Are you sure you want to delete the customer <strong>"{customer.name}"</strong>? 
            This will permanently remove the customer and their information from your system.
          </p>
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="text-sm text-red-800">
              <p><strong>Customer Details:</strong></p>
              <ul className="mt-2 space-y-1 list-disc list-inside">
                <li>Name: {customer.name}</li>
                <li>Mobile: {customer.mobile}</li>
                <li>Route: {customer.route && typeof customer.route === "object" ? customer.route.name : "Unknown"}</li>
              </ul>
            </div>
          </div>
        </div>
        
        <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-0">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onClose}
            className="w-full sm:w-auto"
            disabled={deleteCustomerMutation.isPending}
          >
            Cancel
          </Button>
          <Button 
            type="button" 
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteCustomerMutation.isPending}
            className="w-full sm:w-auto"
          >
            {deleteCustomerMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Delete Customer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}