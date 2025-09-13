'use client';

import React, { useState } from 'react';
import { ProtectedRoute } from '@/components/auth/protected-route';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { DollarSign, Package, RefreshCw, ShoppingBag } from 'lucide-react';
import { UserRole } from '@/types/api';
import { useAuth } from '@/contexts/auth-context';
import { useEmployeeAnalytics, useSalesAnalytics, useReturnsAnalytics } from '@/hooks/use-queries';
import { format, subDays, startOfMonth } from 'date-fns';

function EmployeeAnalyticsContent() {
  const { user } = useAuth();
  const [startDate, setStartDate] = useState<Date | undefined>(subDays(new Date(), 30));
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());
  const [groupBy, setGroupBy] = useState<'day' | 'week' | 'month' | 'year'>('day');

  const filters = {
    startDate: startDate ? format(startDate, 'yyyy-MM-dd') : undefined,
    endDate: endDate ? format(endDate, 'yyyy-MM-dd') : undefined,
    groupBy,
  };

  // Employee's own analytics
  const employeeAnalyticsQuery = useEmployeeAnalytics(user?._id || '', filters);
  
  // Employee's sales data (filtered by current user)
  const salesQuery = useSalesAnalytics({
    ...filters,
    employeeId: user?._id,
  });

  // Employee's returns data
  const returnsQuery = useReturnsAnalytics({
    ...filters,
    employeeId: user?._id,
  });

  const isLoading = employeeAnalyticsQuery.isLoading || salesQuery.isLoading || returnsQuery.isLoading;
  const error = employeeAnalyticsQuery.error || salesQuery.error || returnsQuery.error;

  const employeeData = employeeAnalyticsQuery.data?.data?.data;
  const formatCurrency = (amount: number) => `₹${amount.toLocaleString()}`;

  const handleRefresh = () => {
    employeeAnalyticsQuery.refetch();
    salesQuery.refetch();
    returnsQuery.refetch();
  };

  const quickDateRanges = [
    {
      label: 'Last 7 days',
      value: { startDate: subDays(new Date(), 7), endDate: new Date() }
    },
    {
      label: 'Last 30 days', 
      value: { startDate: subDays(new Date(), 30), endDate: new Date() }
    },
    {
      label: 'This month',
      value: { startDate: startOfMonth(new Date()), endDate: new Date() }
    },
  ];

  if (error) {
    return (
      <div className="p-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-red-600">
              <p>Error loading analytics data</p>
              <Button variant="outline" onClick={handleRefresh} className="mt-2">
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Performance</h1>
          <p className="text-gray-600">Your sales performance and analytics</p>
        </div>
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">From Date</label>
              <DatePicker date={startDate} setDate={setStartDate} placeholder="Select start date" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">To Date</label>
              <DatePicker date={endDate} setDate={setEndDate} placeholder="Select end date" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Group By</label>
              <Select value={groupBy} onValueChange={(value) => setGroupBy(value as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Daily</SelectItem>
                  <SelectItem value="week">Weekly</SelectItem>
                  <SelectItem value="month">Monthly</SelectItem>
                  <SelectItem value="year">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Quick Ranges</label>
              <div className="flex flex-wrap gap-1">
                {quickDateRanges.map((range, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setStartDate(range.value.startDate);
                      setEndDate(range.value.endDate);
                    }}
                    className="text-xs"
                  >
                    {range.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(employeeData?.sales?.totalRevenue || 0)}
                </div>
                <div className="text-xs text-muted-foreground">
                  {employeeData?.sales?.totalSales || 0} transactions
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Items Sold</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {employeeData?.sales?.totalSales || 0}
                </div>
                <div className="text-xs text-muted-foreground">
                  Avg: {formatCurrency(employeeData?.sales?.averagePrice || 0)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Returns Handled</CardTitle>
                <RefreshCw className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {employeeData?.returns?.totalReturns || 0}
                </div>
                <div className="text-xs text-muted-foreground">
                  Value: {formatCurrency(employeeData?.returns?.totalReturnValue || 0)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Current Inventory</CardTitle>
                <ShoppingBag className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {employeeData?.currentInventory?.reduce((acc, inv) => acc + inv.quantity, 0) || 0}
                </div>
                <div className="text-xs text-muted-foreground">
                  {employeeData?.currentInventory?.length || 0} item types
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sales Timeline */}
            <Card>
              <CardHeader>
                <CardTitle>Sales Timeline</CardTitle>
                <CardDescription>Your sales performance over time</CardDescription>
              </CardHeader>
              <CardContent>
                {employeeData?.salesTimeline && employeeData.salesTimeline.length > 0 ? (
                  <div className="space-y-4">
                    {employeeData.salesTimeline.slice(0, 10).map((entry, index) => (
                      <div key={index} className="flex items-center justify-between border-b pb-2">
                        <div>
                          <div className="font-medium">
                            {format(new Date(entry._id), 'MMM dd, yyyy')}
                          </div>
                          <div className="text-sm text-gray-500">
                            {entry.quantity} items
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">
                            {formatCurrency(entry.revenue || entry.value || 0)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No sales data available for selected period
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Current Inventory */}
            <Card>
              <CardHeader>
                <CardTitle>Current Inventory</CardTitle>
                <CardDescription>Items currently assigned to you</CardDescription>
              </CardHeader>
              <CardContent>
                {employeeData?.currentInventory && employeeData.currentInventory.length > 0 ? (
                  <div className="space-y-4">
                    {employeeData.currentInventory.map((item, index) => (
                      <div key={index} className="flex items-center justify-between border-b pb-2">
                        <div>
                          <div className="font-medium">
                            {item.itemType?.name || `Item Type ${item._id}`}
                          </div>
                          <div className="text-sm text-gray-500">
                            In inventory
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">
                            {item.quantity} units
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No inventory assigned to you
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Performance Insights */}
          <Card>
            <CardHeader>
              <CardTitle>Performance Insights</CardTitle>
              <CardDescription>Summary of your performance metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {employeeData?.sales?.totalSales || 0}
                  </div>
                  <div className="text-sm text-gray-600">Total Sales Made</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {formatCurrency(employeeData?.sales?.averagePrice || 0)}
                  </div>
                  <div className="text-sm text-gray-600">Average Sale Value</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {employeeData?.returns?.totalReturns || 0}
                  </div>
                  <div className="text-sm text-gray-600">Returns Processed</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

export default function EmployeeAnalyticsPage() {
  return (
    <ProtectedRoute allowedRoles={[UserRole.EMPLOYEE]}>
      <DashboardLayout>
        <EmployeeAnalyticsContent />
      </DashboardLayout>
    </ProtectedRoute>
  );
}