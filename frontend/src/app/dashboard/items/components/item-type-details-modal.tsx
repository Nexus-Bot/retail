'use client';

import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Package, Users, CheckCircle, Loader2 } from 'lucide-react';
import { ItemType, ItemStatus, ItemTypeSummary } from '@/types/api';
import { getGroupingBreakdown } from '@/lib/grouping-utils';

interface ItemTypeDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemType: ItemType | null;
  summary: ItemTypeSummary | null;
  isLoading?: boolean;
}

interface EmployeeData {
  employeeId: string;
  employeeName: string;
  withEmployee: number;
  sold: number;
}

export function ItemTypeDetailsModal({ 
  isOpen, 
  onClose, 
  itemType, 
  summary,
  isLoading = false 
}: ItemTypeDetailsModalProps) {
  if (!itemType) return null;

  // Get counts for each status
  const getStatusCount = (status: ItemStatus): number => {
    if (!summary) return 0;
    const statusCount = summary.statusCounts.find(s => s.status === status);
    return statusCount?.count || 0;
  };

  const availableCount = getStatusCount(ItemStatus.IN_INVENTORY);
  const withEmployeeCount = getStatusCount(ItemStatus.WITH_EMPLOYEE);
  const soldCount = getStatusCount(ItemStatus.SOLD);

  // Check if item type has grouping configured
  const hasGrouping = itemType.grouping && itemType.grouping.length > 0;

  // Helper function to get all employees with their item counts
  const getEmployeesData = (): EmployeeData[] => {
    if (!summary) return [];

    const withEmployeeStatus = summary.statusCounts.find(s => s.status === ItemStatus.WITH_EMPLOYEE);
    const soldStatus = summary.statusCounts.find(s => s.status === ItemStatus.SOLD);
    
    const allEmployees = new Map<string, EmployeeData>();
    
    // Add employees with items
    (withEmployeeStatus?.employeeBreakdown || []).forEach(emp => {
      allEmployees.set(emp.employeeId, {
        employeeId: emp.employeeId,
        employeeName: emp.employeeName,
        withEmployee: emp.count,
        sold: 0
      });
    });
    
    // Add employees with sales
    (soldStatus?.employeeBreakdown || []).forEach(emp => {
      const existing = allEmployees.get(emp.employeeId);
      if (existing) {
        existing.sold = emp.count;
      } else {
        allEmployees.set(emp.employeeId, {
          employeeId: emp.employeeId,
          employeeName: emp.employeeName,
          withEmployee: 0,
          sold: emp.count
        });
      }
    });

    return Array.from(allEmployees.values());
  };

  const employeesData = getEmployeesData();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-[95vw] sm:max-w-3xl mx-auto max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            {itemType.name} - Inventory Details
          </DialogTitle>
          <DialogDescription>
            Detailed breakdown of inventory status and grouping information
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Loading details...</span>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Item Type Info - Simplified */}
            <div className="border-b pb-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="text-sm text-gray-600">
                    {itemType.description || 'No description'}
                  </div>
                </div>
                <Badge variant={itemType.isActive ? "default" : "secondary"}>
                  {itemType.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
            </div>

            {/* Employee-Centric Inventory Breakdown */}
            <div>
              <h3 className="font-semibold text-lg mb-4">Employee Inventory Breakdown</h3>
              {!hasGrouping ? (
                <div className="text-center py-6 text-gray-500">
                  <Package className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                  <p className="font-medium">No Grouping Configured</p>
                  <p className="text-sm">Items are managed individually without grouping</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-sm text-gray-600 mb-3">
                    Breakdown by employee and status:
                  </div>
                  
                  {/* Available Inventory (Not with employees) */}
                  {availableCount > 0 && (
                    <div className="border rounded-lg p-3 bg-blue-50 border-blue-200">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium flex items-center gap-2">
                          <Package className="h-4 w-4 text-blue-600" />
                          Available Inventory
                        </h4>
                        <Badge variant="outline" className="text-sm">
                          {getGroupingBreakdown(availableCount, itemType.grouping || [])}
                        </Badge>
                      </div>
                      
                      <div className="bg-white p-3 rounded border text-center">
                        <div className="font-medium text-lg text-blue-600">
                          {getGroupingBreakdown(availableCount, itemType.grouping || [])}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Employee Breakdown */}
                  {employeesData.length > 0 && employeesData.map((employee) => {
                      const totalForEmployee = employee.withEmployee + employee.sold;
                      
                      return (
                        <div key={employee.employeeId} className="border rounded-lg p-3 bg-gray-50 border-gray-200">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-medium flex items-center gap-2">
                              <Users className="h-4 w-4 text-gray-600" />
                              {employee.employeeName}
                            </h4>
                            <Badge variant="outline" className="text-sm">
                              {getGroupingBreakdown(totalForEmployee, itemType.grouping || [])} total
                            </Badge>
                          </div>
                          
                          <div className="space-y-3">
                            {/* Items with employee */}
                            {employee.withEmployee > 0 && (
                              <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="font-medium text-sm text-yellow-800 flex items-center gap-1">
                                    <Users className="h-3 w-3" />
                                    Currently With Employee
                                  </span>
                                  <Badge variant="outline" className="text-xs bg-yellow-100 text-yellow-700">
                                    {getGroupingBreakdown(employee.withEmployee, itemType.grouping || [])}
                                  </Badge>
                                </div>
                                
                                <div className="bg-white p-2 rounded border text-center">
                                  <span className="font-medium text-yellow-700">
                                    {getGroupingBreakdown(employee.withEmployee, itemType.grouping || [])}
                                  </span>
                                </div>
                              </div>
                            )}
                            
                            {/* Items sold by employee */}
                            {employee.sold > 0 && (
                              <div className="bg-green-50 border border-green-200 rounded p-3">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="font-medium text-sm text-green-800 flex items-center gap-1">
                                    <CheckCircle className="h-3 w-3" />
                                    Items Sold
                                  </span>
                                  <Badge variant="outline" className="text-xs bg-green-100 text-green-700">
                                    {getGroupingBreakdown(employee.sold, itemType.grouping || [])}
                                  </Badge>
                                </div>
                                
                                <div className="bg-white p-2 rounded border text-center">
                                  <span className="font-medium text-green-700">
                                    {getGroupingBreakdown(employee.sold, itemType.grouping || [])}
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  
                  {/* Total Summary */}
                  <div className="border rounded-lg p-3 bg-indigo-50 border-indigo-200">
                    <h4 className="font-semibold text-indigo-800 mb-2">Total Summary</h4>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="font-bold text-lg text-blue-600">{getGroupingBreakdown(availableCount, itemType.grouping || [])}</div>
                        <div className="text-xs text-gray-600">Available</div>
                      </div>
                      <div>
                        <div className="font-bold text-lg text-yellow-600">{getGroupingBreakdown(withEmployeeCount, itemType.grouping || [])}</div>
                        <div className="text-xs text-gray-600">With Employees</div>
                      </div>
                      <div>
                        <div className="font-bold text-lg text-green-600">{getGroupingBreakdown(soldCount, itemType.grouping || [])}</div>
                        <div className="text-xs text-gray-600">Sold</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}