import React from 'react';
import {
  Menu,
  X,
  Bell,
  Database,
  ShieldCheck,
  User as UserIcon,
  LogOut,
  ArrowRightLeft,
  LayoutDashboard,
  Package,
  FolderTree,
  Truck,
  FileSpreadsheet,
  AlertTriangle,
  Users,
  Boxes,
  PanelLeftClose,
  PanelLeft,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  onToggleSidebar: () => void;
  sidebarOpen: boolean;
  activeTab: string;
  lowStockCount: number;
  onSelectTab: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onToggleSidebar,
  sidebarOpen,
  activeTab,
  lowStockCount,
  onSelectTab,
}) => {
  const { user, isAdmin, logout, switchDemoAccount } = useAuth();

  const getTabTitle = (tab: string) => {
    switch (tab) {
      case 'dashboard': return 'Operational Dashboard & Analytics';
      case 'inventory': return 'Inventory & Stock Management';
      case 'movements': return 'Stock Movements & Transaction Logs';
      case 'categories': return 'Categories Directory';
      case 'suppliers': return 'Suppliers Directory';
      case 'users': return 'User Management (RBAC)';
      case 'alerts': return 'Low Stock & Reorder Alerts';
      case 'reports': return 'Valuation & Stock Reports';
      case 'profile': return 'User Profile & Security';
      default: return 'StockFlow Manager';
    }
  };

  const topNavTabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'inventory', label: 'Inventory', icon: Package },
    { id: 'movements', label: 'Movements', icon: ArrowRightLeft },
    { id: 'alerts', label: 'Alerts', icon: AlertTriangle, badge: lowStockCount > 0 ? lowStockCount : null },
    { id: 'categories', label: 'Categories', icon: FolderTree },
    { id: 'suppliers', label: 'Suppliers', icon: Truck },
    { id: 'reports', label: 'Reports', icon: FileSpreadsheet },
    ...(isAdmin ? [{ id: 'users', label: 'Users', icon: Users, badge: 'Admin' }] : []),
  ];

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200 transition-colors shadow-xs">
      {/* Top Main Navigation Bar */}
      <div className="px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4">
        {/* Left side: Logo brand mark + sidebar toggle + title */}
        <div className="flex items-center gap-3">
          <button
            id="btn-sidebar-toggle"
            onClick={onToggleSidebar}
            className={`p-2 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-slate-300 ${
              sidebarOpen
                ? 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
            title={sidebarOpen ? 'Hide sidebar menu' : 'Open sidebar menu (Sidebar is hidden)'}
            aria-label={sidebarOpen ? 'Hide sidebar menu' : 'Open sidebar menu'}
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          {/* Brand Logo & Current View */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Boxes className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-slate-900 tracking-tight">StockFlow</span>
                <span className="text-slate-300 text-xs hidden sm:inline">•</span>
                <h1 className="text-xs sm:text-sm font-semibold text-slate-700 truncate max-w-[200px] sm:max-w-xs md:max-w-md">
                  {getTabTitle(activeTab)}
                </h1>
              </div>
            </div>
          </div>
        </div>

        {/* Right side: quick switcher, low stock bell, DB status, user badge */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Demo Role Switcher */}
          <div className="hidden md:flex items-center bg-slate-100 rounded-lg p-1 border border-slate-200 text-xs">
            <span className="text-slate-500 font-medium px-2 flex items-center gap-1">
              <ArrowRightLeft className="w-3 h-3 text-slate-400" />
              Role:
            </span>
            <button
              id="btn-switch-admin"
              onClick={() => switchDemoAccount('Admin')}
              className={`px-2.5 py-1 rounded font-medium transition-all ${
                isAdmin
                  ? 'bg-violet-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Admin
            </button>
            <button
              id="btn-switch-staff"
              onClick={() => switchDemoAccount('User')}
              className={`px-2.5 py-1 rounded font-medium transition-all ${
                !isAdmin
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Staff
            </button>
          </div>

          {/* Database Engine Status Pill */}
          <div
            className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200"
            title="Database Active: Mongoose ODM Engine"
          >
            <Database className="w-3.5 h-3.5 text-emerald-600" />
            <span>MERN ODM Connected</span>
          </div>

          {/* Low Stock Alert Bell */}
          <button
            id="btn-nav-alerts"
            onClick={() => onSelectTab('alerts')}
            className="relative p-2 rounded-lg text-slate-600 hover:text-amber-700 hover:bg-amber-50 transition-colors"
            title={`${lowStockCount} Low Stock Warnings`}
          >
            <Bell className="w-5 h-5" />
            {lowStockCount > 0 && (
              <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white shadow-xs animate-pulse">
                {lowStockCount}
              </span>
            )}
          </button>

          {/* User Profile Card */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
            <button
              id="btn-user-profile-tab"
              onClick={() => onSelectTab('profile')}
              className="flex items-center gap-2.5 text-left p-1 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                isAdmin ? 'bg-violet-100 text-violet-700 border border-violet-200' : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
              }`}>
                {user?.name?.slice(0, 2).toUpperCase() || 'US'}
              </div>
              <div className="hidden sm:block">
                <div className="text-xs font-semibold text-slate-800 leading-tight">
                  {user?.name || 'Authorized User'}
                </div>
                <div className="flex items-center gap-1 text-[11px]">
                  {isAdmin ? (
                    <span className="inline-flex items-center gap-0.5 font-medium text-violet-700">
                      <ShieldCheck className="w-3 h-3" /> Admin
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-0.5 font-medium text-emerald-700">
                      <UserIcon className="w-3 h-3" /> Staff User
                    </span>
                  )}
                </div>
              </div>
            </button>

            {/* Logout button */}
            <button
              id="btn-logout"
              onClick={logout}
              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Horizontal Tab Navigation Bar (Full screen width, sidebar hidden) */}
      <div className="px-4 sm:px-6 py-1.5 bg-slate-50 border-t border-slate-200/80 flex items-center justify-between gap-3 overflow-x-auto">
        <nav className="flex items-center gap-1 sm:gap-1.5 shrink-0" aria-label="Horizontal tabs">
          {topNavTabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                id={`top-tab-${tab.id}`}
                onClick={() => onSelectTab(tab.id)}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                <span>{tab.label}</span>
                {tab.badge !== null && tab.badge !== undefined && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      isActive
                        ? 'bg-indigo-800 text-white'
                        : typeof tab.badge === 'number'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-violet-100 text-violet-700'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Status Pill */}
        <div className="hidden md:flex items-center gap-2 text-[11px] text-slate-500 shrink-0">
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-200/70 text-slate-600 font-medium">
            {sidebarOpen ? (
              <>
                <PanelLeft className="w-3 h-3 text-indigo-600" />
                Sidebar Open
              </>
            ) : (
              <>
                <PanelLeftClose className="w-3 h-3 text-slate-400" />
                Sidebar Hidden
              </>
            )}
          </span>
          <button
            id="btn-quick-toggle-sidebar"
            onClick={onToggleSidebar}
            className="text-indigo-600 hover:text-indigo-800 font-medium text-xs hover:underline cursor-pointer"
          >
            {sidebarOpen ? 'Hide' : 'Show drawer'}
          </button>
        </div>
      </div>
    </header>
  );
};
