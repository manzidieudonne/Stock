import { Request, Response } from 'express';
import { memoryStore } from '../db.ts';
import { ProductModel } from '../models/Product.ts';
import { TransactionModel } from '../models/Transaction.ts';

export const getProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { search, category, status, sortBy, order = 'asc' } = req.query;

    let items = [...memoryStore.products];

    // Search filter
    if (search && typeof search === 'string') {
      const q = search.toLowerCase().trim();
      items = items.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.supplier.toLowerCase().includes(q)
      );
    }

    // Category filter
    if (category && typeof category === 'string' && category !== 'All') {
      items = items.filter(p => p.category.toLowerCase() === category.toLowerCase());
    }

    // Status filter
    if (status && typeof status === 'string') {
      if (status === 'low') {
        items = items.filter(p => p.quantity <= p.minStock && p.quantity > 0);
      } else if (status === 'out') {
        items = items.filter(p => p.quantity === 0);
      } else if (status === 'in-stock') {
        items = items.filter(p => p.quantity > p.minStock);
      }
    }

    // Sorting
    const sortField = (sortBy as string) || 'name';
    const sortDir = order === 'desc' ? -1 : 1;

    items.sort((a: any, b: any) => {
      let valA = a[sortField];
      let valB = b[sortField];
      if (typeof valA === 'string') {
        return valA.localeCompare(valB) * sortDir;
      }
      return ((valA ?? 0) - (valB ?? 0)) * sortDir;
    });

    res.json(items);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error fetching products' });
  }
};

export const getProductById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const product = memoryStore.products.find(p => p._id === id);
    if (!product) {
      res.status(404).json({ message: 'Product not found' });
      return;
    }

    // Include recent transactions for this product
    const transactions = memoryStore.transactions
      .filter(t => t.product === id)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10);

    res.json({ product, transactions });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error fetching product' });
  }
};

export const createProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      name,
      sku,
      category,
      quantity = 0,
      unitPrice,
      costPrice,
      minStock = 5,
      supplier,
      imageUrl = '',
    } = req.body;

    if (!name || !sku || !category || unitPrice === undefined || costPrice === undefined || !supplier) {
      res.status(400).json({ message: 'Missing required fields: Product title, SKU, Category, Cost Price, Selling Price, and Supplier are all required.' });
      return;
    }

    const numCostPrice = Number(costPrice);
    const numUnitPrice = Number(unitPrice);

    if (isNaN(numCostPrice) || numCostPrice <= 0) {
      res.status(400).json({ message: 'Procurement Cost Price is required and must be greater than $0.00.' });
      return;
    }

    if (isNaN(numUnitPrice) || numUnitPrice < 0) {
      res.status(400).json({ message: 'Selling Unit Price must be a valid non-negative number.' });
      return;
    }

    const cleanSku = sku.toUpperCase().trim();
    if (memoryStore.products.some(p => p.sku === cleanSku)) {
      res.status(400).json({ message: `A product with SKU "${cleanSku}" already exists.` });
      return;
    }

    const newProduct = {
      _id: `prod_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: name.trim(),
      sku: cleanSku,
      category: category.trim(),
      quantity: Math.max(0, Number(quantity) || 0),
      unitPrice: numUnitPrice,
      costPrice: numCostPrice,
      minStock: Math.max(0, Number(minStock) || 0),
      supplier: supplier.trim(),
      imageUrl: imageUrl.trim(),
      createdAt: new Date(),
    };

    memoryStore.products.unshift(newProduct);

    // If initial quantity > 0, log an initial IN transaction with cost details
    if (newProduct.quantity > 0) {
      const operator = req.user || {
        id: 'usr_admin',
        name: 'Inventory Administrator',
        role: 'Admin'
      };

      const initialTxn = {
        _id: `txn_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        product: newProduct._id,
        user: operator.id,
        type: 'IN' as const,
        quantity: newProduct.quantity,
        notes: `Initial stock intake (${newProduct.quantity} units @ $${numCostPrice.toFixed(2)} cost)`,
        timestamp: new Date(),
        productName: newProduct.name,
        productSku: newProduct.sku,
        category: newProduct.category,
        userName: operator.name,
        userRole: operator.role,
        unitCost: numCostPrice,
        unitPrice: numUnitPrice,
        totalRevenue: 0,
        totalCost: newProduct.quantity * numCostPrice,
        profit: 0,
        profitMargin: 0,
      };
      memoryStore.transactions.unshift(initialTxn);
    }

    // Persist to MongoDB if active
    try {
      await ProductModel.create(newProduct);
    } catch (e) {
      // memory fallback
    }

    res.status(201).json({ product: newProduct, message: 'Product created successfully' });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error creating product' });
  }
};

export const updateProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      name,
      sku,
      category,
      unitPrice,
      costPrice,
      minStock,
      supplier,
      imageUrl,
      quantity,
    } = req.body;

    const index = memoryStore.products.findIndex(p => p._id === id);
    if (index === -1) {
      res.status(404).json({ message: 'Product not found' });
      return;
    }

    const current = memoryStore.products[index];

    // Check SKU conflict
    if (sku && sku.toUpperCase().trim() !== current.sku) {
      const cleanSku = sku.toUpperCase().trim();
      if (memoryStore.products.some(p => p._id !== id && p.sku === cleanSku)) {
        res.status(400).json({ message: `SKU "${cleanSku}" is already used by another item.` });
        return;
      }
      current.sku = cleanSku;
    }

    if (name) current.name = name.trim();
    if (category) current.category = category.trim();
    if (unitPrice !== undefined) current.unitPrice = Number(unitPrice);
    if (costPrice !== undefined) current.costPrice = Number(costPrice);
    if (minStock !== undefined) current.minStock = Math.max(0, Number(minStock));
    if (supplier) current.supplier = supplier.trim();
    if (imageUrl !== undefined) current.imageUrl = imageUrl.trim();

    // If quantity is adjusted directly
    if (quantity !== undefined && Number(quantity) !== current.quantity) {
      const prevQty = current.quantity;
      const newQty = Math.max(0, Number(quantity));
      const diff = newQty - prevQty;
      current.quantity = newQty;

      if (diff !== 0 && req.user) {
        memoryStore.transactions.unshift({
          _id: `txn_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          product: current._id,
          user: req.user.id,
          type: diff > 0 ? 'IN' : 'OUT',
          quantity: Math.abs(diff),
          notes: `Direct manual stock level adjustment from ${prevQty} to ${newQty}`,
          timestamp: new Date(),
          productName: current.name,
          productSku: current.sku,
          userName: req.user.name,
          userRole: req.user.role,
        });
      }
    }

    // Try MongoDB sync
    try {
      await ProductModel.findByIdAndUpdate(id, current);
    } catch (e) {
      // memory fallback
    }

    res.json({ product: current, message: 'Product updated successfully' });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error updating product' });
  }
};

export const deleteProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const index = memoryStore.products.findIndex(p => p._id === id);
    if (index === -1) {
      res.status(404).json({ message: 'Product not found' });
      return;
    }

    const deleted = memoryStore.products.splice(index, 1)[0];

    // Try MongoDB delete
    try {
      await ProductModel.findByIdAndDelete(id);
    } catch (e) {
      // fallback
    }

    res.json({ message: `Product "${deleted.name}" removed from inventory.`, id });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error deleting product' });
  }
};
