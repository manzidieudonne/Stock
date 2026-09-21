import React from 'react';
import {
  AlertTriangle,
  Package,
  ArrowDownRight,
  Truck,
  DollarSign,
  Boxes,
  CheckCircle,
  Building2,
} from 'lucide-react';
import { Product } from '../types';

interface LowStockAlertsViewProps {
  products: Product[];
  onRestock: (productId: string) => void;
  onSelectCategoryFilter: (cat: string) => void;
}

export const LowStockAlertsView: React.FC<LowStockAlertsViewProps> = ({
  products,
  onRestock,
  onSelectCategoryFilter,
}) => {
  const lowStockItems = products.filter(p => p.quantity <= p.minStock && p.quantity > 0);
  const outOfStockItems = products.filter(p => p.quantity === 0);
  const allAlerts = [...outOfStockItems, ...lowStockItems];

  // Deficit calculation
  const totalUnitsDeficit = allAlerts.reduce((sum, p) => {
    const target = p.minStock * 2;
    return sum + Math.max(0, target - p.quantity);
  }, 0);

  const estimatedRestockCapital = allAlerts.reduce((sum, p) => {
    const target = p.minStock * 2;
    const needed = Math.max(0, target - p.quantity);
    return sum + (needed * p.costPrice);
  }, 0);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            Stock Deficit & Reorder Alerts
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Automated monitoring for inventory items at or below minimum threshold.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
            {allAlerts.length} Action Items Pending
          </span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Critical Stockout (0 units)
          </span>
          <div className="text-2xl font-bold text-rose-600 mt-2">
            {outOfStockItems.length} items
          </div>
          <p className="text-xs text-slate-400 mt-1">Halted orders and zero fulfillment</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Low Stock Warnings
          </span>
          <div className="text-2xl font-bold text-amber-600 mt-2">
            {lowStockItems.length} items
          </div>
          <p className="text-xs text-slate-400 mt-1">Below minimum safety margin</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Estimated Reorder Capital
          </span>
          <div className="text-2xl font-bold text-slate-900 mt-2">
            ${estimatedRestockCapital.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-slate-400 mt-1">To replenish {totalUnitsDeficit} total units to safe levels</p>
        </div>
      </div>

      {/* Alerts Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {allAlerts.length === 0 ? (
          <div className="py-16 text-center text-slate-500">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800">All Stock Levels Healthy</h3>
            <p className="text-xs text-slate-400 mt-1">
              No products are currently below their minimum threshold.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Product / SKU</th>
                  <th className="py-3 px-4">Current Level</th>
                  <th className="py-3 px-4">Min Threshold</th>
                  <th className="py-3 px-4">Recommended Reorder</th>
                  <th className="py-3 px-4">Supplier Contact</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {allAlerts.map(p => {
                  const isZero = p.quantity === 0;
                  const suggested = Math.max(p.minStock, (p.minStock * 2) - p.quantity);
                  const estCost = suggested * p.costPrice;

                  return (
                    <tr key={p._id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Product */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900 text-sm">{p.name}</div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="font-mono text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded text-[11px]">
                            {p.sku}
                          </span>
                          <span className="text-slate-400 text-[11px]">{p.category}</span>
                        </div>
                      </td>

                      {/* Current level */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 font-bold text-xs px-2.5 py-1 rounded-full ${
                            isZero
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          <AlertTriangle className="w-3 h-3" />
                          {isZero ? '0 UNITS (OUT)' : `${p.quantity} UNITS (LOW)`}
                        </span>
                      </td>

                      {/* Min threshold */}
                      <td className="py-3.5 px-4 font-semibold text-slate-700">
                        {p.minStock} units
                      </td>

                      {/* Recommended reorder */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-indigo-600">
                          +{suggested} units
                        </div>
                        <span className="text-[11px] text-slate-400">
                          Est. Cost: ${estCost.toFixed(2)}
                        </span>
                      </td>

                      {/* Supplier */}
                      <td className="py-3.5 px-4 text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="font-medium text-slate-800">{p.supplier}</span>
                        </div>
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          id={`btn-alert-restock-${p._id}`}
                          onClick={() => onRestock(p._id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-xs"
                        >
                          <ArrowDownRight className="w-3.5 h-3.5" />
                          <span>Restock Item</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
