import React, { useState, useEffect } from 'react';
import {
  ArrowLeftRight,
  ArrowDownRight,
  ArrowUpRight,
  X,
  AlertTriangle,
  Boxes,
} from 'lucide-react';
import { Product } from '../types';
import { useAuth } from '../context/AuthContext';

interface QuickMovementModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  initialProductId?: string;
  initialType?: 'IN' | 'OUT';
  onRecordMovement: (payload: {
    productId: string;
    type: 'IN' | 'OUT';
    quantity: number;
    costPrice?: number;
    sellingPrice?: number;
    updateProductCost?: boolean;
    notes?: string;
  }) => Promise<void>;
}

export const QuickMovementModal: React.FC<QuickMovementModalProps> = ({
  isOpen,
  onClose,
  products,
  initialProductId,
  initialType = 'IN',
  onRecordMovement,
}) => {
  const { user, isAdmin } = useAuth();
  const [selectedProductId, setSelectedProductId] = useState(initialProductId || products[0]?._id || '');
  const [type, setType] = useState<'IN' | 'OUT'>(initialType);
  const [quantity, setQuantity] = useState(10);
  const [unitCost, setUnitCost] = useState<number>(0);
  const [sellingPrice, setSellingPrice] = useState<number>(0);
  const [updateCatalogCost, setUpdateCatalogCost] = useState(true);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const product = products.find(p => p._id === selectedProductId);

  useEffect(() => {
    if (initialProductId) setSelectedProductId(initialProductId);
    if (initialType) setType(initialType);
    setError('');
  }, [initialProductId, initialType, isOpen]);

  useEffect(() => {
    if (product) {
      setUnitCost(product.costPrice || 0);
      setSellingPrice(product.unitPrice || 0);
    }
  }, [selectedProductId, product]);

  if (!isOpen) return null;

  const currentCost = Number(unitCost) || 0;
  const currentSellingPrice = Number(sellingPrice) || 0;
  const currentQty = Math.max(1, Number(quantity) || 1);

  // Financial calculations for Sales
  const saleRevenue = currentQty * currentSellingPrice;
  const saleCogs = currentQty * (product?.costPrice || 0);
  const saleProfit = saleRevenue - saleCogs;
  const saleMargin = saleRevenue > 0 ? (saleProfit / saleRevenue) * 100 : 0;

  // Financial calculations for Intake
  const totalIntakeCost = currentQty * currentCost;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!selectedProductId) {
      setError('Please select a product.');
      return;
    }

    const qty = Number(quantity);
    if (isNaN(qty) || qty <= 0) {
      setError('Quantity must be a positive integer.');
      return;
    }

    if (type === 'IN') {
      if (isNaN(currentCost) || currentCost <= 0) {
        setError('Procurement Cost Price is required and must be greater than $0.00 when adding stock.');
        return;
      }
    }

    if (type === 'OUT') {
      if (product && qty > product.quantity) {
        setError(`Cannot dispatch ${qty} units. Only ${product.quantity} units available.`);
        return;
      }
      if (isNaN(currentSellingPrice) || currentSellingPrice <= 0) {
        setError('Selling price must be greater than $0.00 to record sale and compute profit.');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      await onRecordMovement({
        productId: selectedProductId,
        type,
        quantity: qty,
        costPrice: type === 'IN' ? currentCost : undefined,
        sellingPrice: type === 'OUT' ? currentSellingPrice : undefined,
        updateProductCost: type === 'IN' ? updateCatalogCost : undefined,
        notes: notes.trim(),
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to record movement');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <ArrowLeftRight className="w-5 h-5 text-indigo-600" />
            {type === 'IN' ? 'Add Stock (Record Intake & Cost)' : 'Record Sale & Calculate Profit'}
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">
              Movement Direction *
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setType('IN')}
                className={`py-2 px-3 rounded-xl font-semibold border flex items-center justify-center gap-1.5 transition-all ${
                  type === 'IN'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-800 ring-2 ring-emerald-500/20'
                    : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}
              >
                <ArrowDownRight className="w-3.5 h-3.5 text-emerald-600" />
                <span>Stock-In (Intake + Cost)</span>
              </button>

              <button
                type="button"
                onClick={() => setType('OUT')}
                className={`py-2 px-3 rounded-xl font-semibold border flex items-center justify-center gap-1.5 transition-all ${
                  type === 'OUT'
                    ? 'bg-rose-50 border-rose-500 text-rose-800 ring-2 ring-rose-500/20'
                    : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}
              >
                <ArrowUpRight className="w-3.5 h-3.5 text-rose-600" />
                <span>Stock-Out (Seller Sale)</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Select Product *
            </label>
            <select
              required
              value={selectedProductId}
              onChange={e => setSelectedProductId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 font-medium text-xs"
            >
              {products.map(p => (
                <option key={p._id} value={p._id}>
                  {p.name} ({p.sku}) — Available: {p.quantity} units • Cost: ${p.costPrice.toFixed(2)}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                {type === 'IN' ? 'Quantity to Add *' : 'Quantity Sold *'}
              </label>
              <input
                type="number"
                min="1"
                required
                value={quantity}
                onChange={e => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-semibold text-slate-900"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                New Stock Balance
              </label>
              <div className="px-3 py-2 rounded-xl bg-slate-100 border border-slate-200 font-bold text-slate-900 text-xs">
                {product ? (type === 'IN' ? product.quantity + currentQty : Math.max(0, product.quantity - currentQty)) : 0} units
                <span className="text-[11px] text-slate-500 block font-normal">
                  (Currently: {product?.quantity || 0})
                </span>
              </div>
            </div>
          </div>

          {/* Mandatory Cost Price Input on Stock-In */}
          {type === 'IN' && (
            <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-2">
              <div>
                <label className="block font-bold text-emerald-900 mb-1">
                  Procurement Cost Price ($ per unit) *
                </label>
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
                    className="w-full pl-7 pr-3 py-2 bg-white border border-emerald-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 font-bold text-emerald-950"
                  />
                </div>
                <p className="text-[10px] text-emerald-700 mt-1">
                  Required: Enters this batch's procurement cost for precise COGS & profit reporting.
                </p>
              </div>

              <div className="flex items-center justify-between pt-1 text-xs border-t border-emerald-200/60">
                <span className="text-emerald-800 font-medium">Total Procurement Capital:</span>
                <span className="font-bold text-emerald-950 font-mono text-sm">
                  ${totalIntakeCost.toFixed(2)}
                </span>
              </div>

              <label className="flex items-center gap-2 text-[11px] text-emerald-900 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={updateCatalogCost}
                  onChange={e => setUpdateCatalogCost(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span>Update master catalog cost price to ${currentCost.toFixed(2)}</span>
              </label>
            </div>
          )}

          {/* Real-time Profit Calculation on Seller Stock-Out */}
          {type === 'OUT' && (
            <div className="p-3 bg-slate-900 text-white rounded-xl space-y-2.5">
              <div className="flex items-center justify-between pb-1 border-b border-white/10">
                <span className="font-semibold text-slate-300">Sale Price & Profit Calculation</span>
                <span className="text-[10px] text-slate-400">Live Seller Report</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 text-[11px] font-medium mb-1">
                    Selling Price ($/unit) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={sellingPrice}
                    onChange={e => setSellingPrice(parseFloat(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 text-[11px] font-medium mb-1">
                    Base Unit Cost (COGS)
                  </label>
                  <div className="px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-300 font-mono">
                    ${(product?.costPrice || 0).toFixed(2)}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-1 border-t border-white/10 text-[11px]">
                <div>
                  <span className="text-slate-400 block">Gross Revenue:</span>
                  <span className="font-bold text-white">${saleRevenue.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Total Cost:</span>
                  <span className="font-bold text-slate-300">${saleCogs.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-emerald-400 block font-semibold">Net Profit:</span>
                  <span className={`font-bold font-mono ${saleProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {saleProfit >= 0 ? `+$${saleProfit.toFixed(2)}` : `-$${Math.abs(saleProfit).toFixed(2)}`}
                    <span className="block text-[10px] font-normal">({saleMargin.toFixed(1)}%)</span>
                  </span>
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Note / Reference (Customer, Invoice, Batch)
            </label>
            <input
              type="text"
              placeholder={type === 'IN' ? 'e.g. Supplier PO #4412, Feed Intake Batch 3' : 'e.g. Counter Sale, Receipt #1084'}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-5 py-2 rounded-xl font-semibold text-white shadow-xs disabled:opacity-50 ${
                type === 'IN' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
              }`}
            >
              {isSubmitting ? 'Recording...' : type === 'IN' ? 'Save Stock Intake & Cost' : 'Complete Sale & Log Profit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
