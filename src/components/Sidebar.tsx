import React from 'react';
import {
  LayoutDashboard,
  Package,
  ArrowLeftRight,
  FolderTree,
  Truck,
  Users,
  AlertTriangle,
  FileSpreadsheet,
  Settings,
  ShieldCheck,
  X,
  Boxes,
  PanelLeftClose,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: string;
  onSelectTab: (tab: string) => void;
  lowStockCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  activeTab,
  onSelectTab,
  lowStockCount,
}) => {
  const { user, isAdmin } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, badge: null },
    { id: 'inventory', label: 'Inventory Items', icon: Package, badge: null },
    { id: 'movements', label: 'Stock Movements', icon: ArrowLeftRight, badge: null },
    { id: 'alerts', label: 'Low Stock Alerts', icon: AlertTriangle, badge: lowStockCount > 0 ? lowStockCount : null, alertColor: 'bg-amber-100 text-amber-800' },
    { id: 'categories', label: 'Categories', icon: FolderTree, badge: null },
    { id: 'suppliers', label: 'Suppliers', icon: Truck, badge: null },
    { id: 'reports', label: 'Reports & Export', icon: FileSpreadsheet, badge: null },
    ...(isAdmin ? [{ id: 'users', label: 'User Management', icon: Users, badge: 'Admin', alertColor: 'bg-violet-100 text-violet-700' }] : []),
    { id: 'profile', label: 'My Profile', icon: Settings, badge: null },
  ];

  return (
    <>
      {/* Backdrop overlay when sidebar is open */}
      <div
        id="sidebar-backdrop"
        onClick={onClose}
        className={`fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        aria-hidden="true"
      />

      {/* Slide-over Sidebar Drawer */}
      <aside
        id="sidebar-drawer"
        aria-label="Sidebar navigation"
        className={`fixed inset-y-0 left-0 z-50 flex flex-col w-72 max-w-[85vw] bg-slate-900 text-slate-300 border-r border-slate-800 shadow-2xl transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full pointer-events-none'
        }`}
      >
        {/* Brand Header & Close Button */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shrink-0 shadow-md shadow-indigo-900/30">
              <Boxes className="w-6 h-6" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-base text-white tracking-tight leading-none">
                StockFlow
              </span>
              <span className="text-[11px] font-medium text-indigo-400 mt-1">
                MERN Inventory Pro
              </span>
            </div>
          </div>
          <button
            id="btn-close-sidebar"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Hide sidebar menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation List */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1.5">
          <div className="px-3 pb-2 text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
            Menu Navigation
          </div>
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                id={`nav-item-${item.id}`}
                onClick={() => {
                  onSelectTab(item.id);
                  onClose();
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/70'
                }`}
              >
                <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span className="flex-1 text-left truncate">{item.label}</span>
                {item.badge !== null && (
                  <span
                    className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                      item.alertColor || 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Hide Sidebar Quick Action & User Profile Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/40">
          <button
            id="btn-hide-sidebar-action"
            onClick={onClose}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800 transition-colors mb-3"
          >
            <PanelLeftClose className="w-4 h-4" />
            Hide Sidebar Menu
          </button>

          <div className="flex items-center gap-3 p-2 rounded-xl bg-slate-900 border border-slate-800">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
              isAdmin ? 'bg-violet-900/60 text-violet-300 border border-violet-700/40' : 'bg-emerald-900/60 text-emerald-300 border border-emerald-700/40'
            }`}>
              {user?.name?.slice(0, 2).toUpperCase() || 'ST'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate leading-tight">
                {user?.name || 'StockFlow User'}
              </p>
              <p className="text-[11px] text-slate-400 truncate flex items-center gap-1 mt-0.5">
                {isAdmin ? (
                  <span className="text-violet-400 font-medium flex items-center gap-0.5">
                    <ShieldCheck className="w-3 h-3" /> Admin Mode
                  </span>
                ) : (
                  <span className="text-emerald-400 font-medium">Standard Staff</span>
                )}
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
