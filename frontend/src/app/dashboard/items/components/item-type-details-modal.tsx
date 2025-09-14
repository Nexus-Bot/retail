'use client';

import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Package, Users, CheckCircle, Loader2 } from 'lucide-react';
import { ItemType, ItemStatus, ItemTypeSummary } from '@/types/api';

interface ItemTypeDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemType: ItemType | null;
  summary: ItemTypeSummary | null;
  isLoading?: boolean;
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

  const totalItems = summary?.totalCount || 0;
  const availableCount = getStatusCount(ItemStatus.IN_INVENTORY);
  const withEmployeeCount = getStatusCount(ItemStatus.WITH_EMPLOYEE);
  const soldCount = getStatusCount(ItemStatus.SOLD);

  // Calculate grouping breakdown per status
  const calculateGroupingBreakdownPerStatus = () => {
    if (!itemType.grouping || itemType.grouping.length === 0) {
      return { hasGrouping: false, statusBreakdowns: [] };
    }

    const statuses = [
      { 
        status: ItemStatus.IN_INVENTORY, 
        label: 'Available (In Inventory)', 
        count: availableCount,
        color: 'blue',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200'
      },
      { 
        status: ItemStatus.WITH_EMPLOYEE, 
        label: 'With Employees', 
        count: withEmployeeCount,
        color: 'yellow',
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200'
      },
      { 
        status: ItemStatus.SOLD, 
        label: 'Sold Items', 
        count: soldCount,
        color: 'green',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200'
      }
    ];

    const statusBreakdowns = statuses.map(statusInfo => {
      if (statusInfo.count === 0) return null;

      // Sort groupings by unitsPerGroup in descending order (largest groups first)
      const sortedGroupings = [...(itemType.grouping || [])].sort((a, b) => b.unitsPerGroup - a.unitsPerGroup);
      
      let remainingItems = statusInfo.count;
      const groupBreakdown: Array<{
        groupName: string;
        unitsPerGroup: number;
        completeGroups: number;
        unitsUsed: number;
      }> = [];

      // Calculate breakdown starting from largest group
      sortedGroupings.forEach(group => {
        if (remainingItems >= group.unitsPerGroup) {
          const completeGroups = Math.floor(remainingItems / group.unitsPerGroup);
          const unitsUsed = completeGroups * group.unitsPerGroup;
          
          if (completeGroups > 0) {
            groupBreakdown.push({
              groupName: group.groupName,
              unitsPerGroup: group.unitsPerGroup,
              completeGroups,
              unitsUsed
            });
            
            remainingItems -= unitsUsed;
          }
        }
      });

      return {
        ...statusInfo,
        groupBreakdown,
        remainingIndividualItems: remainingItems
      };
    }).filter((status): status is NonNullable<typeof status> => status !== null);

    return { hasGrouping: true, statusBreakdowns };
  };

  const groupingData = calculateGroupingBreakdownPerStatus();

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
              {!groupingData.hasGrouping ? (
                <div className="text-center py-6 text-gray-500">
                  <Package className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                  <p className="font-medium">No Grouping Configured</p>
                  <p className="text-sm">Items are managed individually without grouping</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-sm text-gray-600 mb-3">
                    {totalItems} items breakdown by employee and status:
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
                          {availableCount} items
                        </Badge>
                      </div>
                      
                      {(() => {
                        const availableStatus = groupingData.statusBreakdowns.find(s => s.status === ItemStatus.IN_INVENTORY);
                        if (!availableStatus) return null;
                        
                        return availableStatus.groupBreakdown.length === 0 && availableStatus.remainingIndividualItems > 0 ? (
                          <div className="bg-white p-3 rounded border text-center">
                            <div className="font-medium text-lg text-gray-600">
                              {availableStatus.remainingIndividualItems} individual items
                            </div>
                            <div className="text-xs text-gray-400 mt-1">
                              Not enough items to form complete groups
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {availableStatus.groupBreakdown.map((group, groupIndex) => (
                              <div key={groupIndex} className="bg-white p-3 rounded border">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="font-medium text-sm">{group.groupName}</span>
                                  <Badge variant="outline" className="text-xs">
                                    {group.unitsPerGroup} units each
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-3 text-sm">
                                  <div className="text-center">
                                    <div className="font-bold text-lg text-blue-600">
                                      {group.completeGroups}
                                    </div>
                                    <div className="text-xs text-gray-600">
                                      {group.groupName.toLowerCase()}{group.completeGroups !== 1 ? 's' : ''}
                                    </div>
                                  </div>
                                  <div className="text-gray-400">×</div>
                                  <div className="text-center">
                                    <div className="font-medium text-gray-600">{group.unitsPerGroup}</div>
                                    <div className="text-xs text-gray-500">units</div>
                                  </div>
                                  <div className="text-gray-400">=</div>
                                  <div className="text-center">
                                    <div className="font-medium text-gray-800">{group.unitsUsed}</div>
                                    <div className="text-xs text-gray-500">total</div>
                                  </div>
                                </div>
                              </div>
                            ))}
                            
                            {availableStatus.remainingIndividualItems > 0 && (
                              <div className="bg-white p-3 rounded border border-orange-200 text-center">
                                <div className="font-bold text-lg text-orange-600">
                                  {availableStatus.remainingIndividualItems}
                                </div>
                                <div className="text-sm text-gray-600">Individual items</div>
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  {/* Employee Breakdown */}
                  {summary && (() => {
                    // Get all unique employees from both WITH_EMPLOYEE and SOLD statuses
                    const withEmployeeStatus = summary.statusCounts.find(s => s.status === ItemStatus.WITH_EMPLOYEE);
                    const soldStatus = summary.statusCounts.find(s => s.status === ItemStatus.SOLD);
                    
                    const allEmployees = new Map<string, { employeeId: string; employeeName: string; withEmployee: number; sold: number }>();
                    
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

                    const employeeList = Array.from(allEmployees.values());
                    
                    if (employeeList.length === 0) return null;

                    return employeeList.map((employee) => {
                      const totalForEmployee = employee.withEmployee + employee.sold;
                      
                      return (
                        <div key={employee.employeeId} className="border rounded-lg p-3 bg-gray-50 border-gray-200">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-medium flex items-center gap-2">
                              <Users className="h-4 w-4 text-gray-600" />
                              {employee.employeeName}
                            </h4>
                            <Badge variant="outline" className="text-sm">
                              {totalForEmployee} total items
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
                                    {employee.withEmployee} items
                                  </Badge>
                                </div>
                                
                                {(() => {
                                  const withEmployeeGrouping = groupingData.statusBreakdowns.find(s => s.status === ItemStatus.WITH_EMPLOYEE);
                                  
                                  if (!withEmployeeGrouping) return null;
                                  
                                  // Calculate proportional grouping for this employee
                                  const employeeProportion = employee.withEmployee / withEmployeeCount;
                                  
                                  return (
                                    <div className="space-y-2">
                                      {withEmployeeGrouping.groupBreakdown.map((group, idx) => {
                                        const employeeGroups = Math.floor(group.completeGroups * employeeProportion);
                                        const employeeUnits = employeeGroups * group.unitsPerGroup;
                                        
                                        if (employeeGroups === 0) return null;
                                        
                                        return (
                                          <div key={idx} className="bg-white p-2 rounded border text-sm">
                                            <div className="flex items-center gap-2">
                                              <span className="font-medium text-yellow-700">~{employeeGroups}</span>
                                              <span className="text-gray-600">{group.groupName.toLowerCase()}{employeeGroups !== 1 ? 's' : ''}</span>
                                              <span className="text-gray-400">({employeeUnits} units)</span>
                                            </div>
                                          </div>
                                        );
                                      })}
                                      
                                      {withEmployeeGrouping.remainingIndividualItems > 0 && (
                                        <div className="bg-white p-2 rounded border text-sm text-center">
                                          <span className="text-orange-600 font-medium">
                                            ~{Math.floor(withEmployeeGrouping.remainingIndividualItems * employeeProportion)} individual items
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })()}
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
                                    {employee.sold} items
                                  </Badge>
                                </div>
                                
                                {(() => {
                                  const soldGrouping = groupingData.statusBreakdowns.find(s => s.status === ItemStatus.SOLD);
                                  
                                  if (!soldGrouping) return null;
                                  
                                  // Calculate proportional grouping for this employee's sales
                                  const employeeProportion = employee.sold / soldCount;
                                  
                                  return (
                                    <div className="space-y-2">
                                      {soldGrouping.groupBreakdown.map((group, idx) => {
                                        const employeeGroups = Math.floor(group.completeGroups * employeeProportion);
                                        const employeeUnits = employeeGroups * group.unitsPerGroup;
                                        
                                        if (employeeGroups === 0) return null;
                                        
                                        return (
                                          <div key={idx} className="bg-white p-2 rounded border text-sm">
                                            <div className="flex items-center gap-2">
                                              <span className="font-medium text-green-700">~{employeeGroups}</span>
                                              <span className="text-gray-600">{group.groupName.toLowerCase()}{employeeGroups !== 1 ? 's' : ''}</span>
                                              <span className="text-gray-400">({employeeUnits} units)</span>
                                            </div>
                                          </div>
                                        );
                                      })}
                                      
                                      {soldGrouping.remainingIndividualItems > 0 && (
                                        <div className="bg-white p-2 rounded border text-sm text-center">
                                          <span className="text-orange-600 font-medium">
                                            ~{Math.floor(soldGrouping.remainingIndividualItems * employeeProportion)} individual items
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })()}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    });
                  })()}
                  
                  {/* Total Summary */}
                  <div className="border rounded-lg p-3 bg-indigo-50 border-indigo-200">
                    <h4 className="font-semibold text-indigo-800 mb-2">Total Summary</h4>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="font-bold text-lg text-blue-600">{availableCount}</div>
                        <div className="text-xs text-gray-600">Available</div>
                      </div>
                      <div>
                        <div className="font-bold text-lg text-yellow-600">{withEmployeeCount}</div>
                        <div className="text-xs text-gray-600">With Employees</div>
                      </div>
                      <div>
                        <div className="font-bold text-lg text-green-600">{soldCount}</div>
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