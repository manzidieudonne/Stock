import React, { useState, useMemo } from 'react';
import {
  ArrowLeftRight,
  ArrowDownRight,
  ArrowUpRight,
  Search,
  Filter,
  Package,
  User as UserIcon,
  Calendar,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Boxes,
  ShieldCheck,
} from 'lucide-react';
import { Product, Transaction } from '../types';
import { useAuth } from '../context/AuthContext';

interface StockMovementViewProps {
  products: Product[];
  transactions: Transaction[];
  onRecordMovement: (payload: {
    productId: string;
    type: 'IN' | 'OUT';
    quantity: number;
    costPrice?: number;
    sellingPrice?: number;
    updateProductCost?: boolean;
    notes?: string;
  }) => Promise<void>;
  preselectedProductId?: string;
  preselectedType?: 'IN' | 'OUT';
}

export const StockMovementView: React.FC<StockMovementViewProps> = ({
  products,
  transactions,
  onRecordMovement,
  preselectedProductId,
  preselectedType = 'IN',
}) => {
  const { user, isAdmin } = useAuth();

  // Form states
  const [selectedProductId, setSelectedProductId] = useState<string>(
    preselectedProductId || products[0]?._id || ''
  );
  const [movementType, setMovementType] = useState<'IN' | 'OUT'>(preselectedType);
  const [quantity, setQuantity] = useState<number>(10);
  const [unitCost, setUnitCost] = useState<number>(0);
  const [sellingPrice, setSellingPrice] = useState<number>(0);
  const [updateCatalogCost, setUpdateCatalogCost] = useState(true);
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formFeedback, setFormFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Filter states for log table
  const [filterType, setFilterType] = useState<'ALL' | 'IN' | 'OUT'>('ALL');
  const [searchLog, setSearchLog] = useState('');

  // Selected product object
  const currentProduct = useMemo(() => {
    return products.find(p => p._id === selectedProductId);
  }, [products, selectedProductId]);

  // Sync unitCost and sellingPrice when product changes
  React.useEffect(() => {
    if (currentProduct) {
      setUnitCost(currentProduct.costPrice || 0);
      setSellingPrice(currentProduct.unitPrice || 0);
    }
  }, [currentProduct]);

  // Financial calculations
  const currentQty = Math.max(1, Number(quantity) || 1);
  const currentCostValue = Number(unitCost) || 0;
  const currentSellValue = Number(sellingPrice) || 0;

  const liveRevenue = currentQty * currentSellValue;
  const liveCogs = currentQty * (currentProduct?.costPrice || 0);
  const liveProfit = liveRevenue - liveCogs;
  const liveMargin = liveRevenue > 0 ? (liveProfit / liveRevenue) * 100 : 0;
  const totalProcurementCapital = currentQty * currentCostValue;

  // Projected stock level
  const projectedStock = useMemo(() => {
    if (!currentProduct) return 0;
    const qty = Math.max(1, Number(quantity) || 0);
    if (movementType === 'IN') {
      return currentProduct.quantity + qty;
    } else {
      return Math.max(0, currentProduct.quantity - qty);
    }
  }, [currentProduct, movementType, quantity]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormFeedback(null);

    if (!selectedProductId) {
      setFormFeedback({ type: 'error', message: 'Please select a product.' });
      return;
    }

    const qty = Number(quantity);
    if (isNaN(qty) || qty <= 0) {
      setFormFeedback({ type: 'error', message: 'Quantity must be a positive integer.' });
      return;
    }

    if (movementType === 'IN') {
      if (isNaN(currentCostValue) || currentCostValue <= 0) {
        setFormFeedback({
          type: 'error',
          message: 'Procurement Cost Price is required and must be greater than $0.00 when adding stock.',
        });
        return;
      }
    }

    if (movementType === 'OUT') {
      if (currentProduct && qty > currentProduct.quantity) {
        setFormFeedback({
          type: 'error',
          message: `Insufficient stock! Requested ${qty} units, but only ${currentProduct.quantity} units are currently available.`
        });
        return;
      }
      if (isNaN(currentSellValue) || currentSellValue <= 0) {
        setFormFeedback({
          type: 'error',
          message: 'Selling Price is required and must be greater than $0.00 to record sale and compute profit.',
        });
        return;
      }
    }

    setIsSubmitting(true);
    try {
      await onRecordMovement({
        productId: selectedProductId,
        type: movementType,
        quantity: qty,
        costPrice: movementType === 'IN' ? currentCostValue : undefined,
        sellingPrice: movementType === 'OUT' ? currentSellValue : undefined,
        updateProductCost: movementType === 'IN' ? updateCatalogCost : undefined,
        notes: notes.trim(),
      });

      setFormFeedback({
        type: 'success',
        message: movementType === 'IN'
          ? `Successfully recorded Restock of ${qty} units at $${currentCostValue.toFixed(2)}/unit for "${currentProduct?.name}". Total Capital: $${totalProcurementCapital.toFixed(2)}.`
          : `Successfully recorded Sale of ${qty} units at $${currentSellValue.toFixed(2)}/unit. Net Profit: +$${liveProfit.toFixed(2)} (${liveMargin.toFixed(1)}% margin).`
      });
      setNotes('');
    } catch (err: any) {
      setFormFeedback({ type: 'error', message: err.message || 'Failed to record movement.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    let list = [...transactions];

    if (filterType !== 'ALL') {
      list = list.filter(t => t.type === filterType);
    }

    if (searchLog.trim()) {
      const q = searchLog.toLowerCase().trim();
      list = list.filter(t =>
        t.productName.toLowerCase().includes(q) ||
        t.productSku.toLowerCase().includes(q) ||
        t.userName.toLowerCase().includes(q) ||
        (t.notes && t.notes.toLowerCase().includes(q))
      );
    }

    return list;
  }, [transactions, filterType, searchLog]);

  return (
    <div className="space-y-6">
      {/* Top Grid: Quick Movement Form & Product Insight */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Movement Form - 2 cols */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <ArrowLeftRight className="w-5 h-5 text-indigo-600" />
                Record Stock Movement
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Automatically adjusts product quantities and logs audit attribution.
              </p>
            </div>
            <div className="text-xs text-slate-400 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
              Operator: <span className="font-semibold text-slate-700">{user?.name}</span>
            </div>
          </div>

          {formFeedback && (
            <div
              className={`p-3.5 rounded-xl text-xs font-medium mb-4 flex items-center gap-2.5 ${
                formFeedback.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              {formFeedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{formFeedback.message}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Movement Type Toggle */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Movement Direction *
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  id="btn-select-stock-in"
                  onClick={() => setMovementType('IN')}
                  className={`p-3 rounded-xl border text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
                    movementType === 'IN'
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-xs ring-2 ring-emerald-500/20'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <ArrowDownRight className="w-4 h-4 text-emerald-600" />
                  <span>Stock-In (Restock / Supplier Intake)</span>
                </button>

                <button
                  type="button"
                  id="btn-select-stock-out"
                  onClick={() => setMovementType('OUT')}
                  className={`p-3 rounded-xl border text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
                    movementType === 'OUT'
                      ? 'bg-rose-50 border-rose-500 text-rose-700 shadow-xs ring-2 ring-rose-500/20'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <ArrowUpRight className="w-4 h-4 text-rose-600" />
                  <span>Stock-Out (Sales / Dispatch / Usage)</span>
                </button>
              </div>
            </div>

            {/* Select Product */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Target Inventory Item *
              </label>
              <select
                id="select-movement-product"
                required
                value={selectedProductId}
                onChange={e => setSelectedProductId(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium text-slate-800"
              >
                {products.map(p => (
                  <option key={p._id} value={p._id}>
                    {p.name} ({p.sku}) — Available: {p.quantity} units [{p.category}]
                  </option>
                ))}
              </select>
            </div>

            {/* Quantity, Cost, Selling Price and Notes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Movement Quantity (Units) *
                </label>
                <input
                  id="input-movement-quantity"
                  type="number"
                  min="1"
                  required
                  value={quantity}
                  onChange={e => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Reference / PO / Reason / Customer
                </label>
                <input
                  id="input-movement-notes"
                  type="text"
                  placeholder={movementType === 'IN' ? 'e.g. PO-8819 Supplier Batch' : 'e.g. Customer Receipt #410'}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Mandatory Cost Input for Stock-In */}
            {movementType === 'IN' && (
              <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-emerald-950">
                    Procurement Cost Price ($ per unit) *
                  </label>
                  <span className="text-[11px] text-emerald-700 font-medium">Mandatory for Animal Stock</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      required
                      value={unitCost}
                      onChange={e => setUnitCost(parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                      className="w-full pl-7 pr-3 py-2 bg-white border border-emerald-300 rounded-xl text-sm font-bold text-emerald-950 focus:ring-2 focus:ring-emerald-500/30"
                    />
                  </div>
                  <div className="px-3 py-2 bg-emerald-100/60 rounded-xl border border-emerald-200 flex items-center justify-between text-xs">
                    <span className="text-emerald-800 font-medium">Total Capital:</span>
                    <span className="font-bold text-emerald-950 font-mono text-sm">
                      ${totalProcurementCapital.toFixed(2)}
                    </span>
                  </div>
                </div>
                <label className="flex items-center gap-2 text-xs text-emerald-900 cursor-pointer pt-0.5">
                  <input
                    type="checkbox"
                    checked={updateCatalogCost}
                    onChange={e => setUpdateCatalogCost(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Update catalog default cost price for this item to ${currentCostValue.toFixed(2)}</span>
                </label>
              </div>
            )}

            {/* Seller Live Profit Calculator for Stock-Out */}
            {movementType === 'OUT' && (
              <div className="p-3.5 bg-slate-900 text-white rounded-xl space-y-2.5">
                <div className="flex items-center justify-between pb-1 border-b border-white/10">
                  <span className="font-bold text-xs text-slate-200">Seller Live Sales & Profit Calculator</span>
                  <span className="text-[11px] text-slate-400">Automatic COGS Deduction</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-300 font-semibold mb-1">
                      Selling Price ($ / unit) *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        required
                        value={sellingPrice}
                        onChange={e => setSellingPrice(parseFloat(e.target.value) || 0)}
                        className="w-full pl-7 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm font-bold text-white focus:ring-2 focus:ring-indigo-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 font-medium mb-1">
                      Procurement Cost Basis (COGS)
                    </label>
                    <div className="px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-sm font-mono text-slate-300 flex items-center justify-between">
                      <span>${(currentProduct?.costPrice || 0).toFixed(2)} / unit</span>
                      <span className="text-[11px] text-slate-500">Total: ${liveCogs.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/10 text-xs text-center">
                  <div className="bg-slate-800/50 p-2 rounded-lg">
                    <span className="text-[10px] text-slate-400 block">Total Revenue</span>
                    <span className="font-bold text-white font-mono">${liveRevenue.toFixed(2)}</span>
                  </div>
                  <div className="bg-slate-800/50 p-2 rounded-lg">
                    <span className="text-[10px] text-slate-400 block">Total Cost (COGS)</span>
                    <span className="font-bold text-slate-300 font-mono">${liveCogs.toFixed(2)}</span>
                  </div>
                  <div className="bg-slate-800/50 p-2 rounded-lg">
                    <span className="text-[10px] text-emerald-400 block font-semibold">Net Profit</span>
                    <span className={`font-bold font-mono ${liveProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {liveProfit >= 0 ? `+$${liveProfit.toFixed(2)}` : `-$${Math.abs(liveProfit).toFixed(2)}`}
                      <span className="block text-[10px] font-normal">({liveMargin.toFixed(1)}%)</span>
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <div className="text-xs text-slate-500">
                Authorized role: <span className="font-semibold text-slate-700">{user?.role}</span>
              </div>
              <button
                type="submit"
                id="btn-submit-movement"
                disabled={isSubmitting || (movementType === 'OUT' && currentProduct && quantity > currentProduct.quantity)}
                className={`px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-all shadow-sm disabled:opacity-50 ${
                  movementType === 'IN'
                    ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
                    : 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20'
                }`}
              >
                {isSubmitting
                  ? 'Recording Movement...'
                  : movementType === 'IN'
                  ? 'Confirm Stock-In (Record Cost)'
                  : 'Confirm Sale & Log Profit'}
              </button>
            </div>
          </form>
        </div>

        {/* Live Calculation & Product Stock Telemetry - 1 col */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
              Stock Calculation Preview
            </h4>

            {currentProduct ? (
              <div className="space-y-4">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[11px] text-slate-500 uppercase font-bold tracking-wider">Item Selected</span>
                  <p className="text-sm font-bold text-slate-900 mt-0.5">{currentProduct.name}</p>
                  <p className="font-mono text-xs text-indigo-700 mt-0.5">{currentProduct.sku}</p>
                </div>

                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="p-3 rounded-xl bg-slate-100 border border-slate-200">
                    <span className="text-[11px] text-slate-500 font-medium">Current Stock</span>
                    <div className="text-xl font-bold text-slate-900 mt-1">
                      {currentProduct.quantity}
                    </div>
                  </div>

                  <div
                    className={`p-3 rounded-xl border ${
                      movementType === 'IN'
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                        : projectedStock <= currentProduct.minStock
                        ? 'bg-amber-50 border-amber-200 text-amber-900'
                        : 'bg-slate-100 border-slate-200 text-slate-900'
                    }`}
                  >
                    <span className="text-[11px] text-slate-500 font-medium">Projected Stock</span>
                    <div className="text-xl font-bold mt-1">
                      {projectedStock}
                    </div>
                  </div>
                </div>

                {movementType === 'OUT' && quantity > currentProduct.quantity && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>Requested quantity exceeds available stock by {quantity - currentProduct.quantity} units.</span>
                  </div>
                )}

                <div className="text-xs text-slate-500 space-y-1 pt-2 border-t border-slate-100">
                  <div className="flex justify-between">
                    <span>Reorder threshold:</span>
                    <span className="font-semibold text-slate-800">{currentProduct.minStock} units</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Supplier:</span>
                    <span className="font-semibold text-slate-800 truncate max-w-[150px]">{currentProduct.supplier}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Retail Unit Price:</span>
                    <span className="font-semibold text-slate-800">${currentProduct.unitPrice.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400">Please choose a product to preview stock changes.</p>
            )}
          </div>

          <div className="pt-3 mt-4 border-t border-slate-100 text-[11px] text-slate-400 flex items-center gap-1.5">
            <Boxes className="w-3.5 h-3.5" />
            <span>Mongoose schema enforces transaction consistency</span>
          </div>
        </div>
      </div>

      {/* Transaction Movement Audit History Log Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Table Header & Search/Filter */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-600" />
              Stock Movement Audit History Log
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Immutable historical records of stock-ins and dispatches
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Filter Pill */}
            <div className="flex items-center bg-slate-100 rounded-lg p-1 text-xs">
              {(['ALL', 'IN', 'OUT'] as const).map(type => (
                <button
                  key={type}
                  id={`btn-filter-txn-${type.toLowerCase()}`}
                  onClick={() => setFilterType(type)}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
                    filterType === type
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {type === 'ALL' ? 'All Types' : type === 'IN' ? 'Stock-In' : 'Stock-Out'}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search transactions..."
                value={searchLog}
                onChange={e => setSearchLog(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">Product / SKU</th>
                <th className="py-3 px-4">Movement Type</th>
                <th className="py-3 px-4">Quantity</th>
                <th className="py-3 px-4">Unit Cost / Price</th>
                <th className="py-3 px-4">Total Amount</th>
                <th className="py-3 px-4">Realized Profit</th>
                <th className="py-3 px-4">Operator & Role</th>
                <th className="py-3 px-4">Reference Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    No transactions match your query.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map(txn => {
                  const dateObj = new Date(txn.timestamp);
                  const isStockIn = txn.type === 'IN';
                  const unitCost = txn.unitCost || 0;
                  const unitPrice = txn.unitPrice || 0;
                  const totalRev = txn.totalRevenue || (isStockIn ? 0 : txn.quantity * unitPrice);
                  const totalCost = txn.totalCost || (txn.quantity * unitCost);
                  const profit = txn.profit !== undefined ? txn.profit : (isStockIn ? 0 : totalRev - totalCost);
                  const margin = txn.profitMargin !== undefined ? txn.profitMargin : (totalRev > 0 ? (profit / totalRev) * 100 : 0);

                  return (
                    <tr key={txn._id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Date */}
                      <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>
                            {dateObj.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                          <span className="text-slate-400">
                            {dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </td>

                      {/* Product */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{txn.productName}</div>
                        <div className="font-mono text-[11px] text-slate-500">{txn.productSku}</div>
                      </td>

                      {/* Movement Type */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-bold text-[11px] ${
                            isStockIn
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {isStockIn ? (
                            <ArrowDownRight className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <ArrowUpRight className="w-3 h-3 text-rose-600" />
                          )}
                          {isStockIn ? 'STOCK-IN' : 'STOCK-OUT (SALE)'}
                        </span>
                      </td>

                      {/* Quantity */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`font-bold text-sm ${
                            isStockIn ? 'text-emerald-600' : 'text-rose-600'
                          }`}
                        >
                          {isStockIn ? `+${txn.quantity}` : `-${txn.quantity}`}
                        </span>
                        <span className="text-slate-400 text-xs ml-1">units</span>
                      </td>

                      {/* Unit Cost / Price */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {isStockIn ? (
                          <div className="text-slate-900 font-semibold font-mono">
                            ${unitCost.toFixed(2)}
                            <span className="text-[10px] text-slate-400 font-normal block">Procurement Cost</span>
                          </div>
                        ) : (
                          <div className="text-slate-900 font-semibold font-mono">
                            ${unitPrice.toFixed(2)}
                            <span className="text-[10px] text-slate-400 font-normal block">Cost: ${unitCost.toFixed(2)}</span>
                          </div>
                        )}
                      </td>

                      {/* Total Amount */}
                      <td className="py-3 px-4 whitespace-nowrap font-mono">
                        {isStockIn ? (
                          <div className="text-slate-700 font-medium">
                            ${totalCost.toFixed(2)}
                            <span className="text-[10px] text-slate-400 font-normal block">Capital In</span>
                          </div>
                        ) : (
                          <div className="text-slate-900 font-bold">
                            ${totalRev.toFixed(2)}
                            <span className="text-[10px] text-slate-400 font-normal block">COGS: ${totalCost.toFixed(2)}</span>
                          </div>
                        )}
                      </td>

                      {/* Realized Profit */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {isStockIn ? (
                          <span className="text-slate-400 font-mono text-[11px]">—</span>
                        ) : (
                          <div className="flex flex-col">
                            <span
                              className={`font-bold font-mono text-xs ${
                                profit >= 0 ? 'text-emerald-700' : 'text-rose-700'
                              }`}
                            >
                              {profit >= 0 ? `+$${profit.toFixed(2)}` : `-$${Math.abs(profit).toFixed(2)}`}
                            </span>
                            <span
                              className={`text-[10px] font-semibold ${
                                margin >= 0 ? 'text-emerald-600' : 'text-rose-600'
                              }`}
                            >
                              {margin.toFixed(1)}% margin
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Operator */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center font-bold text-[9px] text-slate-700">
                            {txn.userName?.slice(0, 2).toUpperCase() || 'OP'}
                          </div>
                          <span className="font-medium text-slate-800">{txn.userName}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-mono">
                            {txn.userRole}
                          </span>
                        </div>
                      </td>

                      {/* Notes */}
                      <td className="py-3 px-4 text-slate-600">
                        {txn.notes ? (
                          <span className="italic text-slate-700">{txn.notes}</span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 bg-slate-50/70 border-t border-slate-200 text-xs text-slate-500 flex items-center justify-between">
          <span>Showing {filteredTransactions.length} of {transactions.length} total logs</span>
          <span>Role: {isAdmin ? 'Full Audit Access (Admin)' : 'Staff Activity Log'}</span>
        </div>
      </div>
    </div>
  );
};
