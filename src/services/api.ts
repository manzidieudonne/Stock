import {
  User,
  Product,
  Category,
  Supplier,
  Transaction,
  DashboardSummary,
} from '../types';

const TOKEN_KEY = 'stockflow_token';
const USER_KEY = 'stockflow_user';

export const getStoredToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

export const getStoredUser = (): User | null => {
  const userStr = localStorage.getItem(USER_KEY);
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
};

export const setStoredAuth = (token: string, user: User) => {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const clearStoredAuth = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'An error occurred while processing your request');
  }

  return data as T;
}

export const api = {
  // Auth
  async login(email: string, password: string): Promise<{ token: string; user: User; message: string }> {
    const data = await request<{ token: string; user: User; message: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setStoredAuth(data.token, data.user);
    return data;
  },

  async register(name: string, email: string, password: string, role: 'Admin' | 'User' = 'User'): Promise<{ token: string; user: User; message: string }> {
    const data = await request<{ token: string; user: User; message: string }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, role }),
    });
    setStoredAuth(data.token, data.user);
    return data;
  },

  async getMe(): Promise<User> {
    return request<User>('/api/auth/me');
  },

  async updateProfile(payload: { name?: string; currentPassword?: string; newPassword?: string }): Promise<{ user: User; message: string }> {
    const data = await request<{ user: User; message: string }>('/api/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    const current = getStoredUser();
    if (current) {
      setStoredAuth(getStoredToken() || '', { ...current, ...data.user });
    }
    return data;
  },

  // Products
  async getProducts(params?: { search?: string; category?: string; status?: string; sortBy?: string; order?: 'asc' | 'desc' }): Promise<Product[]> {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.category) query.set('category', params.category);
    if (params?.status) query.set('status', params.status);
    if (params?.sortBy) query.set('sortBy', params.sortBy);
    if (params?.order) query.set('order', params.order);
    return request<Product[]>(`/api/products?${query.toString()}`);
  },

  async getProduct(id: string): Promise<{ product: Product; transactions: Transaction[] }> {
    return request<{ product: Product; transactions: Transaction[] }>(`/api/products/${id}`);
  },

  async createProduct(product: Omit<Product, '_id' | 'createdAt'>): Promise<{ product: Product; message: string }> {
    return request<{ product: Product; message: string }>('/api/products', {
      method: 'POST',
      body: JSON.stringify(product),
    });
  },

  async updateProduct(id: string, product: Partial<Product>): Promise<{ product: Product; message: string }> {
    return request<{ product: Product; message: string }>(`/api/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(product),
    });
  },

  async deleteProduct(id: string): Promise<{ message: string; id: string }> {
    return request<{ message: string; id: string }>(`/api/products/${id}`, {
      method: 'DELETE',
    });
  },

  // Transactions
  async getTransactions(params?: { type?: 'IN' | 'OUT'; search?: string; limit?: number }): Promise<Transaction[]> {
    const query = new URLSearchParams();
    if (params?.type) query.set('type', params.type);
    if (params?.search) query.set('search', params.search);
    if (params?.limit) query.set('limit', params.limit.toString());
    return request<Transaction[]>(`/api/transactions?${query.toString()}`);
  },

  async createTransaction(payload: {
    productId: string;
    type: 'IN' | 'OUT';
    quantity: number;
    costPrice?: number;
    unitCost?: number;
    sellingPrice?: number;
    unitPrice?: number;
    updateProductCost?: boolean;
    notes?: string;
  }): Promise<{ transaction: Transaction; product: any; message: string }> {
    return request<{ transaction: Transaction; product: any; message: string }>('/api/transactions', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // Categories
  async getCategories(): Promise<Category[]> {
    return request<Category[]>('/api/categories');
  },

  async createCategory(category: { name: string; description?: string }): Promise<{ category: Category; message: string }> {
    return request<{ category: Category; message: string }>('/api/categories', {
      method: 'POST',
      body: JSON.stringify(category),
    });
  },

  async updateCategory(id: string, category: { name?: string; description?: string }): Promise<{ category: Category; message: string }> {
    return request<{ category: Category; message: string }>(`/api/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(category),
    });
  },

  async deleteCategory(id: string): Promise<{ message: string }> {
    return request<{ message: string }>(`/api/categories/${id}`, {
      method: 'DELETE',
    });
  },

  // Suppliers
  async getSuppliers(): Promise<Supplier[]> {
    return request<Supplier[]>('/api/suppliers');
  },

  async createSupplier(supplier: { name: string; email: string; phone: string; address?: string }): Promise<{ supplier: Supplier; message: string }> {
    return request<{ supplier: Supplier; message: string }>('/api/suppliers', {
      method: 'POST',
      body: JSON.stringify(supplier),
    });
  },

  async updateSupplier(id: string, supplier: Partial<Supplier>): Promise<{ supplier: Supplier; message: string }> {
    return request<{ supplier: Supplier; message: string }>(`/api/suppliers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(supplier),
    });
  },

  async deleteSupplier(id: string): Promise<{ message: string }> {
    return request<{ message: string }>(`/api/suppliers/${id}`, {
      method: 'DELETE',
    });
  },

  // Users (Admin only)
  async getUsers(): Promise<User[]> {
    return request<User[]>('/api/users');
  },

  async createUser(user: { name: string; email: string; password: string; role: 'Admin' | 'User' }): Promise<{ user: User; message: string }> {
    return request<{ user: User; message: string }>('/api/users', {
      method: 'POST',
      body: JSON.stringify(user),
    });
  },

  async updateUserRole(id: string, role: 'Admin' | 'User'): Promise<{ user: User; message: string }> {
    return request<{ user: User; message: string }>(`/api/users/${id}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    });
  },

  async deleteUser(id: string): Promise<{ message: string }> {
    return request<{ message: string }>(`/api/users/${id}`, {
      method: 'DELETE',
    });
  },

  // Analytics
  async getDashboardAnalytics(): Promise<DashboardSummary> {
    return request<DashboardSummary>('/api/analytics/dashboard');
  },

  // Health
  async getHealth(): Promise<any> {
    return request<any>('/api/health');
  },
};
