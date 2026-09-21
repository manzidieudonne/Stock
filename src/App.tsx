import React, { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { api } from './services/api';
import {
  Product,
  Transaction,
  Category,
  Supplier,
  User,
  DashboardSummary,
} from './types';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { InventoryView } from './components/InventoryView';
import { StockMovementView } from './components/StockMovementView';
import { CategoriesView } from './components/CategoriesView';
import { SuppliersView } from './components/SuppliersView';
import { LowStockAlertsView } from './components/LowStockAlertsView';
import { ReportsView } from './components/ReportsView';
import { UsersView } from './components/UsersView';
import { ProfileView } from './components/ProfileView';
import { AuthScreen } from './components/AuthScreen';
import { QuickMovementModal } from './components/QuickMovementModal';
import { Loader2, RefreshCw, AlertTriangle } from 'lucide-react';

export type NavTab =
  | 'dashboard'
  | 'inventory'
  | 'movements'
  | 'categories'
  | 'suppliers'
  | 'alerts'
  | 'reports'
  | 'users'
  | 'profile';

const AppContent: React.FC = () => {
  const { user, token, isLoading, isAdmin } = useAuth();

  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false); // Sidebar menu is hidden by default
  const [inventoryCategoryFilter, setInventoryCategoryFilter] = useState<string>('All');
  const [autoOpenCreateProduct, setAutoOpenCreateProduct] = useState(false);

  // Application Data States
  const [products, setProducts] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [dashboard, setDashboard] = useState<DashboardSummary | null>(null);

  const [loadingData, setLoadingData] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Quick Movement Modal
  const [isQuickMovementOpen, setIsQuickMovementOpen] = useState(false);
  const [quickProductId, setQuickProductId] = useState<string | undefined>();
  const [quickType, setQuickType] = useState<'IN' | 'OUT'>('IN');

  // Fetch all primary datasets
  const refreshAllData = useCallback(async () => {
    if (!token) return;
    setLoadingData(true);
    setFetchError(null);

    try {
      const [prodRes, catRes, suppRes, dashRes, txnRes] = await Promise.all([
        api.getProducts(),
        api.getCategories(),
        api.getSuppliers(),
        api.getDashboardAnalytics(),
        api.getTransactions(),
      ]);

      setProducts(prodRes || []);
      setCategories(catRes || []);
      setSuppliers(suppRes || []);
      setDashboard(dashRes);
      setTransactions(txnRes || []);

      // If user is admin, also fetch the user list
      if (isAdmin) {
        try {
          const userList = await api.getUsers();
          setUsers(userList || []);
        } catch {
          // Non-blocking if forbidden
        }
      }
    } catch (err: any) {
      console.error('Failed to load system data:', err);
      setFetchError(err.message || 'Error connecting to StockFlow API service.');
    } finally {
      setLoadingData(false);
    }
  }, [token, isAdmin]);

  // Initial load on authentication
  useEffect(() => {
    if (token) {
      refreshAllData();
    }
  }, [token, refreshAllData]);

  // Handle Quick Movement Open
  const handleOpenQuickMovement = (productId?: string, type: 'IN' | 'OUT' = 'IN') => {
    setQuickProductId(productId);
    setQuickType(type);
    setIsQuickMovementOpen(true);
  };

  // Record Stock Movement Action
  const handleRecordMovement = async (payload: {
    productId: string;
    type: 'IN' | 'OUT';
    quantity: number;
    costPrice?: number;
    sellingPrice?: number;
    updateProductCost?: boolean;
    notes?: string;
  }) => {
    await api.createTransaction(payload);
    await refreshAllData();
  };

  // Product CRUD
  const handleCreateProduct = async (productData: Omit<Product, '_id' | 'createdAt'>) => {
    await api.createProduct(productData);
    setAutoOpenCreateProduct(false);
    await refreshAllData();
  };

  const handleUpdateProduct = async (id: string, productData: Partial<Product>) => {
    await api.updateProduct(id, productData);
    await refreshAllData();
  };

  const handleDeleteProduct = async (id: string) => {
    await api.deleteProduct(id);
    await refreshAllData();
  };

  // Category CRUD
  const handleCreateCategory = async (cat: { name: string; description?: string }) => {
    await api.createCategory(cat);
    await refreshAllData();
  };

  const handleUpdateCategory = async (id: string, cat: { name?: string; description?: string }) => {
    await api.updateCategory(id, cat);
    await refreshAllData();
  };

  const handleDeleteCategory = async (id: string) => {
    await api.deleteCategory(id);
    await refreshAllData();
  };

  // Supplier CRUD
  const handleCreateSupplier = async (s: { name: string; email: string; phone: string; address?: string }) => {
    await api.createSupplier(s);
    await refreshAllData();
  };

  const handleUpdateSupplier = async (id: string, s: Partial<Supplier>) => {
    await api.updateSupplier(id, s);
    await refreshAllData();
  };

  const handleDeleteSupplier = async (id: string) => {
    await api.deleteSupplier(id);
    await refreshAllData();
  };

  // User Admin CRUD
  const handleCreateUser = async (userData: { name: string; email: string; password: string; role: 'Admin' | 'User' }) => {
    await api.createUser(userData);
    const userList = await api.getUsers();
    setUsers(userList || []);
  };

  const handleUpdateUserRole = async (id: string, role: 'Admin' | 'User') => {
    await api.updateUserRole(id, role);
    const userList = await api.getUsers();
    setUsers(userList || []);
  };

  const handleDeleteUser = async (id: string) => {
    await api.deleteUser(id);
    const userList = await api.getUsers();
    setUsers(userList || []);
  };

  // Navigation handlers from components
  const handleNavigateToCategoryItems = (categoryName: string) => {
    setInventoryCategoryFilter(categoryName);
    setAutoOpenCreateProduct(false);
    setActiveTab('inventory');
  };

  const handleNavigateToSupplierItems = (_supplierName: string) => {
    setInventoryCategoryFilter('All');
    setAutoOpenCreateProduct(false);
    setActiveTab('inventory');
  };

  // If initial auth check is running
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center text-slate-300 space-y-3">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-500" />
          <p className="text-sm font-medium">Initializing StockFlow session...</p>
        </div>
      </div>
    );
  }

  // If user is not authenticated, show Auth Screen
  if (!user || !token) {
    return <AuthScreen />;
  }

  const lowStockCount = products.filter(p => p.quantity <= p.minStock).length;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col antialiased text-slate-900">
      {/* Top Navigation Bar with Horizontal Tabs & Sidebar Toggle */}
      <Navbar
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        sidebarOpen={sidebarOpen}
        activeTab={activeTab}
        lowStockCount={lowStockCount}
        onSelectTab={(tab: string) => {
          if (tab === 'inventory') setInventoryCategoryFilter('All');
          setActiveTab(tab as NavTab);
        }}
      />

      {/* Main Container with Full-Width Workspace & Slide-over Sidebar Drawer */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Slide-over Sidebar (Hidden by default) */}
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          activeTab={activeTab}
          onSelectTab={(tab: string) => {
            if (tab === 'inventory') {
              setInventoryCategoryFilter('All');
              setAutoOpenCreateProduct(false);
            }
            setActiveTab(tab as NavTab);
          }}
          lowStockCount={lowStockCount}
        />

        {/* Dynamic Workspace Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
          {/* Error Banner if API connection failed */}
          {fetchError && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{fetchError}</span>
              </div>
              <button
                onClick={refreshAllData}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-rose-200 rounded-lg font-semibold text-rose-700 hover:bg-rose-50"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Retry
              </button>
            </div>
          )}

          {/* Render Active View */}
          {activeTab === 'dashboard' && (
            <Dashboard
              data={dashboard}
              loading={loadingData}
              onSelectTab={(tab: string) => {
                if (tab === 'inventory') setInventoryCategoryFilter('All');
                setActiveTab(tab as NavTab);
              }}
              onOpenQuickMovement={(prodId?: string, type?: 'IN' | 'OUT') => handleOpenQuickMovement(prodId, type)}
              onOpenCreateProduct={() => {
                setAutoOpenCreateProduct(true);
                setActiveTab('inventory');
              }}
            />
          )}

          {activeTab === 'inventory' && (
            <InventoryView
              products={products}
              categories={categories}
              suppliers={suppliers}
              onRefresh={refreshAllData}
              onOpenMovement={(productId: string, type?: 'IN' | 'OUT') => handleOpenQuickMovement(productId, type)}
              onCreateProduct={handleCreateProduct}
              onUpdateProduct={handleUpdateProduct}
              onDeleteProduct={handleDeleteProduct}
              initialCategory={inventoryCategoryFilter}
              autoOpenCreate={autoOpenCreateProduct}
            />
          )}

          {activeTab === 'movements' && (
            <StockMovementView
              products={products}
              transactions={transactions}
              onRecordMovement={handleRecordMovement}
              preselectedProductId={quickProductId}
              preselectedType={quickType}
            />
          )}

          {activeTab === 'categories' && (
            <CategoriesView
              categories={categories}
              onCreateCategory={handleCreateCategory}
              onUpdateCategory={handleUpdateCategory}
              onDeleteCategory={handleDeleteCategory}
              onSelectCategoryFilter={handleNavigateToCategoryItems}
            />
          )}

          {activeTab === 'suppliers' && (
            <SuppliersView
              suppliers={suppliers}
              onCreateSupplier={handleCreateSupplier}
              onUpdateSupplier={handleUpdateSupplier}
              onDeleteSupplier={handleDeleteSupplier}
              onFilterBySupplier={handleNavigateToSupplierItems}
            />
          )}

          {activeTab === 'alerts' && (
            <LowStockAlertsView
              products={products}
              onRestock={prodId => handleOpenQuickMovement(prodId, 'IN')}
              onSelectCategoryFilter={handleNavigateToCategoryItems}
            />
          )}

          {activeTab === 'reports' && (
            <ReportsView
              products={products}
              categories={categories}
              transactions={transactions}
              dashboard={dashboard}
            />
          )}

          {activeTab === 'users' && isAdmin && (
            <UsersView
              users={users}
              onCreateUser={handleCreateUser}
              onUpdateRole={handleUpdateUserRole}
              onDeleteUser={handleDeleteUser}
            />
          )}

          {activeTab === 'profile' && <ProfileView />}
        </main>
      </div>

      {/* Global Quick Movement Modal (Accessible from any screen) */}
      <QuickMovementModal
        isOpen={isQuickMovementOpen}
        onClose={() => setIsQuickMovementOpen(false)}
        products={products}
        initialProductId={quickProductId}
        initialType={quickType}
        onRecordMovement={handleRecordMovement}
      />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
