'use client';

import React, { useState } from 'react';
import { ProtectedRoute } from '@/components/auth/protected-route';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  DollarSign, 
  Users, 
  ShoppingCart,
  RefreshCw,
  Filter,
  Download
} from 'lucide-react';
import { UserRole } from '@/types/api';
import { 
  useDashboardAnalytics, 
  useSalesAnalytics, 
  useReturnsAnalytics,
  useUsers,
  useCustomers,
  useItemTypes
} from '@/hooks/use-queries';
import { format } from 'date-fns';
import { DatePicker } from '@/components/ui/date-picker';

interface FilterState {
  startDate: Date | undefined;
  endDate: Date | undefined;
  groupBy: 'day' | 'week' | 'month' | 'year';
  employeeId: string;
  customerId: string;
  itemTypeId: string;
}

function OwnerAnalyticsContent() {
  // Date range state - default to last 30 days
  const [filters, setFilters] = useState<FilterState>({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    endDate: new Date(),
    groupBy: 'day',
    employeeId: 'all',
    customerId: 'all',
    itemTypeId: 'all'
  });

  // Fetch reference data for filters
  const { data: usersData } = useUsers();
  const { data: customersData } = useCustomers();
  const { data: itemTypesData } = useItemTypes();

  const employees = usersData?.data.data?.filter(user => user.role === UserRole.EMPLOYEE) || [];
  const customers = customersData?.data.data || [];
  const itemTypes = itemTypesData?.data.data || [];

  // Analytics queries
  const dashboardQuery = useDashboardAnalytics({
    startDate: filters.startDate ? format(filters.startDate, 'yyyy-MM-dd') : undefined,
    endDate: filters.endDate ? format(filters.endDate, 'yyyy-MM-dd') : undefined
  });

  const salesQuery = useSalesAnalytics({
    startDate: filters.startDate ? format(filters.startDate, 'yyyy-MM-dd') : undefined,
    endDate: filters.endDate ? format(filters.endDate, 'yyyy-MM-dd') : undefined,
    groupBy: filters.groupBy,
    employeeId: filters.employeeId !== 'all' ? filters.employeeId : undefined,
    customerId: filters.customerId !== 'all' ? filters.customerId : undefined,
    itemTypeId: filters.itemTypeId !== 'all' ? filters.itemTypeId : undefined
  });

  const returnsQuery = useReturnsAnalytics({
    startDate: filters.startDate ? format(filters.startDate, 'yyyy-MM-dd') : undefined,
    endDate: filters.endDate ? format(filters.endDate, 'yyyy-MM-dd') : undefined,
    groupBy: filters.groupBy,
    employeeId: filters.employeeId !== 'all' ? filters.employeeId : undefined,
    customerId: filters.customerId !== 'all' ? filters.customerId : undefined,
    itemTypeId: filters.itemTypeId !== 'all' ? filters.itemTypeId : undefined
  });

  // Computed values
  const isLoading = dashboardQuery.isLoading || salesQuery.isLoading || returnsQuery.isLoading;
  const dashboardData = dashboardQuery.data?.data.data;
  const salesData = salesQuery.data?.data.data;
  const returnsData = returnsQuery.data?.data.data;

  // Format currency helper
  const formatCurrency = (amount: number | undefined) => `₹${(amount || 0).toLocaleString()}`;

  // Reset filters
  const resetFilters = () => {
    setFilters({
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      endDate: new Date(),
      groupBy: 'day',
      employeeId: 'all',
      customerId: 'all',
      itemTypeId: 'all'
    });
  };

  // Quick date range presets
  const setQuickRange = (days: number) => {
    setFilters(prev => ({
      ...prev,
      startDate: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
      endDate: new Date()
    }));
  };

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Owner Analytics</h1>
          <p className="text-gray-600">Comprehensive business insights and performance metrics</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => {
              dashboardQuery.refetch();
              salesQuery.refetch();
              returnsQuery.refetch();
            }}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Refreshing...' : 'Refresh'}
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-1" />
            Export
          </Button>
        </div>
      </div>

      {/* Filters Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="h-4 w-4 mr-2" />
            Filters & Date Range
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Start Date */}
            <div className="space-y-2">
              <Label>From Date</Label>
              <DatePicker 
                date={filters.startDate} 
                setDate={(startDate) => setFilters(prev => ({ ...prev, startDate }))}
                placeholder="Select start date"
              />
            </div>
            
            {/* End Date */}
            <div className="space-y-2">
              <Label>To Date</Label>
              <DatePicker 
                date={filters.endDate} 
                setDate={(endDate) => setFilters(prev => ({ ...prev, endDate }))}
                placeholder="Select end date"
              />
            </div>
            
            {/* Group By */}
            <div className="space-y-2">
              <Label>Group By</Label>
              <Select
                value={filters.groupBy}
                onValueChange={(value) => setFilters(prev => ({ ...prev, groupBy: value as FilterState['groupBy'] }))}
              >
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

            {/* Employee Filter */}
            <div className="space-y-2">
              <Label>Employee</Label>
              <Select
                value={filters.employeeId}
                onValueChange={(value) => setFilters(prev => ({ ...prev, employeeId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All employees" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All employees</SelectItem>
                  {employees.map((employee) => (
                    <SelectItem key={employee._id} value={employee._id}>
                      {employee.username}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Customer Filter */}
            <div className="space-y-2">
              <Label>Customer</Label>
              <Select
                value={filters.customerId}
                onValueChange={(value) => setFilters(prev => ({ ...prev, customerId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All customers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All customers</SelectItem>
                  {customers.map((customer) => (
                    <SelectItem key={customer._id} value={customer._id}>
                      {customer.name} - {customer.mobile}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Item Type Filter */}
            <div className="space-y-2">
              <Label>Item Type</Label>
              <Select
                value={filters.itemTypeId}
                onValueChange={(value) => setFilters(prev => ({ ...prev, itemTypeId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All item types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All item types</SelectItem>
                  {itemTypes.map((itemType) => (
                    <SelectItem key={itemType._id} value={itemType._id}>
                      {itemType.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Quick Date Range Buttons */}
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => setQuickRange(7)}>
              Last 7 days
            </Button>
            <Button variant="outline" size="sm" onClick={() => setQuickRange(30)}>
              Last 30 days
            </Button>
            <Button variant="outline" size="sm" onClick={() => setQuickRange(90)}>
              Last 90 days
            </Button>
            <Button variant="outline" size="sm" onClick={() => setQuickRange(365)}>
              Last year
            </Button>
            <Button variant="outline" size="sm" onClick={resetFilters}>
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-gray-500" />
          <span className="ml-2 text-gray-500">Loading analytics...</span>
        </div>
      ) : (
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="sales">Sales Analysis</TabsTrigger>
            <TabsTrigger value="returns">Returns Analysis</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatCurrency(dashboardData?.salesOverview.totalRevenue || 0)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Average: {formatCurrency(dashboardData?.salesOverview.averageOrderValue || 0)} per order
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
                  <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {dashboardData?.salesOverview.totalSales || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Items sold in selected period
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Returns</CardTitle>
                  <RefreshCw className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {returnsData?.summary.totalReturns || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Value: {formatCurrency(returnsData?.summary.totalReturnValue || 0)}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Unique Customers</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {salesData?.summary.uniqueCustomersCount || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Active customers in period
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Inventory Status */}
            <Card>
              <CardHeader>
                <CardTitle>Inventory Status</CardTitle>
                <CardDescription>Current distribution of items by status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4">
                  {dashboardData?.inventoryStatus.map((status) => (
                    <div key={status._id} className="flex items-center space-x-2">
                      <Badge variant={
                        status._id === 'sold' ? 'default' : 
                        status._id === 'with_employee' ? 'secondary' : 
                        'outline'
                      }>
                        {status._id.replace('_', ' ').toUpperCase()}
                      </Badge>
                      <span className="font-medium">{status.count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity Chart Placeholder */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity (Last 7 Days)</CardTitle>
                <CardDescription>Daily sales and returns overview</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dashboardData?.recentActivity.map((day) => (
                    <div key={day._id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="font-medium">{format(new Date(day._id), 'MMM dd')}</div>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <span className="flex items-center">
                            <ShoppingCart className="h-3 w-3 mr-1" />
                            {day.sales} sales
                          </span>
                          <span className="flex items-center">
                            <RefreshCw className="h-3 w-3 mr-1" />
                            {day.returns} returns
                          </span>
                        </div>
                      </div>
                      <div className="font-medium">
                        {formatCurrency(day.revenue)}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sales Analysis Tab */}
          <TabsContent value="sales" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Employees */}
              <Card>
                <CardHeader>
                  <CardTitle>Top Performing Employees</CardTitle>
                  <CardDescription>Best performing employees by revenue</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {salesData?.topEmployees.map((employee, index) => (
                      <div key={employee._id} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-sm font-medium">
                            {index + 1}
                          </div>
                          <div>
                            <div className="font-medium">{employee.employee.username}</div>
                            <div className="text-sm text-gray-500">{employee.quantity} items sold</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{formatCurrency(employee.revenue)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Top Customers */}
              <Card>
                <CardHeader>
                  <CardTitle>Top Customers</CardTitle>
                  <CardDescription>Highest value customers by spending</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {salesData?.topCustomers.map((customer, index) => (
                      <div key={customer._id} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600 text-sm font-medium">
                            {index + 1}
                          </div>
                          <div>
                            <div className="font-medium">{customer.customer.name}</div>
                            <div className="text-sm text-gray-500">
                              {customer.customer.mobile} • {customer.quantity} purchases
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{formatCurrency(customer.revenue)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Item Type Performance */}
              <Card>
                <CardHeader>
                  <CardTitle>Item Type Performance</CardTitle>
                  <CardDescription>Best selling item types by revenue</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {salesData?.itemTypePerformance.map((itemType, index) => (
                      <div key={itemType._id} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 text-sm font-medium">
                            {index + 1}
                          </div>
                          <div>
                            <div className="font-medium">{itemType.itemType.name}</div>
                            <div className="text-sm text-gray-500">{itemType.quantity} units sold</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{formatCurrency(itemType.revenue)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Sales Timeline */}
              <Card>
                <CardHeader>
                  <CardTitle>Sales Timeline</CardTitle>
                  <CardDescription>Sales performance over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {salesData?.timeline.map((period) => (
                      <div key={period._id} className="flex items-center justify-between p-2 border rounded">
                        <div>
                          <div className="font-medium">{period._id}</div>
                          <div className="text-sm text-gray-500">{period.quantity} items</div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{formatCurrency(period.revenue || 0)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Returns Analysis Tab */}
          <TabsContent value="returns" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Returns Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Returns Summary</CardTitle>
                  <CardDescription>Overview of returns in selected period</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>Total Returns:</span>
                      <span className="font-medium">{returnsData?.summary.totalReturns || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Value:</span>
                      <span className="font-medium">{formatCurrency(returnsData?.summary.totalReturnValue || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Average Return Value:</span>
                      <span className="font-medium">{formatCurrency(returnsData?.summary.averageReturnValue || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Customers with Returns:</span>
                      <span className="font-medium">{returnsData?.summary.uniqueCustomersCount || 0}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Returns by Employee */}
              <Card>
                <CardHeader>
                  <CardTitle>Returns by Employee</CardTitle>
                  <CardDescription>Employees processing most returns</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {returnsData?.employeeReturns.map((employee, index) => (
                      <div key={employee._id} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 text-sm font-medium">
                            {index + 1}
                          </div>
                          <div>
                            <div className="font-medium">{employee.employee.username}</div>
                            <div className="text-sm text-gray-500">{employee.quantity} returns processed</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{formatCurrency(employee.revenue)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Returns by Customer */}
              <Card>
                <CardHeader>
                  <CardTitle>Returns by Customer</CardTitle>
                  <CardDescription>Customers with most returns</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {returnsData?.customerReturns.map((customer, index) => (
                      <div key={customer._id} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center text-red-600 text-sm font-medium">
                            {index + 1}
                          </div>
                          <div>
                            <div className="font-medium">{customer.customer.name}</div>
                            <div className="text-sm text-gray-500">
                              {customer.customer.mobile} • {customer.quantity} returns
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{formatCurrency(customer.revenue)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Returns Timeline */}
              <Card>
                <CardHeader>
                  <CardTitle>Returns Timeline</CardTitle>
                  <CardDescription>Returns pattern over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {returnsData?.timeline.map((period) => (
                      <div key={period._id} className="flex items-center justify-between p-2 border rounded">
                        <div>
                          <div className="font-medium">{period._id}</div>
                          <div className="text-sm text-gray-500">{period.quantity} returns</div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{formatCurrency(period.value || 0)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Performers Overall */}
              <Card>
                <CardHeader>
                  <CardTitle>Top Performers</CardTitle>
                  <CardDescription>Best performing employees overall</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {dashboardData?.topPerformers.map((performer, index) => (
                      <div key={performer._id} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center text-yellow-600 text-sm font-medium">
                            {index + 1}
                          </div>
                          <div>
                            <div className="font-medium">{performer.employee.username}</div>
                            <div className="text-sm text-gray-500">{performer.sales || performer.quantity} sales</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{formatCurrency(performer.revenue)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Performance Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle>Performance Metrics</CardTitle>
                  <CardDescription>Key performance indicators</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>Average Sale Value:</span>
                      <span className="font-medium">
                        {formatCurrency(salesData?.summary.averagePrice || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Return Rate:</span>
                      <span className="font-medium">
                        {salesData?.summary.totalQuantity 
                          ? ((returnsData?.summary.totalReturns || 0) / salesData.summary.totalQuantity * 100).toFixed(1)
                          : 0
                        }%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Customer Retention:</span>
                      <span className="font-medium">
                        {returnsData?.summary.uniqueCustomersCount || 0} / {salesData?.summary.uniqueCustomersCount || 0}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Average Return Value:</span>
                      <span className="font-medium">
                        {formatCurrency(returnsData?.summary.averageReturnValue || 0)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

export default function OwnerAnalyticsPage() {
  return (
    <ProtectedRoute allowedRoles={[UserRole.OWNER]}>
      <DashboardLayout>
        <OwnerAnalyticsContent />
      </DashboardLayout>
    </ProtectedRoute>
  );
}