import { Request, Response } from 'express';
import { memoryStore } from '../db.ts';
import { TransactionModel } from '../models/Transaction.ts';
import { ProductModel } from '../models/Product.ts';

export const getTransactions = async (req: Request, res: Response): Promise<void> => {
  try {
    const { type, search, limit = '100' } = req.query;

    let list = [...memoryStore.transactions];

    if (type && (type === 'IN' || type === 'OUT')) {
      list = list.filter(t => t.type === type);
    }

    if (search && typeof search === 'string') {
      const q = search.toLowerCase().trim();
      list = list.filter(t =>
        t.productName.toLowerCase().includes(q) ||
        t.productSku.toLowerCase().includes(q) ||
        t.userName.toLowerCase().includes(q) ||
        t.notes.toLowerCase().includes(q)
      );
    }

    // Sort descending by timestamp
    list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    const maxCount = Math.min(500, Number(limit) || 100);
    res.json(list.slice(0, maxCount));
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error fetching transactions' });
  }
};

export const createTransaction = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      productId,
      type,
      quantity,
      costPrice,
      unitCost,
      sellingPrice,
      unitPrice,
      updateProductCost = true,
      notes = ''
    } = req.body;

    if (!productId || !type || !quantity) {
      res.status(400).json({ message: 'Product ID, movement type (IN/OUT), and quantity are required.' });
      return;
    }

    if (type !== 'IN' && type !== 'OUT') {
      res.status(400).json({ message: 'Movement type must be either "IN" or "OUT".' });
      return;
    }

    const qtyNumber = Number(quantity);
    if (isNaN(qtyNumber) || qtyNumber <= 0 || !Number.isInteger(qtyNumber)) {
      res.status(400).json({ message: 'Quantity must be a positive whole integer.' });
      return;
    }

    // Locate product
    const product = memoryStore.products.find(p => p._id === productId);
    if (!product) {
      res.status(404).json({ message: 'Selected product does not exist in inventory.' });
      return;
    }

    // Stock-Out constraint: Cannot dispense more than available
    if (type === 'OUT' && product.quantity < qtyNumber) {
      res.status(400).json({
        message: `Insufficient stock for "${product.name}". Available inventory is ${product.quantity} unit(s), requested ${qtyNumber} unit(s).`
      });
      return;
    }

    // Determine unit cost and unit selling price
    let effectiveCost = product.costPrice;
    let effectivePrice = product.unitPrice;
    let totalRevenue = 0;
    let totalCost = 0;
    let profit = 0;
    let profitMargin = 0;

    if (type === 'IN') {
      // If admin restocks/adds in stock, capture the intake cost
      const inputCost = costPrice !== undefined ? Number(costPrice) : (unitCost !== undefined ? Number(unitCost) : product.costPrice);
      if (!isNaN(inputCost) && inputCost > 0) {
        effectiveCost = inputCost;
        if (updateProductCost) {
          product.costPrice = effectiveCost;
        }
      }
      totalCost = Math.round(qtyNumber * effectiveCost * 100) / 100;
      totalRevenue = 0;
      profit = 0;
      profitMargin = 0;
    } else {
      // When seller sells, calculate revenue, cost of goods sold, and net profit
      const inputPrice = sellingPrice !== undefined ? Number(sellingPrice) : (unitPrice !== undefined ? Number(unitPrice) : product.unitPrice);
      effectivePrice = (!isNaN(inputPrice) && inputPrice >= 0) ? inputPrice : product.unitPrice;
      effectiveCost = product.costPrice;

      totalRevenue = Math.round(qtyNumber * effectivePrice * 100) / 100;
      totalCost = Math.round(qtyNumber * effectiveCost * 100) / 100;
      profit = Math.round((totalRevenue - totalCost) * 100) / 100;
      profitMargin = totalRevenue > 0 ? Math.round(((profit / totalRevenue) * 100) * 10) / 10 : 0;
    }

    // Update product quantity automatically
    const previousQuantity = product.quantity;
    if (type === 'IN') {
      product.quantity += qtyNumber;
    } else {
      product.quantity -= qtyNumber;
    }

    const user = req.user || {
      id: 'usr_guest',
      name: 'System Operator',
      email: 'system@stockflow.com',
      role: 'User' as const,
    };

    const newTransaction = {
      _id: `txn_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      product: product._id,
      user: user.id,
      type: type as 'IN' | 'OUT',
      quantity: qtyNumber,
      notes: notes.trim(),
      timestamp: new Date(),
      productName: product.name,
      productSku: product.sku,
      category: product.category,
      userName: user.name,
      userRole: user.role,
      unitCost: effectiveCost,
      unitPrice: effectivePrice,
      totalRevenue,
      totalCost,
      profit,
      profitMargin,
    };

    memoryStore.transactions.unshift(newTransaction);

    // Persist to MongoDB if active
    try {
      await ProductModel.findByIdAndUpdate(product._id, {
        quantity: product.quantity,
        costPrice: product.costPrice
      });
      await TransactionModel.create(newTransaction);
    } catch (e) {
      // memory fallback
    }

    const actionMessage = type === 'IN'
      ? `Restocked ${qtyNumber} unit(s) of "${product.name}" at cost $${effectiveCost.toFixed(2)}/unit (Total Cost: $${totalCost.toFixed(2)}).`
      : `Recorded sale of ${qtyNumber} unit(s) for "${product.name}". Revenue: $${totalRevenue.toFixed(2)}, Cost: $${totalCost.toFixed(2)}, Realized Profit: +$${profit.toFixed(2)} (${profitMargin}% margin).`;

    res.status(201).json({
      transaction: newTransaction,
      product: {
        _id: product._id,
        name: product.name,
        sku: product.sku,
        costPrice: product.costPrice,
        unitPrice: product.unitPrice,
        previousQuantity,
        newQuantity: product.quantity,
      },
      message: actionMessage,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error recording transaction' });
  }
};
