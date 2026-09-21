import { Router } from 'express';
import { login, register, getMe, updateProfile } from './controllers/authController.ts';
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} from './controllers/productController.ts';
import {
  getTransactions,
  createTransaction,
} from './controllers/transactionController.ts';
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from './controllers/categoryController.ts';
import {
  getSuppliers,
  createSupplier,
  updateSupplier,
  deleteSupplier,
} from './controllers/supplierController.ts';
import {
  getUsers,
  createUser,
  updateUserRole,
  deleteUser,
} from './controllers/userController.ts';
import { getDashboardAnalytics } from './controllers/analyticsController.ts';
import { authenticateToken, requireAdmin } from './middleware/auth.ts';
import { getDatabaseStatus } from './db.ts';

const router = Router();

// Health and DB status
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date(), ...getDatabaseStatus() });
});

// Authentication routes
router.post('/auth/login', login);
router.post('/auth/register', register);
router.get('/auth/me', authenticateToken, getMe);
router.put('/auth/profile', authenticateToken, updateProfile);

// Product routes
router.get('/products', authenticateToken, getProducts);
router.get('/products/:id', authenticateToken, getProductById);
router.post('/products', authenticateToken, requireAdmin, createProduct);
router.put('/products/:id', authenticateToken, requireAdmin, updateProduct);
router.delete('/products/:id', authenticateToken, requireAdmin, deleteProduct);

// Stock Transactions / Movements routes (accessible by both Admin and Standard Users)
router.get('/transactions', authenticateToken, getTransactions);
router.post('/transactions', authenticateToken, createTransaction);

// Category routes
router.get('/categories', authenticateToken, getCategories);
router.post('/categories', authenticateToken, requireAdmin, createCategory);
router.put('/categories/:id', authenticateToken, requireAdmin, updateCategory);
router.delete('/categories/:id', authenticateToken, requireAdmin, deleteCategory);

// Supplier routes
router.get('/suppliers', authenticateToken, getSuppliers);
router.post('/suppliers', authenticateToken, requireAdmin, createSupplier);
router.put('/suppliers/:id', authenticateToken, requireAdmin, updateSupplier);
router.delete('/suppliers/:id', authenticateToken, requireAdmin, deleteSupplier);

// User Management routes (Admin only)
router.get('/users', authenticateToken, requireAdmin, getUsers);
router.post('/users', authenticateToken, requireAdmin, createUser);
router.patch('/users/:id/role', authenticateToken, requireAdmin, updateUserRole);
router.delete('/users/:id', authenticateToken, requireAdmin, deleteUser);

// Analytics & Reports
router.get('/analytics/dashboard', authenticateToken, getDashboardAnalytics);

export default router;
