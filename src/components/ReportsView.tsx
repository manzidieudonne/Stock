import React, { useState, useMemo } from 'react';
import {
  FileSpreadsheet,
  Download,
  Printer,
  DollarSign,
  TrendingUp,
  Package,
  Layers,
  ArrowLeftRight,
  Boxes,
  ShoppingBag,
  Receipt,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { Product, Category, Transaction, DashboardSummary } from '../types';

interface ReportsViewProps {
  products: Product[];
  categories: Category[];
  transactions: Transaction[];
  dashboard: DashboardSummary | null;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  products,
  categories,
  transactions,
  dashboard,
}) => {
  const [activeReportTab, setActiveReportTab] = useState<'sales_profit' | 'inventory_valuation'>('sales_profit');

  // Inventory Valuation Metrics
  const totalUnits = products.reduce((s, p) => s + p.quantity, 0);
  const totalRetailValue = products.reduce((s, p) => s + (p.quantity * p.unitPrice), 0);
  const totalCostValue = products.reduce((s, p) => s + (p.quantity * p.costPrice), 0);
  const projectedGrossMargin = totalRetailValue - totalCostValue;
  const projectedMarginPercentage = totalCostValue > 0 ? (projectedGrossMargin / totalCostValue) * 100 : 0;

  // Realized Sales & Profit Calculations from OUT transactions
  const salesTransactions = useMemo(() => {
    return transactions.filter(t => t.type === 'OUT');
  }, [transactions]);

  const salesFinancials = useMemo(() => {
    let totalRevenue = 0;
    let totalCogs = 0;
    let totalProfit = 0;
    let feedProfit = 0;
    let medProfit = 0;
    let feedRevenue = 0;
    let medRevenue = 0;

    salesTransactions.forEach(t => {
      const rev = t.totalRevenue !== undefined ? t.totalRevenue : (t.quantity * (t.unitPrice || 0));
      const cost = t.totalCost !== undefined ? t.totalCost : (t.quantity * (t.unitCost || 0));
      const p = t.profit !== undefined ? t.profit : (rev - cost);

      totalRevenue += rev;
      totalCogs += cost;
      totalProfit += p;

      // Classify Feed vs Medicine
      const nameAndNotes = `${t.productName} ${t.notes || ''}`.toLowerCase();
      if (/feed|pellet|grain|mash|bran|silage|hay|concentrate/i.test(nameAndNotes)) {
        feedProfit += p;
        feedRevenue += rev;
      } else if (/dewormer|vaccine|antibiotic|bolus|injection|supplement|vitamin|penicillin|oxytet/i.test(nameAndNotes)) {
        medProfit += p;
        medRevenue += rev;
      } else {
        // Fallback check in products catalog
        const prod = products.find(p => p._id === t.product || p.name === t.productName);
        if (prod && /feed/i.test(prod.category)) {
          feedProfit += p;
          feedRevenue += rev;
        } else {
          medProfit += p;
          medRevenue += rev;
        }
      }
    });

    const netMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
    return {
      totalRevenue,
      totalCogs,
      totalProfit,
      netMargin,
      feedProfit,
      medProfit,
      feedRevenue,
      medRevenue,
      totalSalesCount: salesTransactions.length,
      totalUnitsSold: salesTransactions.reduce((s, t) => s + t.quantity, 0),
    };
  }, [salesTransactions, products]);

  // Export Sales Profit to CSV
  const exportSalesProfitCSV = () => {
    const headers = [
      'Transaction ID',
      'Date & Time',
      'Product Name',
      'SKU',
      'Quantity Sold',
      'Unit Cost Price ($)',
      'Unit Selling Price ($)',
      'Total Revenue ($)',
      'Cost of Goods Sold (COGS) ($)',
      'Realized Profit ($)',
      'Profit Margin (%)',
      'Sold By (Seller)',
      'Reference / Notes',
    ];

    const rows = salesTransactions.map(t => {
      const dateStr = new Date(t.timestamp).toISOString();
      const unitCost = t.unitCost || 0;
      const unitPrice = t.unitPrice || 0;
      const rev = t.totalRevenue !== undefined ? t.totalRevenue : (t.quantity * unitPrice);
      const cost = t.totalCost !== undefined ? t.totalCost : (t.quantity * unitCost);
      const profit = t.profit !== undefined ? t.profit : (rev - cost);
      const margin = t.profitMargin !== undefined ? t.profitMargin : (rev > 0 ? (profit / rev) * 100 : 0);

      return [
        t._id,
        dateStr,
        `"${t.productName.replace(/"/g, '""')}"`,
        t.productSku,
        t.quantity,
        unitCost.toFixed(2),
        unitPrice.toFixed(2),
        rev.toFixed(2),
        cost.toFixed(2),
        profit.toFixed(2),
        margin.toFixed(1),
        `"${(t.userName || '').replace(/"/g, '""')}"`,
        `"${(t.notes || '').replace(/"/g, '""')}"`,
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [
      headers.join(','),
      ...rows.map(r => r.join(',')),
    ].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `sales_realized_profit_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export Inventory Valuation to CSV
  const exportValuationCSV = () => {
    const headers = [
      'Product ID',
      'Name',
      'SKU',
      'Category',
      'Quantity In Stock',
      'Min Reorder Level',
      'Cost Price ($)',
      'Retail Unit Price ($)',
      'Unit Profit ($)',
      'Total Cost Valuation ($)',
      'Total Retail Valuation ($)',
      'Projected Profit ($)',
      'Supplier',
    ];

    const rows = products.map(p => {
      const unitProfit = p.unitPrice - p.costPrice;
      const totalCost = p.quantity * p.costPrice;
      const totalRetail = p.quantity * p.unitPrice;
      const totalProfit = totalRetail - totalCost;

      return [
        p._id,
        `"${p.name.replace(/"/g, '""')}"`,
        p.sku,
        `"${p.category}"`,
        p.quantity,
        p.minStock,
        p.costPrice.toFixed(2),
        p.unitPrice.toFixed(2),
        unitProfit.toFixed(2),
        totalCost.toFixed(2),
        totalRetail.toFixed(2),
        totalProfit.toFixed(2),
        `"${p.supplier.replace(/"/g, '""')}"`,
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [
      headers.join(','),
      ...rows.map(r => r.join(',')),
    ].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `inventory_valuation_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header Bar with Mode Switcher & Export */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-indigo-600" />
            Financial Reports & Sales Profit Audit
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Realized seller profits, Cost of Goods Sold (COGS), and inventory asset valuation.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Report Tab Selector */}
          <div className="flex items-center bg-slate-100 rounded-xl p-1 text-xs font-semibold">
            <button
              onClick={() => setActiveReportTab('sales_profit')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                activeReportTab === 'sales_profit'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Receipt className="w-3.5 h-3.5 text-indigo-600" />
              <span>Sales & Realized Profit</span>
            </button>
            <button
              onClick={() => setActiveReportTab('inventory_valuation')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                activeReportTab === 'inventory_valuation'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Boxes className="w-3.5 h-3.5 text-emerald-600" />
              <span>Stock Valuation</span>
            </button>
          </div>

          <button
            id="btn-print-report"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>Print</span>
          </button>

          <button
            id="btn-export-csv"
            onClick={activeReportTab === 'sales_profit' ? exportSalesProfitCSV : exportValuationCSV}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-600/20"
          >
            <Download className="w-4 h-4" />
            <span>{activeReportTab === 'sales_profit' ? 'Export Sales Profit CSV' : 'Export Valuation CSV'}</span>
          </button>
        </div>
      </div>

      {/* VIEW 1: SALES & REALIZED PROFIT REPORT */}
      {activeReportTab === 'sales_profit' && (
        <div className="space-y-6">
          {/* Realized Sales KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Total Realized Revenue
              </span>
              <div className="text-2xl font-bold text-slate-900 mt-2 font-mono">
                ${salesFinancials.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                From {salesFinancials.totalUnitsSold} units sold ({salesFinancials.totalSalesCount} transactions)
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Cost of Goods Sold (COGS)
              </span>
              <div className="text-2xl font-bold text-slate-700 mt-2 font-mono">
                ${salesFinancials.totalCogs.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-slate-400 mt-1">Total procurement cost basis</p>
            </div>

            <div className="bg-emerald-50/70 p-5 rounded-2xl border border-emerald-200 shadow-xs">
              <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider">
                Total Realized Net Profit
              </span>
              <div className="text-2xl font-bold text-emerald-800 mt-2 font-mono">
                +${salesFinancials.totalProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-emerald-700 font-semibold mt-1">
                +{salesFinancials.netMargin.toFixed(1)}% Realized Net Margin
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Profit Breakdown (Feed vs Med)
              </span>
              <div className="mt-2 space-y-1 text-xs">
                <div className="flex justify-between font-medium">
                  <span className="text-amber-800">🌾 Animal Feed Profit:</span>
                  <span className="font-bold text-emerald-700 font-mono">+${salesFinancials.feedProfit.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span className="text-teal-800">💊 Medicine Profit:</span>
                  <span className="font-bold text-emerald-700 font-mono">+${salesFinancials.medProfit.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Seller Sales Profit Ledger Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-indigo-600" />
                  Seller Sales Profit Ledger & COGS Breakdown
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Every seller dispatch computes individual cost, revenue, net profit, and margin.
                </p>
              </div>
              <span className="text-xs text-slate-400 font-medium">
                {salesTransactions.length} recorded sales
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">Date & Time</th>
                    <th className="py-3 px-4">Product / SKU</th>
                    <th className="py-3 px-4 text-center">Qty Sold</th>
                    <th className="py-3 px-4">Unit Cost</th>
                    <th className="py-3 px-4">Selling Price</th>
                    <th className="py-3 px-4">Total Revenue</th>
                    <th className="py-3 px-4">COGS Cost</th>
                    <th className="py-3 px-4">Net Profit</th>
                    <th className="py-3 px-4">Seller</th>
                    <th className="py-3 px-4">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {salesTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-8 text-center text-slate-400">
                        No sales transactions recorded yet. Use "Record Movement" or Quick Action to log sales.
                      </td>
                    </tr>
                  ) : (
                    salesTransactions.map(t => {
                      const dateObj = new Date(t.timestamp);
                      const unitCost = t.unitCost || 0;
                      const unitPrice = t.unitPrice || 0;
                      const rev = t.totalRevenue !== undefined ? t.totalRevenue : (t.quantity * unitPrice);
                      const cost = t.totalCost !== undefined ? t.totalCost : (t.quantity * unitCost);
                      const profit = t.profit !== undefined ? t.profit : (rev - cost);
                      const margin = t.profitMargin !== undefined ? t.profitMargin : (rev > 0 ? (profit / rev) * 100 : 0);

                      return (
                        <tr key={t._id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-4 whitespace-nowrap text-slate-600">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" />
                              <span>{dateObj.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                              <span className="text-slate-400">{dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-semibold text-slate-900">{t.productName}</div>
                            <div className="font-mono text-[11px] text-slate-500">{t.productSku}</div>
                          </td>
                          <td className="py-3 px-4 text-center font-bold text-slate-900">
                            {t.quantity}
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-600">
                            ${unitCost.toFixed(2)}
                          </td>
                          <td className="py-3 px-4 font-mono font-semibold text-slate-900">
                            ${unitPrice.toFixed(2)}
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-slate-900">
                            ${rev.toFixed(2)}
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-500">
                            ${cost.toFixed(2)}
                          </td>
                          <td className="py-3 px-4 font-mono whitespace-nowrap">
                            <span className={`font-bold text-xs ${profit >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                              {profit >= 0 ? `+$${profit.toFixed(2)}` : `-$${Math.abs(profit).toFixed(2)}`}
                            </span>
                            <span className="text-[10px] text-slate-500 block">({margin.toFixed(1)}% margin)</span>
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className="font-medium text-slate-800">{t.userName}</span>
                            <span className="text-[10px] ml-1 px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                              {t.userRole}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-500 text-[11px]">
                            {t.notes || '—'}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: INVENTORY VALUATION REPORT */}
      {activeReportTab === 'inventory_valuation' && (
        <div className="space-y-6">
          {/* Financial Valuation Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Total Inventory Units
              </span>
              <div className="text-2xl font-bold text-slate-900 mt-2">
                {totalUnits.toLocaleString()} units
              </div>
              <p className="text-xs text-slate-400 mt-1">Across {products.length} distinct SKUs</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Total Cost Valuation (COGS Basis)
              </span>
              <div className="text-2xl font-bold text-slate-900 mt-2">
                ${totalCostValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-slate-400 mt-1">Procurement capital currently tied in stock</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Total Retail Valuation
              </span>
              <div className="text-2xl font-bold text-indigo-600 mt-2">
                ${totalRetailValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-slate-400 mt-1">Expected gross realization value</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Projected Gross Margin
              </span>
              <div className="text-2xl font-bold text-emerald-600 mt-2">
                +${projectedGrossMargin.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-emerald-700 font-medium mt-1">+{projectedMarginPercentage.toFixed(1)}% markup</p>
            </div>
          </div>

          {/* Category Valuation Breakdown Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-600" />
                Category Asset Capitalization Breakdown
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">Category Name</th>
                    <th className="py-3 px-4">Product Types</th>
                    <th className="py-3 px-4">Total Quantity</th>
                    <th className="py-3 px-4">Cost Basis ($)</th>
                    <th className="py-3 px-4">Retail Value ($)</th>
                    <th className="py-3 px-4 text-right">Potential Margin ($)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {categories.map(c => {
                    const catProducts = products.filter(p => p.category.toLowerCase() === c.name.toLowerCase());
                    const units = catProducts.reduce((s, p) => s + p.quantity, 0);
                    const cost = catProducts.reduce((s, p) => s + (p.quantity * p.costPrice), 0);
                    const retail = catProducts.reduce((s, p) => s + (p.quantity * p.unitPrice), 0);
                    const margin = retail - cost;

                    return (
                      <tr key={c._id} className="hover:bg-slate-50/70">
                        <td className="py-3 px-4 font-semibold text-slate-900">
                          {c.name}
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          {catProducts.length} items
                        </td>
                        <td className="py-3 px-4 font-mono font-medium text-slate-800">
                          {units} units
                        </td>
                        <td className="py-3 px-4 text-slate-600 font-mono">
                          ${cost.toFixed(2)}
                        </td>
                        <td className="py-3 px-4 font-semibold text-indigo-700 font-mono">
                          ${retail.toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-emerald-600 font-mono">
                          +${margin.toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
