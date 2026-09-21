import { Request, Response } from 'express';
import { memoryStore } from '../db.ts';
import { CategoryModel } from '../models/Category.ts';

export const getCategories = async (req: Request, res: Response): Promise<void> => {
  try {
    const list = memoryStore.categories.map(cat => {
      const productCount = memoryStore.products.filter(p => p.category.toLowerCase() === cat.name.toLowerCase()).length;
      const totalUnits = memoryStore.products
        .filter(p => p.category.toLowerCase() === cat.name.toLowerCase())
        .reduce((sum, p) => sum + p.quantity, 0);
      return {
        ...cat,
        productCount,
        totalUnits,
      };
    });
    res.json(list);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error fetching categories' });
  }
};

export const createCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, description = '' } = req.body;
    if (!name || !name.trim()) {
      res.status(400).json({ message: 'Category name is required.' });
      return;
    }

    const cleanName = name.trim();
    if (memoryStore.categories.some(c => c.name.toLowerCase() === cleanName.toLowerCase())) {
      res.status(400).json({ message: `Category "${cleanName}" already exists.` });
      return;
    }

    const newCategory = {
      _id: `cat_${Date.now()}`,
      name: cleanName,
      description: description.trim(),
      createdAt: new Date(),
    };

    memoryStore.categories.push(newCategory);

    try {
      await CategoryModel.create(newCategory);
    } catch (e) {
      // fallback
    }

    res.status(201).json({ category: newCategory, message: 'Category created' });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error creating category' });
  }
};

export const updateCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    const cat = memoryStore.categories.find(c => c._id === id);
    if (!cat) {
      res.status(404).json({ message: 'Category not found' });
      return;
    }

    const oldName = cat.name;
    if (name && name.trim() !== oldName) {
      const newName = name.trim();
      // Check duplicate
      if (memoryStore.categories.some(c => c._id !== id && c.name.toLowerCase() === newName.toLowerCase())) {
        res.status(400).json({ message: `Category "${newName}" already exists.` });
        return;
      }
      cat.name = newName;
      // Cascade update products using old category name
      memoryStore.products.forEach(p => {
        if (p.category.toLowerCase() === oldName.toLowerCase()) {
          p.category = newName;
        }
      });
    }

    if (description !== undefined) {
      cat.description = description.trim();
    }

    try {
      await CategoryModel.findByIdAndUpdate(id, cat);
    } catch (e) {
      // fallback
    }

    res.json({ category: cat, message: 'Category updated successfully' });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error updating category' });
  }
};

export const deleteCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const index = memoryStore.categories.findIndex(c => c._id === id);
    if (index === -1) {
      res.status(404).json({ message: 'Category not found' });
      return;
    }

    const cat = memoryStore.categories[index];
    // Check if products exist in category
    const productsInCat = memoryStore.products.filter(p => p.category.toLowerCase() === cat.name.toLowerCase());
    if (productsInCat.length > 0) {
      res.status(400).json({
        message: `Cannot delete category "${cat.name}". There are ${productsInCat.length} products assigned to it. Please reassign them first.`
      });
      return;
    }

    memoryStore.categories.splice(index, 1);
    try {
      await CategoryModel.findByIdAndDelete(id);
    } catch (e) {
      // fallback
    }

    res.json({ message: `Category "${cat.name}" deleted successfully` });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error deleting category' });
  }
};
