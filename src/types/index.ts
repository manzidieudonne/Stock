export interface User {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'User';
  createdAt?: string;
}

export interface Product {
  _id: string;
  name: string;
  sku: string;
  category: string;
  quantity: number;
  unitPrice: number;
  costPrice: number;
  minStock: number;
  supplier: string;
  imageUrl?: string;
  createdAt?: string;
}

export interface Category {
  _id: string;
  name: string;
  description?: string;
  productCount?: number;
  totalUnits?: number;
  createdAt?: string;
}

export interface Supplier {
  _id: string;
  name: string;
  email: string;
  phone: string;
  address?: string;
  productsCount?: number;
  createdAt?: string;
}

export interface Transaction {
  _id: string;
  product: string;
  user: string;
  type: 'IN' | 'OUT';
  quantity: number;
  notes?: string;
  timestamp: string;
  productName: string;
  productSku: string;
  category?: string;
  userName: string;
  userRole: string;
  unitCost?: number;
  unitPrice?: number;
  totalRevenue?: number;
  totalCost?: number;
  profit?: number;
  profitMargin?: number;
}

export interface DashboardSummary {
  summary: {
    totalProductTypes: number;
    totalInventoryUnits: number;
    totalInventoryValue: number;
    totalCostValue: number;
    potentialMargin: number;
    lowStockCount: number;
    outOfStockCount: number;
    totalMovements: number;
    totalInUnits: number;
    totalOutUnits: number;
    totalSalesRevenue?: number;
    totalSalesCOGS?: number;
    totalRealizedProfit?: number;
    realizedProfitMargin?: number;
    completedSalesCount?: number;
  };
  feedVsMedicine?: {
    feed: {
      itemCount: number;
      totalUnits: number;
      valuation: number;
      costBasis: number;
    };
    medicine: {
      itemCount: number;
      totalUnits: number;
      valuation: number;
      costBasis: number;
    };
  };
  topProfitableProducts?: Array<{
    name: string;
    sku: string;
    category: string;
    unitsSold: number;
    revenue: number;
    cogs: number;
    profit: number;
    margin: number;
  }>;
  categoryBreakdown: Array<{
    name: string;
    productCount: number;
    totalUnits: number;
    totalValue: number;
    totalCost?: number;
    potentialProfit?: number;
    soldUnits?: number;
    salesRevenue?: number;
    realizedProfit?: number;
  }>;
  topValueProducts?: Array<{
    id: string;
    name: string;
    sku: string;
    quantity: number;
    value: number;
  }>;
  recentMovements: Transaction[];
  lowStockList: Product[];
  outOfStockList: Product[];
  database: {
    isMongooseConnected: boolean;
    mode: string;
    recordCounts: {
      users: number;
      products: number;
      categories: number;
      suppliers: number;
      transactions: number;
    };
  };
}
