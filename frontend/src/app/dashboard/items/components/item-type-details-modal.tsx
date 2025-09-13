'use client';

import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
          <div className="space-y-6">
            {/* Item Type Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Item Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <span className="font-medium">Name: </span>
                  {itemType.name}
                </div>
                {itemType.description && (
                  <div>
                    <span className="font-medium">Description: </span>
                    {itemType.description}
                  </div>
                )}
                <div>
                  <span className="font-medium">Status: </span>
                  <Badge variant={itemType.isActive ? "default" : "secondary"}>
                    {itemType.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Inventory Status Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Items</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalItems}</div>
                  <p className="text-xs text-muted-foreground">All units</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Available</CardTitle>
                  <Package className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">{availableCount}</div>
                  <p className="text-xs text-muted-foreground">In inventory</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">With Employees</CardTitle>
                  <Users className="h-4 w-4 text-yellow-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-600">{withEmployeeCount}</div>
                  <p className="text-xs text-muted-foreground">Assigned</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Sold</CardTitle>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{soldCount}</div>
                  <p className="text-xs text-muted-foreground">Completed</p>
                </CardContent>
              </Card>
            </div>

            {/* Grouping Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Inventory Breakdown by Status</CardTitle>
              </CardHeader>
              <CardContent>
                {!groupingData.hasGrouping ? (
                  <div className="text-center py-6 text-gray-500">
                    <Package className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                    <p className="font-medium">No Grouping Configured</p>
                    <p className="text-sm">Items are managed individually without grouping</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="text-sm text-gray-600 mb-4">
                      Here's how your {totalItems} items break down by status and grouping:
                    </div>
                    
                    {groupingData.statusBreakdowns.map((statusInfo, statusIndex) => (
                      <div key={statusIndex} className={`border rounded-lg p-4 ${statusInfo.bgColor} ${statusInfo.borderColor}`}>
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="font-medium text-lg flex items-center gap-2">
                            {statusInfo.status === ItemStatus.IN_INVENTORY && <Package className="h-5 w-5 text-blue-600" />}
                            {statusInfo.status === ItemStatus.WITH_EMPLOYEE && <Users className="h-5 w-5 text-yellow-600" />}
                            {statusInfo.status === ItemStatus.SOLD && <CheckCircle className="h-5 w-5 text-green-600" />}
                            {statusInfo.label}
                          </h4>
                          <Badge variant="outline" className="font-medium">
                            {statusInfo.count} items total
                          </Badge>
                        </div>
                        
                        {/* Employee Breakdown for WITH_EMPLOYEE and SOLD statuses */}
                        {(statusInfo.status === ItemStatus.WITH_EMPLOYEE || statusInfo.status === ItemStatus.SOLD) && summary && (
                          <div className="mb-4">
                            {(() => {
                              const statusCount = summary.statusCounts.find(s => s.status === statusInfo.status);
                              const employeeBreakdown = statusCount?.employeeBreakdown || [];
                              
                              if (employeeBreakdown.length > 0) {
                                return (
                                  <div className="bg-white border rounded-lg p-4">
                                    <h5 className="font-medium text-sm text-gray-700 mb-3">
                                      {statusInfo.status === ItemStatus.WITH_EMPLOYEE ? 'Employee Distribution' : 'Sales by Employee'}
                                    </h5>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                      {employeeBreakdown.map((employee) => (
                                        <div key={employee.employeeId} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                          <span className="font-medium text-sm">{employee.employeeName}</span>
                                          <Badge variant="outline" className="text-xs">
                                            {employee.count} items
                                          </Badge>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                );
                              }
                              return null;
                            })()}
                          </div>
                        )}

                        {statusInfo.groupBreakdown.length === 0 && statusInfo.remainingIndividualItems > 0 ? (
                          <div className="bg-white p-4 rounded border">
                            <div className="text-center">
                              <div className="font-medium text-xl text-gray-600">
                                {statusInfo.remainingIndividualItems}
                              </div>
                              <div className="text-gray-500">Individual items only</div>
                              <div className="text-xs text-gray-400 mt-1">
                                Not enough items to form any complete groups
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {statusInfo.groupBreakdown.map((group, groupIndex) => (
                              <div key={groupIndex} className="bg-white p-4 rounded border">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="font-medium">{group.groupName}</span>
                                  <Badge variant="outline" className="text-xs">
                                    {group.unitsPerGroup} units per {group.groupName.toLowerCase()}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-4 text-sm">
                                  <div className="text-center">
                                    <div className={`font-bold text-xl text-${statusInfo.color}-600`}>
                                      {group.completeGroups}
                                    </div>
                                    <div className="text-gray-600">
                                      {group.groupName.toLowerCase()}{group.completeGroups !== 1 ? 's' : ''}
                                    </div>
                                  </div>
                                  <div className="text-gray-400">×</div>
                                  <div className="text-center">
                                    <div className="font-medium text-gray-600">
                                      {group.unitsPerGroup}
                                    </div>
                                    <div className="text-xs text-gray-500">units each</div>
                                  </div>
                                  <div className="text-gray-400">=</div>
                                  <div className="text-center">
                                    <div className="font-medium text-gray-800">
                                      {group.unitsUsed}
                                    </div>
                                    <div className="text-xs text-gray-500">total units</div>
                                  </div>
                                </div>
                              </div>
                            ))}
                            
                            {statusInfo.remainingIndividualItems > 0 && (
                              <div className="bg-white p-4 rounded border border-orange-200">
                                <div className="flex items-center gap-2">
                                  <div className="text-center">
                                    <div className="font-bold text-xl text-orange-600">
                                      {statusInfo.remainingIndividualItems}
                                    </div>
                                    <div className="text-gray-600">Individual items</div>
                                    <div className="text-xs text-gray-500">
                                      Not enough to form a complete group
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                            
                            <div className={`mt-3 p-3 bg-white rounded border-l-4 border-${statusInfo.color}-400`}>
                              <div className={`font-medium text-${statusInfo.color}-800`}>
                                <strong>{statusInfo.label} Summary:</strong>
                                {statusInfo.groupBreakdown.map((group, idx) => (
                                  <span key={idx}>
                                    {idx > 0 ? ', ' : ' '}
                                    {group.completeGroups} {group.groupName.toLowerCase()}{group.completeGroups !== 1 ? 's' : ''}
                                  </span>
                                ))}
                                {statusInfo.remainingIndividualItems > 0 && (
                                  <span>
                                    {statusInfo.groupBreakdown.length > 0 ? ', ' : ''}
                                    {statusInfo.remainingIndividualItems} individual item{statusInfo.remainingIndividualItems !== 1 ? 's' : ''}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}