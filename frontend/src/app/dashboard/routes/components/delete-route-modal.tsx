'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { Route as ApiRoute } from '@/types/api';
import { useDeleteRouteMutation } from '@/hooks/use-queries';
import { toast } from 'sonner';

interface DeleteRouteModalProps {
  isOpen: boolean;
  onClose: () => void;
  route: ApiRoute | null;
}

export function DeleteRouteModal({ isOpen, onClose, route }: DeleteRouteModalProps) {
  // Delete route mutation
  const deleteRouteMutation = useDeleteRouteMutation();

  const handleDelete = () => {
    if (!route) return;

    deleteRouteMutation.mutate(route._id, {
      onSuccess: () => {
        toast.success('Route deleted successfully');
        onClose();
      },
      onError: (error: unknown) => {
        const errorMessage = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to delete route';
        toast.error(errorMessage);
      },
    });
  };

  if (!route) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-[90vw] sm:max-w-md mx-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <DialogTitle className="text-lg sm:text-xl">Delete Route</DialogTitle>
              <DialogDescription className="text-sm sm:text-base">
                This action cannot be undone.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        
        <div className="py-4">
          <p className="text-sm text-gray-700">
            Are you sure you want to delete the route <strong>"{route.name}"</strong>? 
            This will permanently remove the route from your system.
          </p>
          <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-800">
              <strong>Warning:</strong> If this route has customers assigned to it, 
              you'll need to reassign or delete those customers first before deleting this route.
            </p>
          </div>
        </div>
        
        <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-0">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onClose}
            className="w-full sm:w-auto"
            disabled={deleteRouteMutation.isPending}
          >
            Cancel
          </Button>
          <Button 
            type="button" 
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteRouteMutation.isPending}
            className="w-full sm:w-auto"
          >
            {deleteRouteMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Delete Route
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}