import { Request, Response } from 'express';
import { memoryStore } from '../db.ts';
import { SupplierModel } from '../models/Supplier.ts';

export const getSuppliers = async (req: Request, res: Response): Promise<void> => {
  try {
    const list = memoryStore.suppliers.map(s => {
      const suppliedProducts = memoryStore.products.filter(p => p.supplier.toLowerCase() === s.name.toLowerCase());
      return {
        ...s,
        productsCount: suppliedProducts.length,
      };
    });
    res.json(list);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error fetching suppliers' });
  }
};

export const createSupplier = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, phone, address = '' } = req.body;
    if (!name || !email || !phone) {
      res.status(400).json({ message: 'Name, email, and phone number are required.' });
      return;
    }

    const cleanName = name.trim();
    if (memoryStore.suppliers.some(s => s.name.toLowerCase() === cleanName.toLowerCase())) {
      res.status(400).json({ message: `Supplier "${cleanName}" already exists.` });
      return;
    }

    const newSupplier = {
      _id: `sup_${Date.now()}`,
      name: cleanName,
      email: email.trim(),
      phone: phone.trim(),
      address: address.trim(),
      createdAt: new Date(),
    };

    memoryStore.suppliers.push(newSupplier);

    try {
      await SupplierModel.create(newSupplier);
    } catch (e) {
      // fallback
    }

    res.status(201).json({ supplier: newSupplier, message: 'Supplier registered successfully' });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error creating supplier' });
  }
};

export const updateSupplier = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, email, phone, address } = req.body;

    const supplier = memoryStore.suppliers.find(s => s._id === id);
    if (!supplier) {
      res.status(404).json({ message: 'Supplier not found' });
      return;
    }

    const oldName = supplier.name;
    if (name && name.trim() !== oldName) {
      const newName = name.trim();
      supplier.name = newName;
      // Cascade to products
      memoryStore.products.forEach(p => {
        if (p.supplier.toLowerCase() === oldName.toLowerCase()) {
          p.supplier = newName;
        }
      });
    }

    if (email) supplier.email = email.trim();
    if (phone) supplier.phone = phone.trim();
    if (address !== undefined) supplier.address = address.trim();

    try {
      await SupplierModel.findByIdAndUpdate(id, supplier);
    } catch (e) {
      // fallback
    }

    res.json({ supplier, message: 'Supplier updated successfully' });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error updating supplier' });
  }
};

export const deleteSupplier = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const index = memoryStore.suppliers.findIndex(s => s._id === id);
    if (index === -1) {
      res.status(404).json({ message: 'Supplier not found' });
      return;
    }

    const supplier = memoryStore.suppliers[index];
    memoryStore.suppliers.splice(index, 1);

    try {
      await SupplierModel.findByIdAndDelete(id);
    } catch (e) {
      // fallback
    }

    res.json({ message: `Supplier "${supplier.name}" removed.` });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error deleting supplier' });
  }
};
