import React, { useState, useMemo } from 'react';
import {
  Package,
  Search,
  Filter,
  Plus,
  ArrowUpDown,
  Edit2,
  Trash2,
  AlertTriangle,
  ArrowLeftRight,
  ExternalLink,
  DollarSign,
  X,
  Check,
  Building2,
  Tag,
} from 'lucide-react';
import { Product, Category, Supplier } from '../types';
import { useAuth } from '../context/AuthContext';

interface InventoryViewProps {
  products: Product[];
  categories: Category[];
  suppliers: Supplier[];
  onRefresh: () => Promise<void>;
  onOpenMovement: (productId: string, type?: 'IN' | 'OUT') => void;
  onCreateProduct: (product: Omit<Product, '_id' | 'createdAt'>) => Promise<void>;
  onUpdateProduct: (id: string, product: Partial<Product>) => Promise<void>;
  onDeleteProduct: (id: string) => Promise<void>;
  initialFilter?: string;
  initialCategory?: string;
  autoOpenCreate?: boolean;
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  products,
  categories,
  suppliers,
  onRefresh,
  onOpenMovement,
  onCreateProduct,
  onUpdateProduct,
  onDeleteProduct,
  initialFilter = 'all',
  initialCategory = 'All',
  autoOpenCreate = false,
}) => {
  const { isAdmin } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [stockStatus, setStockStatus] = useState<string>(initialFilter);
  const [sortBy, setSortBy] = useState<string>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(autoOpenCreate && isAdmin);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Form states
  const [formName, setFormName] = useState('');
  const [formSku, setFormSku] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formQuantity, setFormQuantity] = useState(0);
  const [formUnitPrice, setFormUnitPrice] = useState(0);
  const [formCostPrice, setFormCostPrice] = useState(0);
  const [formMinStock, setFormMinStock] = useState(5);
  const [formSupplier, setFormSupplier] = useState('');
  const [formImageUrl, setFormImageUrl] = useState('');

  const openAddModal = () => {
    setEditingProduct(null);
    setFormName('');
    setFormSku(`SKU-${Math.floor(1000 + Math.random() * 9000)}`);
    setFormCategory(categories[0]?.name || 'Poultry Feed');
    setFormQuantity(10);
    setFormUnitPrice(45.00);
    setFormCostPrice(28.00);
    setFormMinStock(5);
    setFormSupplier(suppliers[0]?.name || 'AgriFeed Global Mills');
    setFormImageUrl('');
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setFormName(p.name);
    setFormSku(p.sku);
    setFormCategory(p.category);
    setFormQuantity(p.quantity);
    setFormUnitPrice(p.unitPrice);
    setFormCostPrice(p.costPrice);
    setFormMinStock(p.minStock);
    setFormSupplier(p.supplier);
    setFormImageUrl(p.imageUrl || '');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setIsSubmitting(true);

    try {
      if (!formName.trim()) throw new Error('Product name is required.');
      if (!formSku.trim()) throw new Error('SKU code is required.');
      if (!formCategory) throw new Error('Category is required.');
      if (!formSupplier) throw new Error('Supplier is required.');
      if (Number(formCostPrice) <= 0) {
        throw new Error('Cost Price ($) is mandatory when adding stock and must be greater than $0.00.');
      }
      if (Number(formUnitPrice) <= 0) {
        throw new Error('Selling Price ($) is required and must be greater than $0.00.');
      }

      const payload = {
        name: formName.trim(),
        sku: formSku.trim().toUpperCase(),
        category: formCategory,
        quantity: Number(formQuantity),
        unitPrice: Number(formUnitPrice),
        costPrice: Number(formCostPrice),
        minStock: Number(formMinStock),
        supplier: formSupplier,
        imageUrl: formImageUrl.trim(),
      };

      if (editingProduct) {
        await onUpdateProduct(editingProduct._id, payload);
      } else {
        await onCreateProduct(payload);
      }
      setIsModalOpen(false);
      await onRefresh();
    } catch (err: any) {
      setFormError(err.message || 'Failed to save product');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!productToDelete) return;
    setIsSubmitting(true);
    try {
      await onDeleteProduct(productToDelete._id);
      setProductToDelete(null);
      await onRefresh();
    } catch (err: any) {
      alert(err.message || 'Failed to delete product');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter & Sort computation
  const filteredProducts = useMemo(() => {
    let list = [...products];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.supplier.toLowerCase().includes(q)
      );
    }

    if (selectedCategory !== 'All') {
      list = list.filter(p => p.category.toLowerCase() === selectedCategory.toLowerCase());
    }

    if (stockStatus === 'low') {
      list = list.filter(p => p.quantity <= p.minStock && p.quantity > 0);
    } else if (stockStatus === 'out') {
      list = list.filter(p => p.quantity === 0);
    } else if (stockStatus === 'in-stock') {
      list = list.filter(p => p.quantity > p.minStock);
    }

    list.sort((a: any, b: any) => {
      let valA = a[sortBy];
      let valB = b[sortBy];
      if (typeof valA === 'string') {
        return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return sortOrder === 'asc' ? ((valA ?? 0) - (valB ?? 0)) : ((valB ?? 0) - (valA ?? 0));
    });

    return list;
  }, [products, searchQuery, selectedCategory, stockStatus, sortBy, sortOrder]);

  return (
    <div className="space-y-6">
      {/* Control Bar: Search, Filters, Add Product */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="input-inventory-search"
              type="text"
              placeholder="Search by product name, SKU, category, or supplier..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Add Product Button (Admin only) */}
          <div className="flex items-center gap-2">
            {isAdmin ? (
              <button
                id="btn-add-product"
                onClick={openAddModal}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition-all shadow-sm shadow-indigo-600/20 shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Add Product</span>
              </button>
            ) : (
              <div className="text-xs text-slate-500 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
                Staff view • Movement logging enabled
              </div>
            )}
          </div>
        </div>

        {/* Filters and Sorting Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
          {/* Status Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-slate-500 font-medium mr-1">Status:</span>
            {[
              { id: 'all', label: 'All Items' },
              { id: 'in-stock', label: 'In Stock' },
              { id: 'low', label: 'Low Stock' },
              { id: 'out', label: 'Out of Stock' },
            ].map(pill => (
              <button
                key={pill.id}
                id={`btn-filter-${pill.id}`}
                onClick={() => setStockStatus(pill.id)}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                  stockStatus === pill.id
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {pill.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Category Dropdown */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 font-medium">Category:</span>
              <select
                id="select-inventory-category"
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-700 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="All">All Categories</option>
                {categories.map(c => (
                  <option key={c._id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Sort Selector */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 font-medium">Sort:</span>
              <select
                id="select-inventory-sort"
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-700 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="name">Name</option>
                <option value="quantity">Quantity</option>
                <option value="unitPrice">Retail Price</option>
                <option value="sku">SKU</option>
              </select>
              <button
                onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                title={`Order: ${sortOrder.toUpperCase()}`}
              >
                <ArrowUpDown className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Product Details</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Stock Level</th>
                <th className="py-3 px-4">Pricing & Valuation</th>
                <th className="py-3 px-4">Supplier</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Package className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="text-sm font-medium text-slate-600">No products match your criteria</p>
                    <p className="text-xs text-slate-400 mt-1">Try clearing filters or adding a new inventory item.</p>
                  </td>
                </tr>
              ) : (
                filteredProducts.map(product => {
                  const isOutOfStock = product.quantity === 0;
                  const isLowStock = product.quantity <= product.minStock && product.quantity > 0;
                  const margin = product.unitPrice - product.costPrice;
                  const marginPercent = product.costPrice > 0 ? Math.round((margin / product.costPrice) * 100) : 0;

                  return (
                    <tr
                      key={product._id}
                      className="hover:bg-slate-50/60 transition-colors group"
                    >
                      {/* Product details */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                            {product.imageUrl ? (
                              <img
                                src={product.imageUrl}
                                alt={product.name}
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <Package className="w-5 h-5 text-slate-400" />
                            )}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 leading-tight">
                              {product.name}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="font-mono text-xs text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">
                                {product.sku}
                              </span>
                              <span className="text-[11px] text-slate-400">
                                Min target: {product.minStock}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-4 text-xs">
                        <span className="inline-flex items-center gap-1 font-medium text-slate-700 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
                          <Tag className="w-3 h-3 text-slate-400" />
                          {product.category}
                        </span>
                      </td>

                      {/* Stock Level with Indicator */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-sm font-bold ${
                              isOutOfStock
                                ? 'text-rose-600'
                                : isLowStock
                                ? 'text-amber-600'
                                : 'text-slate-900'
                            }`}
                          >
                            {product.quantity}
                          </span>
                          <span className="text-xs text-slate-400">units</span>

                          {isOutOfStock && (
                            <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                              OUT OF STOCK
                            </span>
                          )}

                          {isLowStock && (
                            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" /> LOW STOCK
                            </span>
                          )}
                        </div>

                        {/* Progress Bar indicating stock vs minimum */}
                        <div className="w-24 h-1.5 bg-slate-100 rounded-full mt-1.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              isOutOfStock
                                ? 'bg-rose-500'
                                : isLowStock
                                ? 'bg-amber-500'
                                : 'bg-emerald-500'
                            }`}
                            style={{
                              width: `${Math.min(100, Math.max(10, (product.quantity / (product.minStock * 2)) * 100))}%`,
                            }}
                          />
                        </div>
                      </td>

                      {/* Pricing & Valuation */}
                      <td className="py-3.5 px-4 text-xs">
                        <div className="font-semibold text-slate-900">
                          ${product.unitPrice.toFixed(2)}
                          <span className="text-[11px] text-slate-400 font-normal ml-1">retail</span>
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Cost: ${product.costPrice.toFixed(2)} • <span className="text-emerald-600 font-medium">+{marginPercent}% margin</span>
                        </div>
                      </td>

                      {/* Supplier */}
                      <td className="py-3.5 px-4 text-xs text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate max-w-[140px]">{product.supplier}</span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* Stock-In / Out Movement quick button */}
                          <button
                            id={`btn-move-stock-${product._id}`}
                            onClick={() => onOpenMovement(product._id)}
                            className="p-1.5 rounded-lg text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                            title="Log Stock-In / Stock-Out Movement"
                          >
                            <ArrowLeftRight className="w-4 h-4" />
                          </button>

                          {/* Admin Edit button */}
                          {isAdmin && (
                            <button
                              id={`btn-edit-product-${product._id}`}
                              onClick={() => openEditModal(product)}
                              className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                              title="Edit product specification"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}

                          {/* Admin Delete button */}
                          {isAdmin && (
                            <button
                              id={`btn-delete-product-${product._id}`}
                              onClick={() => setProductToDelete(product)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                              title="Delete product"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Summary */}
        <div className="px-4 py-3 bg-slate-50/70 border-t border-slate-200 text-xs text-slate-500 flex items-center justify-between">
          <span>Showing {filteredProducts.length} of {products.length} products</span>
          <span>Filtered stock units: {filteredProducts.reduce((s, p) => s + p.quantity, 0)}</span>
        </div>
      </div>

      {/* Add / Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <Package className="w-5 h-5 text-indigo-600" />
                {editingProduct ? 'Edit Product Specification' : 'Register New Inventory Product'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Name */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Product Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={e => setFormName(e.target.value)}
                    placeholder="e.g. Industrial Torque Screwdriver X-200"
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                {/* SKU */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700">
                      SKU Code *
                    </label>
                    <button
                      type="button"
                      onClick={() => setFormSku(`SKU-${Math.floor(1000 + Math.random() * 9000)}`)}
                      className="text-[10px] text-indigo-600 hover:underline"
                    >
                      Generate
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    value={formSku}
                    onChange={e => setFormSku(e.target.value)}
                    placeholder="e.g. TLS-TRQ-200"
                    className="w-full px-3 py-2 text-sm font-mono uppercase bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Category *
                  </label>
                  <select
                    required
                    value={formCategory}
                    onChange={e => setFormCategory(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  >
                    {categories.map(c => (
                      <option key={c._id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>

                {/* Initial Quantity (or edit quantity) */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {editingProduct ? 'Current Stock Level' : 'Initial Stock Quantity'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formQuantity}
                    onChange={e => setFormQuantity(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                {/* Min Reorder Stock */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Minimum Reorder Threshold *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formMinStock}
                    onChange={e => setFormMinStock(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                {/* Cost Price */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Cost Price (Procurement) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={formCostPrice}
                    onChange={e => setFormCostPrice(parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Mandatory cost to calculate profits</span>
                </div>

                {/* Unit Price */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Selling / Retail Price *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={formUnitPrice}
                    onChange={e => setFormUnitPrice(parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Customer retail price</span>
                </div>

                {/* Live Profit Margin Preview */}
                <div className="sm:col-span-2 p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-500 font-medium">Expected Unit Profit:</span>
                    <span className={`ml-2 font-mono font-bold ${(formUnitPrice - formCostPrice) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {(formUnitPrice - formCostPrice) >= 0 ? `+$${(formUnitPrice - formCostPrice).toFixed(2)}` : `-$${Math.abs(formUnitPrice - formCostPrice).toFixed(2)}`}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium">Markup Margin:</span>
                    <span className="ml-2 font-mono font-bold text-slate-900">
                      {formCostPrice > 0 ? `${(((formUnitPrice - formCostPrice) / formCostPrice) * 100).toFixed(1)}%` : '0%'}
                    </span>
                  </div>
                </div>

                {/* Supplier */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Primary Supplier *
                  </label>
                  <select
                    required
                    value={formSupplier}
                    onChange={e => setFormSupplier(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  >
                    {suppliers.map(s => (
                      <option key={s._id} value={s.name}>{s.name}</option>
                    ))}
                  </select>
                </div>

                {/* Image URL */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Product Image URL (Optional)
                  </label>
                  <input
                    type="url"
                    value={formImageUrl}
                    onChange={e => setFormImageUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-600/20 disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : editingProduct ? 'Save Changes' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {productToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-5 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Remove Product</h3>
                <p className="text-xs text-slate-500">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-sm text-slate-600">
              Are you sure you want to remove <span className="font-semibold text-slate-900">"{productToDelete.name}"</span> (SKU: {productToDelete.sku}) from the catalog?
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => setProductToDelete(null)}
                className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl text-sm font-semibold bg-rose-600 text-white hover:bg-rose-700 transition-colors shadow-sm shadow-rose-600/20 disabled:opacity-50"
              >
                {isSubmitting ? 'Deleting...' : 'Delete Product'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
