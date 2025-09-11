'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { UserRole, User as ApiUser, UpdateUserRequest } from '@/types/api';
import { usersAPI, agenciesAPI } from '@/lib/api';
import { toast } from 'sonner';

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: ApiUser | null;
}

export function EditUserModal({ isOpen, onClose, user }: EditUserModalProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<UpdateUserRequest>({
    username: '',
    role: UserRole.EMPLOYEE,
    agencyId: '',
  });

  // Update form data when user prop changes
  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username,
        role: user.role,
        agencyId: typeof user.agency === 'object' ? user.agency?._id || '' : user.agency || '',
      });
    }
  }, [user]);

  // Fetch agencies
  const { data: agenciesResponse, isLoading: agenciesLoading } = useQuery({
    queryKey: ['agencies'],
    queryFn: () => agenciesAPI.getAgencies(),
    enabled: isOpen, // Only fetch when modal is open
  });
  
  const agencies = agenciesResponse?.data?.data || [];

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: (data: { id: string; updateData: UpdateUserRequest }) => 
      usersAPI.updateUser ? usersAPI.updateUser(data.id, data.updateData) : Promise.reject('Update not implemented'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User updated successfully');
      handleClose();
    },
    onError: (error: unknown) => {
      const errorMessage = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to update user';
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
  
  const handleRoleChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      role: value as UserRole
    }));
  };

  const handleAgencyChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      agencyId: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;
    
    // Validation
    if (!formData.username?.trim()) {
      toast.error('Username is required');
      return;
    }

    if ((formData.role === UserRole.OWNER || formData.role === UserRole.EMPLOYEE) && !formData.agencyId) {
      toast.error('Agency is required for owners and employees');
      return;
    }

    const submitData = { ...formData };
    if (formData.role === UserRole.MASTER) {
      delete submitData.agencyId; // Master users don't need an agency
    }

    updateUserMutation.mutate({ id: user._id, updateData: submitData });
  };

  const handleClose = () => {
    setFormData({
      username: '',
      role: UserRole.EMPLOYEE,
      agencyId: '',
    });
    onClose();
  };

  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription>
            Update user information
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              name="username"
              type="text"
              placeholder="Enter username"
              value={formData.username}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select value={formData.role} onValueChange={handleRoleChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={UserRole.MASTER}>Master</SelectItem>
                <SelectItem value={UserRole.OWNER}>Owner</SelectItem>
                <SelectItem value={UserRole.EMPLOYEE}>Employee</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {(formData.role === UserRole.OWNER || formData.role === UserRole.EMPLOYEE) && (
            <div className="space-y-2">
              <Label htmlFor="agency">Agency</Label>
              <Select 
                value={formData.agencyId} 
                onValueChange={handleAgencyChange}
                disabled={agenciesLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder={agenciesLoading ? "Loading agencies..." : "Select an agency"} />
                </SelectTrigger>
                <SelectContent>
                  {agencies.map((agency: any) => (
                    <SelectItem key={agency._id} value={agency._id}>
                      {agency.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={updateUserMutation.isPending}
            >
              {updateUserMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Update User
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}