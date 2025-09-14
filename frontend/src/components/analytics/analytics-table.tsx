'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Calendar,
  Download,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Users
} from 'lucide-react';
import { useItemTypeAnalytics, useUsers } from '@/hooks/use-queries';
import { UserRole } from '@/types/api';
import { format } from 'date-fns';
import { DatePicker } from '@/components/ui/date-picker';
import { 
  calculateItemGrouping,
  formatGroupingDisplay,
  formatCompactGroupingDisplay,
  getGroupingTooltip
} from '@/lib/grouping-utils';
import { useMemo } from 'react';

interface AnalyticsTableProps {
  showEmployeeSelector?: boolean; // Only show for owners
  title?: string;
  description?: string;
}

interface FilterState {
  startDate: Date | undefined;
  endDate: Date | undefined;
  employeeId: string;
}

export function AnalyticsTable({ 
  showEmployeeSelector = false,
  title = "Analytics",
  description = "Sales and returns analysis by item type"
}: AnalyticsTableProps) {
  // Date range state - default to last 30 days
  const [filters, setFilters] = useState<FilterState>({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    endDate: new Date(),
    employeeId: 'all'
  });

  // Fetch employees if needed
  const { data: employeesData } = useUsers({
    role: UserRole.EMPLOYEE,
    enabled: showEmployeeSelector
  });
  const employees = employeesData?.data?.data || [];

  // Format dates for API
  const apiFilters = {
    startDate: filters.startDate ? format(filters.startDate, 'yyyy-MM-dd') : undefined,
    endDate: filters.endDate ? format(filters.endDate, 'yyyy-MM-dd') : undefined,
    employeeId: filters.employeeId === 'all' ? undefined : filters.employeeId,
  };

  // Fetch analytics data
  const { data: analytics, isLoading, error, refetch } = useItemTypeAnalytics(apiFilters);

  const handleDateChange = (field: 'startDate' | 'endDate', date: Date | undefined) => {
    setFilters(prev => ({
      ...prev,
      [field]: date
    }));
  };

  const handleEmployeeChange = (employeeId: string) => {
    setFilters(prev => ({
      ...prev,
      employeeId
    }));
  };

  const clearFilters = () => {
    setFilters({
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      endDate: new Date(),
      employeeId: 'all'
    });
  };

  const exportData = () => {
    if (!analytics?.data?.data) return;
    
    // Create CSV content
    const headers = ['Item Type', 'Sales', 'Sales Revenue (₹)', 'Returns', 'Returns Revenue (₹)'];
    const rows = analytics.data.data.itemTypes.map((item: any) => [
      item.itemTypeName,
      item.salesCount.toString(),
      (item.salesRevenue || 0).toString(),
      item.returnsCount.toString(),
      (item.returnsRevenue || 0).toString()
    ]);
    
    // Add totals row
    rows.push([
      'TOTAL',
      analytics.data.data?.totals.totalSales.toString() || '0',
      (analytics.data.data?.totals.totalSalesRevenue || 0).toString(),
      analytics.data.data?.totals.totalReturns.toString() || '0',
      (analytics.data.data?.totals.totalReturnsRevenue || 0).toString()
    ]);
    
    const csvContent = [headers, ...rows]
      .map(row => row.map((cell: any) => `"${cell}"`).join(','))
      .join('\n');
    
    // Create filename with filters
    let filename = `analytics-${format(new Date(), 'yyyy-MM-dd')}`;
    if (filters.employeeId !== 'all') {
      const selectedEmployee = employees.find(emp => emp._id === filters.employeeId);
      if (selectedEmployee) {
        filename += `-${selectedEmployee.username}`;
      }
    }
    filename += '.csv';
    
    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Calculate groupings for all items using useMemo
  const itemGroupings = useMemo(() => {
    if (!analytics?.data?.data?.itemTypes) return [];
    
    return analytics.data.data.itemTypes.map((item: any) => {
      const groupings = item.grouping || [];
      return {
        salesGrouping: {
          grouping: calculateItemGrouping(item.salesCount, groupings),
          display: formatGroupingDisplay(calculateItemGrouping(item.salesCount, groupings)),
          compactDisplay: formatCompactGroupingDisplay(calculateItemGrouping(item.salesCount, groupings)),
          tooltip: getGroupingTooltip(calculateItemGrouping(item.salesCount, groupings)),
          hasGrouping: groupings.length > 0
        },
        returnsGrouping: {
          grouping: calculateItemGrouping(item.returnsCount, groupings),
          display: formatGroupingDisplay(calculateItemGrouping(item.returnsCount, groupings)),
          compactDisplay: formatCompactGroupingDisplay(calculateItemGrouping(item.returnsCount, groupings)),
          tooltip: getGroupingTooltip(calculateItemGrouping(item.returnsCount, groupings)),
          hasGrouping: groupings.length > 0
        }
      };
    });
  }, [analytics?.data?.data?.itemTypes]);

  // Get selected employee name for display
  const getSelectedEmployeeName = () => {
    if (filters.employeeId === 'all') return 'All Employees';
    const selectedEmployee = employees.find(emp => emp._id === filters.employeeId);
    return selectedEmployee?.username || 'Unknown Employee';
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600 mb-4">Failed to load analytics data</p>
          <Button onClick={() => refetch()}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="text-gray-600">
            {description}
            {showEmployeeSelector && filters.employeeId !== 'all' && (
              <span className="ml-2 text-blue-600 font-medium">
                - {getSelectedEmployeeName()}
              </span>
            )}
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2">
          <Button 
            variant="outline" 
            onClick={clearFilters}
            className="w-full sm:w-auto"
          >
            <Calendar className="h-4 w-4 mr-2" />
            Reset Filters
          </Button>
          
          <Button 
            onClick={exportData}
            disabled={!analytics?.data || isLoading}
            className="w-full sm:w-auto"
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Filters</h2>
          <p className="text-sm text-gray-600">
            Select date range{showEmployeeSelector ? ' and employee' : ''} for analytics data
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Start Date</Label>
            <DatePicker
              date={filters.startDate}
              setDate={(date) => handleDateChange('startDate', date)}
              placeholder="Select start date"
            />
          </div>
          
          <div className="space-y-2">
            <Label>End Date</Label>
            <DatePicker
              date={filters.endDate}
              setDate={(date) => handleDateChange('endDate', date)}
              placeholder="Select end date"
            />
          </div>

          {showEmployeeSelector && (
            <div className="space-y-2">
              <Label htmlFor="employee">Employee</Label>
              <Select value={filters.employeeId} onValueChange={handleEmployeeChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-2" />
                      All Employees
                    </div>
                  </SelectItem>
                  {employees.map((employee) => (
                    <SelectItem key={employee._id} value={employee._id}>
                      {employee.username}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </div>


      {/* Analytics Table */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="mb-4">
          <div className="flex items-center mb-2">
            <BarChart3 className="mr-2 h-5 w-5" />
            <h2 className="text-lg font-semibold">Item Type Analytics</h2>
          </div>
          <div className="text-sm text-gray-600">
            Sales and returns breakdown by item type
            {filters.startDate && filters.endDate && (
              <span className="block mt-1">
                {format(filters.startDate, 'MMM d, yyyy')} - {format(filters.endDate, 'MMM d, yyyy')}
              </span>
            )}
            {showEmployeeSelector && filters.employeeId !== 'all' && (
              <span className="block mt-1 text-blue-600">
                Filtered by: {getSelectedEmployeeName()}
              </span>
            )}
          </div>
        </div>
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : analytics?.data?.data?.itemTypes?.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No data available for the selected filters</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2 font-medium">Item Type</th>
                    <th className="text-center py-3 px-2 font-medium">Sales</th>
                    <th className="text-center py-3 px-2 font-medium">Sales Revenue</th>
                    <th className="text-center py-3 px-2 font-medium">Returns</th>
                    <th className="text-center py-3 px-2 font-medium">Returns Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics?.data?.data?.itemTypes.map((item: any, index: any) => {
                    const salesGrouping = itemGroupings[index]?.salesGrouping;
                    const returnsGrouping = itemGroupings[index]?.returnsGrouping;
                    
                    return (
                      <tr key={item._id} className={index % 2 === 0 ? 'bg-gray-50' : ''}>
                        <td className="py-3 px-2 font-medium">{item.itemTypeName}</td>
                        <td className="py-3 px-2 text-center">
                          <div className="flex flex-col items-center gap-1">
                            <Badge variant="outline" className="text-green-600 border-green-200">
                              {item.salesCount}
                            </Badge>
                            {salesGrouping?.hasGrouping && (
                              <div className="text-xs text-gray-600">
                                {salesGrouping.compactDisplay}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-2 text-center">
                          <div className="flex flex-col items-center gap-1">
                            <Badge variant="outline" className="text-green-600 border-green-200">
                              ₹{item.salesRevenue?.toLocaleString() || '0'}
                            </Badge>
                            <div className="text-xs text-gray-600">
                              Revenue
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-2 text-center">
                          <div className="flex flex-col items-center gap-1">
                            <Badge variant="outline" className="text-red-600 border-red-200">
                              {item.returnsCount}
                            </Badge>
                            {returnsGrouping?.hasGrouping && (
                              <div className="text-xs text-gray-600">
                                {returnsGrouping.compactDisplay}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-2 text-center">
                          <div className="flex flex-col items-center gap-1">
                            <Badge variant="outline" className="text-red-600 border-red-200">
                              ₹{item.returnsRevenue?.toLocaleString() || '0'}
                            </Badge>
                            <div className="text-xs text-gray-600">
                              Lost Revenue
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                {analytics?.data?.data && (
                  <tfoot className="border-t bg-gray-100">
                    <tr>
                      <td className="py-3 px-2 font-bold">TOTAL</td>
                      <td className="py-3 px-2 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <Badge className="bg-green-600">
                            {analytics.data.data?.totals.totalSales}
                          </Badge>
                          <span className="text-xs text-gray-500 font-medium">
                            {analytics.data.data?.totals.totalSales} items
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-2 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <Badge className="bg-green-600">
                            ₹{analytics.data.data?.totals.totalSalesRevenue?.toLocaleString() || '0'}
                          </Badge>
                          <span className="text-xs text-gray-500 font-medium">
                            Total Revenue
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-2 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <Badge className="bg-red-600">
                            {analytics.data.data?.totals.totalReturns}
                          </Badge>
                          <span className="text-xs text-gray-500 font-medium">
                            {analytics.data.data?.totals.totalReturns} items
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-2 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <Badge className="bg-red-600">
                            ₹{analytics.data.data?.totals.totalReturnsRevenue?.toLocaleString() || '0'}
                          </Badge>
                          <span className="text-xs text-gray-500 font-medium">
                            Lost Revenue
                          </span>
                        </div>
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          )}
      </div>

      {/* Bottom Summary */}
      {analytics?.data?.data && (
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-green-50 border border-green-200 rounded-lg p-2 text-center">
            <div className="flex items-center justify-center mb-1">
              <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
              <span className="text-xs font-medium text-green-700">Total Sales</span>
            </div>
            <div className="text-lg font-bold text-green-600">
              {analytics.data.data?.totals.totalSales}
            </div>
            {showEmployeeSelector && filters.employeeId !== 'all' && (
              <div className="text-xs text-green-600 mt-1">
                {getSelectedEmployeeName()}
              </div>
            )}
          </div>
          
          <div className="bg-red-50 border border-red-200 rounded-lg p-2 text-center">
            <div className="flex items-center justify-center mb-1">
              <TrendingDown className="h-4 w-4 text-red-600 mr-1" />
              <span className="text-xs font-medium text-red-700">Total Returns</span>
            </div>
            <div className="text-lg font-bold text-red-600">
              {analytics.data.data?.totals.totalReturns}
            </div>
            {showEmployeeSelector && filters.employeeId !== 'all' && (
              <div className="text-xs text-red-600 mt-1">
                {getSelectedEmployeeName()}
              </div>
            )}
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 text-center">
            <div className="flex items-center justify-center mb-1">
              <Users className="h-4 w-4 text-blue-600 mr-1" />
              <span className="text-xs font-medium text-blue-700">Net Revenue</span>
            </div>
            <div className="text-lg font-bold text-blue-600">
              ₹{((analytics.data.data?.totals.totalSalesRevenue || 0) - (analytics.data.data?.totals.totalReturnsRevenue || 0)).toLocaleString()}
            </div>
            <div className="text-xs text-blue-600 mt-1">
              sales - returns revenue
            </div>
          </div>
        </div>
      )}
    </div>
  );
}