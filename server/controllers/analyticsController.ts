import { Request, Response } from 'express';
import { memoryStore, getDatabaseStatus } from '../db.ts';

export const getDashboardAnalytics = async (req: Request, res: Response): Promise<void> => {
  try {
    const products = memoryStore.products;
    const transactions = memoryStore.transactions;

    const totalProductTypes = products.length;
    const totalInventoryUnits = products.reduce((sum, p) => sum + p.quantity, 0);

    const totalInventoryValue = products.reduce((sum, p) => sum + (p.quantity * p.unitPrice), 0);
    const totalCostValue = products.reduce((sum, p) => sum + (p.quantity * p.costPrice), 0);
    const potentialMargin = totalInventoryValue - totalCostValue;

    const lowStockItems = products.filter(p => p.quantity <= p.minStock && p.quantity > 0);
    const outOfStockItems = products.filter(p => p.quantity === 0);

    // Sales and Realized Profit Analysis from OUT transactions
    const salesTransactions = transactions.filter(t => t.type === 'OUT');
    let totalSalesRevenue = 0;
    let totalSalesCOGS = 0;
    let totalRealizedProfit = 0;

    // Profit by product accumulator
    const productProfitMap: Record<string, {
      name: string;
      sku: string;
      category: string;
      unitsSold: number;
      revenue: number;
      cogs: number;
      profit: number;
    }> = {};

    // Profit by category accumulator
    const categoryProfitMap: Record<string, {
      unitsSold: number;
      revenue: number;
      cogs: number;
      profit: number;
    }> = {};

    salesTransactions.forEach(t => {
      const prod = products.find(p => p._id === t.product);
      const unitCost = t.unitCost !== undefined ? t.unitCost : (prod?.costPrice ?? 0);
      const unitPrice = t.unitPrice !== undefined ? t.unitPrice : (prod?.unitPrice ?? 0);

      const revenue = t.totalRevenue !== undefined && t.totalRevenue > 0
        ? t.totalRevenue
        : t.quantity * unitPrice;
      const cogs = t.totalCost !== undefined && t.totalCost > 0
        ? t.totalCost
        : t.quantity * unitCost;
      const profit = t.profit !== undefined && t.profit !== 0
        ? t.profit
        : revenue - cogs;

      totalSalesRevenue += revenue;
      totalSalesCOGS += cogs;
      totalRealizedProfit += profit;

      const pKey = t.product || t.productSku || t.productName;
      if (!productProfitMap[pKey]) {
        productProfitMap[pKey] = {
          name: t.productName || prod?.name || 'Unknown Item',
          sku: t.productSku || prod?.sku || 'N/A',
          category: t.category || prod?.category || 'Animal Health',
          unitsSold: 0,
          revenue: 0,
          cogs: 0,
          profit: 0,
        };
      }
      productProfitMap[pKey].unitsSold += t.quantity;
      productProfitMap[pKey].revenue += revenue;
      productProfitMap[pKey].cogs += cogs;
      productProfitMap[pKey].profit += profit;

      const catKey = t.category || prod?.category || 'General';
      if (!categoryProfitMap[catKey]) {
        categoryProfitMap[catKey] = { unitsSold: 0, revenue: 0, cogs: 0, profit: 0 };
      }
      categoryProfitMap[catKey].unitsSold += t.quantity;
      categoryProfitMap[catKey].revenue += revenue;
      categoryProfitMap[catKey].cogs += cogs;
      categoryProfitMap[catKey].profit += profit;
    });

    const realizedProfitMargin = totalSalesRevenue > 0
      ? Math.round(((totalRealizedProfit / totalSalesRevenue) * 100) * 10) / 10
      : 0;

    const topProfitableProducts = Object.values(productProfitMap)
      .map(item => ({
        ...item,
        revenue: Math.round(item.revenue * 100) / 100,
        cogs: Math.round(item.cogs * 100) / 100,
        profit: Math.round(item.profit * 100) / 100,
        margin: item.revenue > 0 ? Math.round(((item.profit / item.revenue) * 100) * 10) / 10 : 0,
      }))
      .sort((a, b) => b.profit - a.profit)
      .slice(0, 6);

    // Feed vs Medicine breakdown
    const isFeed = (cat: string) => /feed|mash|crumble|pellet|meal/i.test(cat);
    const feedProducts = products.filter(p => isFeed(p.category));
    const medicineProducts = products.filter(p => !isFeed(p.category));

    const feedVsMedicine = {
      feed: {
        itemCount: feedProducts.length,
        totalUnits: feedProducts.reduce((sum, p) => sum + p.quantity, 0),
        valuation: Math.round(feedProducts.reduce((sum, p) => sum + (p.quantity * p.unitPrice), 0) * 100) / 100,
        costBasis: Math.round(feedProducts.reduce((sum, p) => sum + (p.quantity * p.costPrice), 0) * 100) / 100,
      },
      medicine: {
        itemCount: medicineProducts.length,
        totalUnits: medicineProducts.reduce((sum, p) => sum + p.quantity, 0),
        valuation: Math.round(medicineProducts.reduce((sum, p) => sum + (p.quantity * p.unitPrice), 0) * 100) / 100,
        costBasis: Math.round(medicineProducts.reduce((sum, p) => sum + (p.quantity * p.costPrice), 0) * 100) / 100,
      }
    };

    // Category breakdown
    const categoryMap: Record<string, { count: number; units: number; value: number; cost: number }> = {};
    products.forEach(p => {
      const cat = p.category || 'Uncategorized';
      if (!categoryMap[cat]) {
        categoryMap[cat] = { count: 0, units: 0, value: 0, cost: 0 };
      }
      categoryMap[cat].count += 1;
      categoryMap[cat].units += p.quantity;
      categoryMap[cat].value += p.quantity * p.unitPrice;
      categoryMap[cat].cost += p.quantity * p.costPrice;
    });

    const categoryBreakdown = Object.entries(categoryMap).map(([name, data]) => {
      const salesData = categoryProfitMap[name] || { unitsSold: 0, revenue: 0, cogs: 0, profit: 0 };
      return {
        name,
        productCount: data.count,
        totalUnits: data.units,
        totalValue: Math.round(data.value * 100) / 100,
        totalCost: Math.round(data.cost * 100) / 100,
        potentialProfit: Math.round((data.value - data.cost) * 100) / 100,
        soldUnits: salesData.unitsSold,
        salesRevenue: Math.round(salesData.revenue * 100) / 100,
        realizedProfit: Math.round(salesData.profit * 100) / 100,
      };
    });

    // Stock Movement summary
    const totalInTransactions = transactions.filter(t => t.type === 'IN').reduce((sum, t) => sum + t.quantity, 0);
    const totalOutTransactions = transactions.filter(t => t.type === 'OUT').reduce((sum, t) => sum + t.quantity, 0);

    // Recent movements
    const recentMovements = [...transactions]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 8);

    const dbStatus = getDatabaseStatus();

    res.json({
      summary: {
        totalProductTypes,
        totalInventoryUnits,
        totalInventoryValue: Math.round(totalInventoryValue * 100) / 100,
        totalCostValue: Math.round(totalCostValue * 100) / 100,
        potentialMargin: Math.round(potentialMargin * 100) / 100,
        lowStockCount: lowStockItems.length,
        outOfStockCount: outOfStockItems.length,
        totalMovements: transactions.length,
        totalInUnits: totalInTransactions,
        totalOutUnits: totalOutTransactions,
        // Sales & Realized Profit Performance
        totalSalesRevenue: Math.round(totalSalesRevenue * 100) / 100,
        totalSalesCOGS: Math.round(totalSalesCOGS * 100) / 100,
        totalRealizedProfit: Math.round(totalRealizedProfit * 100) / 100,
        realizedProfitMargin,
        completedSalesCount: salesTransactions.length,
      },
      feedVsMedicine,
      topProfitableProducts,
      categoryBreakdown,
      recentMovements,
      lowStockList: lowStockItems.slice(0, 6),
      outOfStockList: outOfStockItems.slice(0, 6),
      database: dbStatus,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error compiling dashboard analytics' });
  }
};
