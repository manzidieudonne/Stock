import React from 'react';
import {
  Package,
  Boxes,
  DollarSign,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  TrendingUp,
  ArrowLeftRight,
  Plus,
  Layers,
  Sparkles,
  Wheat,
  Pill,
  Award,
} from 'lucide-react';
import { DashboardSummary } from '../types';
import { useAuth } from '../context/AuthContext';

interface DashboardProps {
  data: DashboardSummary | null;
  loading: boolean;
  onSelectTab: (tab: string) => void;
  onOpenQuickMovement: (productId?: string, type?: 'IN' | 'OUT') => void;
  onOpenCreateProduct: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  data,
  loading,
  onSelectTab,
  onOpenQuickMovement,
  onOpenCreateProduct,
}) => {
  const { isAdmin } = useAuth();

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-medium text-slate-500">Loading livestock feed & veterinary medicine analytics...</p>
        </div>
      </div>
    );
  }

  const {
    summary,
    categoryBreakdown,
    recentMovements,
    lowStockList,
    topProfitableProducts = [],
    feedVsMedicine,
  } = data;

  const totalSalesRevenue = summary.totalSalesRevenue || 0;
  const totalSalesCOGS = summary.totalSalesCOGS || 0;
  const totalRealizedProfit = summary.totalRealizedProfit || 0;
  const realizedProfitMargin = summary.realizedProfitMargin || (totalSalesRevenue > 0 ? ((totalRealizedProfit / totalSalesRevenue) * 100) : 0);

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Animal Feed & Veterinary Medicine Stock
            </h2>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200">
              <Wheat className="w-3 h-3 text-amber-600" />
              Feed & Pharma
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-0.5">
            Procurement cost tracking, live seller profit calculation, and batch inventory.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            id="btn-quick-stock-in"
            onClick={() => onOpenQuickMovement(undefined, 'IN')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors shadow-xs"
          >
            <ArrowDownRight className="w-4 h-4 text-emerald-600" />
            <span>Add Stock (Intake & Cost)</span>
          </button>

          <button
            id="btn-quick-stock-out"
            onClick={() => onOpenQuickMovement(undefined, 'OUT')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition-colors shadow-xs"
          >
            <ArrowUpRight className="w-4 h-4 text-rose-600" />
            <span>Record Sale (Calculate Profit)</span>
          </button>

          {isAdmin && (
            <button
              id="btn-dashboard-add-product"
              onClick={onOpenCreateProduct}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-600/20"
            >
              <Plus className="w-4 h-4" />
              <span>New Stock Item</span>
            </button>
          )}
        </div>
      </div>

      {/* Realized Sales & Profit Highlights (Requested Core Feature) */}
      <div className="bg-linear-to-r from-slate-900 to-indigo-950 p-5 rounded-2xl text-white shadow-sm border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              <h3 className="text-base font-bold tracking-tight">
                Seller Sales & Realized Profit Performance
              </h3>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Calculated from completed sales (Stock-Out) based on recorded procurement cost vs selling price.
            </p>
          </div>
          <button
            id="btn-dashboard-view-sales-report"
            onClick={() => onSelectTab('reports')}
            className="self-start md:self-auto text-xs font-semibold px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors border border-white/10"
          >
            Full Sales & Profit Report →
          </button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
          <div className="bg-white/5 p-3.5 rounded-xl border border-white/10">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Total Sales Revenue
            </span>
            <div className="text-xl sm:text-2xl font-bold text-white mt-1">
              ${totalSalesRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <span className="text-[11px] text-slate-400 mt-0.5 block">
              {summary.completedSalesCount || 0} customer sales recorded
            </span>
          </div>

          <div className="bg-white/5 p-3.5 rounded-xl border border-white/10">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Cost of Goods Sold (COGS)
            </span>
            <div className="text-xl sm:text-2xl font-bold text-slate-200 mt-1">
              ${totalSalesCOGS.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <span className="text-[11px] text-slate-400 mt-0.5 block">
              Direct procurement basis
            </span>
          </div>

          <div className="bg-white/5 p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-950/20">
            <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider block">
              Net Realized Profit
            </span>
            <div className="text-xl sm:text-2xl font-bold text-emerald-400 mt-1">
              +${totalRealizedProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <span className="text-[11px] text-emerald-300 mt-0.5 block">
              Profit from seller dispatches
            </span>
          </div>

          <div className="bg-white/5 p-3.5 rounded-xl border border-white/10">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Average Profit Margin
            </span>
            <div className="text-xl sm:text-2xl font-bold text-amber-300 mt-1">
              {realizedProfitMargin.toFixed(1)}%
            </div>
            <span className="text-[11px] text-slate-400 mt-0.5 block">
              Realized return on sales
            </span>
          </div>
        </div>
      </div>

      {/* Inventory Valuation & Units Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Inventory Units */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Stock Units
            </span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Boxes className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900 tracking-tight">
              {summary.totalInventoryUnits.toLocaleString()} units
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
              <span className="font-medium text-indigo-600">{summary.totalProductTypes}</span> feed & medicine SKUs
            </div>
          </div>
        </div>

        {/* Total Inventory Valuation */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Inventory Valuation (Retail)
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900 tracking-tight">
              ${summary.totalInventoryValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="flex items-center gap-1 text-xs text-slate-500 mt-1 truncate">
              Cost: <span className="font-medium text-slate-700">${summary.totalCostValue.toLocaleString()}</span> • Est Margin: <span className="font-semibold text-emerald-600">+${summary.potentialMargin.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Low Stock & Out of Stock */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Stock Warnings
            </span>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
              summary.lowStockCount > 0 || summary.outOfStockCount > 0
                ? 'bg-amber-50 text-amber-600'
                : 'bg-slate-100 text-slate-500'
            }`}>
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-amber-600 tracking-tight">
                {summary.lowStockCount}
              </span>
              <span className="text-xs text-slate-500">low stock</span>
              {summary.outOfStockCount > 0 && (
                <span className="text-xs font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                  {summary.outOfStockCount} zero stock
                </span>
              )}
            </div>
            <button
              id="btn-view-low-stock-kpi"
              onClick={() => onSelectTab('alerts')}
              className="text-xs text-amber-700 hover:text-amber-800 font-medium mt-1 underline"
            >
              Review reorder list →
            </button>
          </div>
        </div>

        {/* Stock Movements */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Movements
            </span>
            <div className="w-9 h-9 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
              <ArrowLeftRight className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900 tracking-tight">
              {summary.totalMovements}
            </div>
            <div className="flex items-center gap-2 text-xs mt-1">
              <span className="text-emerald-600 font-medium">+{summary.totalInUnits} Restocked</span>
              <span className="text-slate-300">•</span>
              <span className="text-rose-600 font-medium">-{summary.totalOutUnits} Sold</span>
            </div>
          </div>
        </div>
      </div>

      {/* Animal Feed vs Veterinary Medicine Comparative Overview (Structured Data - No Graphs) */}
      {feedVsMedicine && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-amber-200/80 shadow-xs bg-linear-to-br from-white to-amber-50/30">
            <div className="flex items-center justify-between pb-3 border-b border-amber-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
                  <Wheat className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Animal Feed Department</h4>
                  <p className="text-[11px] text-slate-500">Poultry, dairy, cattle & swine feeds</p>
                </div>
              </div>
              <span className="text-xs font-bold text-amber-800 bg-amber-100/80 px-2.5 py-0.5 rounded-full">
                {feedVsMedicine.feed.itemCount} SKUs
              </span>
            </div>
            <div className="grid grid-cols-3 gap-3 mt-3 pt-1 text-xs">
              <div>
                <span className="text-slate-400 text-[11px] block">Units in Stock</span>
                <span className="text-base font-bold text-slate-900">{feedVsMedicine.feed.totalUnits} bags/pk</span>
              </div>
              <div>
                <span className="text-slate-400 text-[11px] block">Procurement Cost</span>
                <span className="text-base font-semibold text-slate-700">${feedVsMedicine.feed.costBasis.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[11px] block">Stock Valuation</span>
                <span className="text-base font-bold text-amber-700">${feedVsMedicine.feed.valuation.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-indigo-200/80 shadow-xs bg-linear-to-br from-white to-indigo-50/30">
            <div className="flex items-center justify-between pb-3 border-b border-indigo-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-800 flex items-center justify-center">
                  <Pill className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Veterinary Medicine & Vaccines</h4>
                  <p className="text-[11px] text-slate-500">Antibiotics, dewormers, vitamins & dips</p>
                </div>
              </div>
              <span className="text-xs font-bold text-indigo-800 bg-indigo-100/80 px-2.5 py-0.5 rounded-full">
                {feedVsMedicine.medicine.itemCount} SKUs
              </span>
            </div>
            <div className="grid grid-cols-3 gap-3 mt-3 pt-1 text-xs">
              <div>
                <span className="text-slate-400 text-[11px] block">Units in Stock</span>
                <span className="text-base font-bold text-slate-900">{feedVsMedicine.medicine.totalUnits} vials/bottles</span>
              </div>
              <div>
                <span className="text-slate-400 text-[11px] block">Procurement Cost</span>
                <span className="text-base font-semibold text-slate-700">${feedVsMedicine.medicine.costBasis.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[11px] block">Stock Valuation</span>
                <span className="text-base font-bold text-indigo-700">${feedVsMedicine.medicine.valuation.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Top Profitable Items from Sales & Category Inventory Breakdown (Clean Tables - No Graphs) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Profitable Products Sold */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <Award className="w-4 h-4 text-emerald-600" />
                Top Profitable Items Sold
              </h3>
              <p className="text-xs text-slate-500">Ranked by actual net profit generated from sales</p>
            </div>
            <button
              id="btn-view-reports-profit"
              onClick={() => onSelectTab('reports')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
            >
              Full Profit Report →
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-semibold text-[11px]">
                  <th className="py-2.5 pr-2">Product</th>
                  <th className="py-2.5 px-2 text-right">Sold</th>
                  <th className="py-2.5 px-2 text-right">Revenue</th>
                  <th className="py-2.5 px-2 text-right">COGS</th>
                  <th className="py-2.5 pl-2 text-right">Realized Profit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {topProfitableProducts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-400">
                      No sales recorded yet. Use "Record Sale" to generate profit metrics.
                    </td>
                  </tr>
                ) : (
                  topProfitableProducts.map((p, idx) => (
                    <tr key={`${p.sku}-${idx}`} className="hover:bg-slate-50/70">
                      <td className="py-2.5 pr-2">
                        <div className="font-semibold text-slate-900 truncate max-w-[170px]">{p.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{p.sku}</div>
                      </td>
                      <td className="py-2.5 px-2 text-right font-medium text-slate-700">
                        {p.unitsSold}
                      </td>
                      <td className="py-2.5 px-2 text-right font-mono text-slate-700">
                        ${p.revenue.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-2 text-right font-mono text-slate-500">
                        ${p.cogs.toFixed(2)}
                      </td>
                      <td className="py-2.5 pl-2 text-right font-mono font-bold text-emerald-600">
                        +${p.profit.toFixed(2)}
                        <span className="block text-[10px] font-normal text-emerald-700">
                          {p.margin}%
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Category Stock Breakdown (Tabular - Replaced Donut Chart) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-600" />
                Stock Allocation by Category
              </h3>
              <p className="text-xs text-slate-500">Animal feed & veterinary medicine inventory balance</p>
            </div>
            <button
              id="btn-view-categories-table"
              onClick={() => onSelectTab('categories')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
            >
              Categories →
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-semibold text-[11px]">
                  <th className="py-2.5 pr-2">Category</th>
                  <th className="py-2.5 px-2 text-right">Items</th>
                  <th className="py-2.5 px-2 text-right">In-Stock</th>
                  <th className="py-2.5 pl-2 text-right">Stock Valuation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {categoryBreakdown.map(cat => (
                  <tr key={cat.name} className="hover:bg-slate-50/70">
                    <td className="py-2.5 pr-2 font-medium text-slate-800 truncate max-w-[180px]">
                      {cat.name}
                    </td>
                    <td className="py-2.5 px-2 text-right text-slate-600">
                      {cat.productCount}
                    </td>
                    <td className="py-2.5 px-2 text-right font-semibold text-slate-900 font-mono">
                      {cat.totalUnits}
                    </td>
                    <td className="py-2.5 pl-2 text-right font-mono font-bold text-indigo-600">
                      ${cat.totalValue.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Two Column Section: Recent Movements & Low Stock Warnings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Transactions List with Profit Tracking */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <ArrowLeftRight className="w-4 h-4 text-slate-600" />
                Recent Stock Movements & Sales
              </h3>
              <p className="text-xs text-slate-500">Live transaction history with realized sales profits</p>
            </div>
            <button
              id="btn-view-all-movements"
              onClick={() => onSelectTab('movements')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
            >
              All Movements →
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {recentMovements.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No recent stock movements recorded.</p>
            ) : (
              recentMovements.map(txn => (
                <div key={txn._id} className="py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={`inline-flex items-center justify-center w-8 h-8 rounded-xl font-bold text-xs shrink-0 ${
                        txn.type === 'IN'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {txn.type === 'IN' ? 'IN' : 'SALE'}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-800 truncate">
                        {txn.productName}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate">
                        {txn.productSku} • by <span className="font-medium text-slate-700">{txn.userName}</span>
                        {txn.type === 'OUT' && txn.profit !== undefined && txn.profit > 0 && (
                          <span className="ml-1.5 font-semibold text-emerald-600">
                            (Profit: +${txn.profit.toFixed(2)})
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span
                      className={`text-xs font-bold ${
                        txn.type === 'IN' ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {txn.type === 'IN' ? `+${txn.quantity}` : `-${txn.quantity}`}
                    </span>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {new Date(txn.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Critical Low Stock Items Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Attention Needed: Low Stock
              </h3>
              <p className="text-xs text-slate-500">Products currently below minimum reorder threshold</p>
            </div>
            <button
              id="btn-view-all-alerts"
              onClick={() => onSelectTab('alerts')}
              className="text-xs font-semibold text-amber-600 hover:text-amber-800"
            >
              Full Alerts List →
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {lowStockList.length === 0 ? (
              <div className="py-8 text-center text-xs text-emerald-600 flex flex-col items-center gap-1.5">
                <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                  ✓
                </div>
                <span>All feed and medicine stock levels are currently healthy!</span>
              </div>
            ) : (
              lowStockList.map(prod => (
                <div key={prod._id} className="py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-800 truncate">
                      {prod.name}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      SKU: <span className="font-mono text-slate-700">{prod.sku}</span> • Min Target: {prod.minStock} units
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                      {prod.quantity} remaining
                    </span>
                    <button
                      id={`btn-dashboard-restock-${prod._id}`}
                      onClick={() => onOpenQuickMovement(prod._id, 'IN')}
                      className="px-2.5 py-1 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-xs"
                    >
                      Restock
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
