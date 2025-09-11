'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { UserRole, CreateUserRequest } from '@/types/api';
import { usersAPI, agenciesAPI } from '@/lib/api';
import { toast } from 'sonner';

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateUserModal({ isOpen, onClose }: CreateUserModalProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<CreateUserRequest>({
    username: '',
    password: '',
    role: UserRole.EMPLOYEE,
    agencyId: '',
  });

  // Fetch agencies
  const { data: agenciesResponse, isLoading: agenciesLoading } = useQuery({
    queryKey: ['agencies'],
    queryFn: () => agenciesAPI.getAgencies(),
    enabled: isOpen, // Only fetch when modal is open
  });
  
  const agencies = agenciesResponse?.data?.data || [];

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: (data: CreateUserRequest) => usersAPI.createUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User created successfully');
      handleClose();
    },
    onError: (error: unknown) => {
      const errorMessage = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to create user';
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
    
    // Validation
    if (!formData.username.trim()) {
      toast.error('Username is required');
      return;
    }
    
    if (!formData.password.trim()) {
      toast.error('Password is required');
      return;
    }
    
    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
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

    createUserMutation.mutate(submitData);
  };

  const handleClose = () => {
    setFormData({
      username: '',
      password: '',
      role: UserRole.EMPLOYEE,
      agencyId: '',
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-full max-w-[90vw] sm:max-w-md mx-auto max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">Create New User</DialogTitle>
          <DialogDescription className="text-sm sm:text-base">
            Add a new user to the system
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
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="Enter password"
              value={formData.password}
              onChange={handleInputChange}
              required
              minLength={6}
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
              disabled={createUserMutation.isPending}
              className="w-full sm:w-auto"
            >
              {createUserMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create User
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}