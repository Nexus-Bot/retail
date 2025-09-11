"use client";

import React, { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
// import { useRoleAccess } from '@/components/auth/protected-route';
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Package,
  Home,
  Users,
  Settings,
  LogOut,
  Menu,
  ShoppingBag,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  roles?: string[];
}

const getNavigationForRole = (role: string): NavItem[] => {
  const baseNavigation = [
    { name: "Dashboard", href: "/dashboard", icon: Home },
  ];

  if (role === "master") {
    return [
      ...baseNavigation,
      { name: "All Agencies", href: "/dashboard/agencies", icon: Package },
      { name: "All Users", href: "/dashboard/users", icon: Users },
    ];
  }

  if (role === "owner") {
    return [
      ...baseNavigation,
      { name: "Items", href: "/dashboard/items", icon: Package },
      { name: "Item Types", href: "/dashboard/item-types", icon: Package },
      { name: "Employees", href: "/dashboard/employees", icon: Users },
      { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
      { name: "Settings", href: "/dashboard/settings", icon: Settings },
    ];
  }

  if (role === "employee") {
    return [
      ...baseNavigation,
      { name: "My Items", href: "/dashboard/my-items", icon: ShoppingBag },
      { name: "Settings", href: "/dashboard/settings", icon: Settings },
    ];
  }

  return baseNavigation;
};

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuth();
  // Role access hook available if needed\n  // const { hasRole, isOwner, isEmployee } = useRoleAccess();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const navigation = getNavigationForRole(user?.role || "");

  const NavItems = ({ mobile = false }: { mobile?: boolean }) => (
    <nav className="space-y-1">
      {navigation.map((item) => {
        const isActive = pathname === item.href;
        const Icon = item.icon;

        return (
          <button
            key={item.name}
            onClick={() => {
              router.push(item.href);
              if (mobile) setSidebarOpen(false);
            }}
            className={cn(
              "w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg text-left transition-colors",
              isActive
                ? "bg-indigo-600 text-white"
                : "text-gray-700 hover:text-indigo-600 hover:bg-indigo-50"
            )}
          >
            <Icon className="mr-3 h-5 w-5" />
            {item.name}
            {item.badge && (
              <span
                className={cn(
                  "ml-auto inline-block px-2 py-1 text-xs rounded-full",
                  isActive
                    ? "bg-indigo-500 text-white"
                    : "bg-gray-200 text-gray-600"
                )}
              >
                {item.badge}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );

  const UserMenu = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-indigo-600 text-white">
              {user?.username?.charAt(0)?.toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <div className="flex flex-col space-y-1 p-2">
          <p className="text-sm font-medium">{user?.username}</p>
          <p className="text-xs text-muted-foreground">
            {user?.role?.toUpperCase()} • {user?.agency?.name || "No Agency"}
          </p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push("/dashboard/settings")}>
          <Settings className="mr-2 h-4 w-4" />
          Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="text-red-600">
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile header */}
      <div className="lg:hidden">
        <div className="flex items-center justify-between h-16 px-4 bg-white border-b border-gray-200">
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 p-0">
              <SheetHeader className="p-6 pb-4 border-b">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                    <Package className="h-5 w-5 text-white" />
                  </div>
                  <SheetTitle>Nexus Retail</SheetTitle>
                </div>
              </SheetHeader>
              <div className="p-6">
                <NavItems mobile />
              </div>
            </SheetContent>
          </Sheet>

          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Package className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-lg font-semibold text-gray-900">
              Nexus Retail
            </h1>
          </div>

          <UserMenu />
        </div>
      </div>

      <div className="lg:flex">
        {/* Desktop sidebar */}
        <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0">
          <div className="flex flex-col flex-grow bg-white border-r border-gray-200">
            {/* Logo */}
            <div className="flex items-center h-16 px-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                  <Package className="h-5 w-5 text-white" />
                </div>
                <h1 className="text-lg font-semibold text-gray-900">
                  Nexus Retail
                </h1>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex flex-col flex-1 p-6 overflow-y-auto">
              <NavItems />
            </div>

            {/* User section */}
            <div className="flex items-center justify-between p-6 border-t border-gray-200">
              <div className="flex items-center space-x-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-indigo-600 text-white">
                    {user?.username?.charAt(0)?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {user?.username}
                  </p>
                  <p className="text-xs text-gray-500">
                    {user?.role?.toUpperCase()}
                  </p>
                </div>
              </div>
              <UserMenu />
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="lg:pl-64 flex flex-col flex-1">
          <main className="flex-1 pb-20 lg:pb-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
