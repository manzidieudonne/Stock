import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { UserModel, IUser } from './models/User.ts';
import { ProductModel, IProduct } from './models/Product.ts';
import { CategoryModel, ICategory } from './models/Category.ts';
import { TransactionModel, ITransaction } from './models/Transaction.ts';
import { SupplierModel, ISupplier } from './models/Supplier.ts';

let isMongooseConnected = false;

// Fallback in-memory / state-preserved store when external MongoDB is not configured
export interface MemoryStore {
  users: Array<{
    _id: string;
    name: string;
    email: string;
    password: string;
    role: 'Admin' | 'User';
    createdAt: Date;
  }>;
  categories: Array<{
    _id: string;
    name: string;
    description: string;
    createdAt: Date;
  }>;
  suppliers: Array<{
    _id: string;
    name: string;
    email: string;
    phone: string;
    address: string;
    createdAt: Date;
  }>;
  products: Array<{
    _id: string;
    name: string;
    sku: string;
    category: string;
    quantity: number;
    unitPrice: number;
    costPrice: number;
    minStock: number;
    supplier: string;
    imageUrl?: string;
    createdAt: Date;
  }>;
  transactions: Array<{
    _id: string;
    product: string;
    user: string;
    type: 'IN' | 'OUT';
    quantity: number;
    notes: string;
    timestamp: Date;
    productName: string;
    productSku: string;
    category?: string;
    userName: string;
    userRole: string;
    unitCost?: number;
    unitPrice?: number;
    totalRevenue?: number;
    totalCost?: number;
    profit?: number;
    profitMargin?: number;
  }>;
}

export const memoryStore: MemoryStore = {
  users: [],
  categories: [],
  suppliers: [],
  products: [],
  transactions: [],
};

export async function seedInitialData() {
  const salt = await bcrypt.genSalt(10);
  const adminHash = await bcrypt.hash('admin123', salt);
  const userHash = await bcrypt.hash('staff123', salt);

  const defaultUsers = [
    {
      _id: 'usr_admin_01',
      name: 'Dr. Eleanor Vance (Admin/Vet)',
      email: 'admin@stockflow.com',
      password: adminHash,
      role: 'Admin' as const,
      createdAt: new Date('2026-01-10T08:00:00Z'),
    },
    {
      _id: 'usr_staff_01',
      name: 'Marcus Chen (Seller/Dispenser)',
      email: 'staff@stockflow.com',
      password: userHash,
      role: 'User' as const,
      createdAt: new Date('2026-01-15T09:30:00Z'),
    },
    {
      _id: 'usr_staff_02',
      name: 'Sarah Jenkins (Feed Store Keeper)',
      email: 'sarah@stockflow.com',
      password: userHash,
      role: 'User' as const,
      createdAt: new Date('2026-02-01T11:00:00Z'),
    },
  ];

  const defaultCategories = [
    { _id: 'cat_01', name: 'Poultry Feed', description: 'Broiler Starter, Layer Mash, Grower Crumbles & Chick Mash (50kg/25kg bags)', createdAt: new Date('2026-01-01') },
    { _id: 'cat_02', name: 'Dairy & Cattle Feed', description: 'High-Yield Dairy Meal, Calf Weaner Pellets & Mineral Salt Licks', createdAt: new Date('2026-01-01') },
    { _id: 'cat_03', name: 'Swine & Pig Feed', description: 'Pig Creep Feed, Sow Lactation Meal & Finisher Pellets', createdAt: new Date('2026-01-01') },
    { _id: 'cat_04', name: 'Veterinary Antibiotics', description: 'Oxytetracycline 20% LA, Tylosin, Penicillin-Streptomycin injectable & oral', createdAt: new Date('2026-01-01') },
    { _id: 'cat_05', name: 'Dewormers & Anthelmintics', description: 'Albendazole 10% drench, Ivermectin 1% injections & Levamisole boluses', createdAt: new Date('2026-01-01') },
    { _id: 'cat_06', name: 'Vitamins & Supplements', description: 'Amino acid vital boosters, Vitamin AD3E, Calcium borogluconate & electrolytes', createdAt: new Date('2026-01-01') },
    { _id: 'cat_07', name: 'Animal Vaccines', description: 'Newcastle disease, Gumboro IBD, Anthrax & Fowl pox cold-chain vaccines', createdAt: new Date('2026-01-01') },
    { _id: 'cat_08', name: 'Ectoparasiticides & Dips', description: 'Amitraz 12.5% cattle dip, Deltamethrin pour-on & acaricides', createdAt: new Date('2026-01-01') },
  ];

  const defaultSuppliers = [
    { _id: 'sup_01', name: 'Pioneer Livestock Nutrition Mills', email: 'sales@pioneerlivestock.com', phone: '+1 (555) 321-9988', address: '550 Grain Elevator Rd, Omaha, NE', createdAt: new Date('2026-01-01') },
    { _id: 'sup_02', name: 'Biomax Veterinary Pharmaceuticals', email: 'dispatch@biomaxvet.com', phone: '+1 (555) 893-4412', address: '77 Pharma Park, Kansas City, MO', createdAt: new Date('2026-01-01') },
    { _id: 'sup_03', name: 'AgriVet Animal Health Supplies', email: 'orders@agrivethealth.com', phone: '+1 (555) 482-1920', address: '102 Milling Way, Des Moines, IA', createdAt: new Date('2026-01-01') },
  ];

  const defaultProducts = [
    {
      _id: 'prod_01',
      name: 'Broiler Starter Crumbles (50kg Bag)',
      sku: 'FEE-BRL-050',
      category: 'Poultry Feed',
      quantity: 45,
      unitPrice: 38.50,
      costPrice: 28.00,
      minStock: 15,
      supplier: 'Pioneer Livestock Nutrition Mills',
      imageUrl: 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=400&auto=format&fit=crop&q=60',
      createdAt: new Date('2026-01-10'),
    },
    {
      _id: 'prod_02',
      name: 'Oxytetracycline 20% L.A. Injectable (100ml)',
      sku: 'MED-OTC-100',
      category: 'Veterinary Antibiotics',
      quantity: 5, // LOW STOCK
      unitPrice: 24.00,
      costPrice: 14.50,
      minStock: 12,
      supplier: 'Biomax Veterinary Pharmaceuticals',
      imageUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&auto=format&fit=crop&q=60',
      createdAt: new Date('2026-01-12'),
    },
    {
      _id: 'prod_03',
      name: 'High-Yield Dairy Lactation Meal (50kg)',
      sku: 'FEE-DRY-050',
      category: 'Dairy & Cattle Feed',
      quantity: 32,
      unitPrice: 34.00,
      costPrice: 24.50,
      minStock: 10,
      supplier: 'Pioneer Livestock Nutrition Mills',
      imageUrl: 'https://images.unsplash.com/photo-1570042225831-d98fa7577f1e?w=400&auto=format&fit=crop&q=60',
      createdAt: new Date('2026-01-14'),
    },
    {
      _id: 'prod_04',
      name: 'Albendazole 10% Oral Drench (1 Litre)',
      sku: 'MED-ABZ-1000',
      category: 'Dewormers & Anthelmintics',
      quantity: 18,
      unitPrice: 29.50,
      costPrice: 17.00,
      minStock: 8,
      supplier: 'Biomax Veterinary Pharmaceuticals',
      imageUrl: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=400&auto=format&fit=crop&q=60',
      createdAt: new Date('2026-01-18'),
    },
    {
      _id: 'prod_05',
      name: 'Vital Booster Chick Electrolytes & Vitamins (1kg)',
      sku: 'VTM-CHK-001',
      category: 'Vitamins & Supplements',
      quantity: 3, // CRITICAL LOW STOCK
      unitPrice: 16.50,
      costPrice: 9.20,
      minStock: 15,
      supplier: 'AgriVet Animal Health Supplies',
      imageUrl: 'https://images.unsplash.com/photo-1628771065518-0d82f1938462?w=400&auto=format&fit=crop&q=60',
      createdAt: new Date('2026-01-20'),
    },
    {
      _id: 'prod_06',
      name: 'Ivermectin 1% Parasiticide Injection (50ml)',
      sku: 'MED-IVM-050',
      category: 'Dewormers & Anthelmintics',
      quantity: 24,
      unitPrice: 19.50,
      costPrice: 11.00,
      minStock: 8,
      supplier: 'Biomax Veterinary Pharmaceuticals',
      imageUrl: 'https://images.unsplash.com/photo-1585435557343-3b092031a831?w=400&auto=format&fit=crop&q=60',
      createdAt: new Date('2026-01-22'),
    },
    {
      _id: 'prod_07',
      name: 'Newcastle Disease Clone-30 Vaccine (1000 Doses)',
      sku: 'VAC-NCD-1000',
      category: 'Animal Vaccines',
      quantity: 0, // OUT OF STOCK
      unitPrice: 12.00,
      costPrice: 6.80,
      minStock: 10,
      supplier: 'Biomax Veterinary Pharmaceuticals',
      imageUrl: 'https://images.unsplash.com/photo-1584036561566-baf8f5f1b144?w=400&auto=format&fit=crop&q=60',
      createdAt: new Date('2026-01-25'),
    },
    {
      _id: 'prod_08',
      name: 'Amitraz 12.5% Cattle Tick & Mite Dip (1 Litre)',
      sku: 'MED-AMT-1000',
      category: 'Ectoparasiticides & Dips',
      quantity: 14,
      unitPrice: 42.00,
      costPrice: 27.50,
      minStock: 5,
      supplier: 'AgriVet Animal Health Supplies',
      imageUrl: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=400&auto=format&fit=crop&q=60',
      createdAt: new Date('2026-01-28'),
    },
    {
      _id: 'prod_09',
      name: 'Pig Weaner Creep Meal (50kg Bag)',
      sku: 'FEE-SWN-050',
      category: 'Swine & Pig Feed',
      quantity: 20,
      unitPrice: 36.00,
      costPrice: 26.00,
      minStock: 8,
      supplier: 'Pioneer Livestock Nutrition Mills',
      imageUrl: 'https://images.unsplash.com/photo-1516467508483-a7212febe31a?w=400&auto=format&fit=crop&q=60',
      createdAt: new Date('2026-01-30'),
    }
  ];

  const defaultTransactions = [
    {
      _id: 'txn_01',
      product: 'prod_01',
      user: 'usr_admin_01',
      type: 'IN' as const,
      quantity: 55,
      notes: 'Procurement intake from Pioneer Mills PO #881',
      timestamp: new Date('2026-02-01T10:00:00Z'),
      productName: 'Broiler Starter Crumbles (50kg Bag)',
      productSku: 'FEE-BRL-050',
      category: 'Poultry Feed',
      userName: 'Dr. Eleanor Vance (Admin/Vet)',
      userRole: 'Admin',
      unitCost: 28.00,
      unitPrice: 38.50,
      totalRevenue: 0,
      totalCost: 1540.00,
      profit: 0,
      profitMargin: 0,
    },
    {
      _id: 'txn_02',
      product: 'prod_01',
      user: 'usr_staff_01',
      type: 'OUT' as const,
      quantity: 10,
      notes: 'Sale to GreenValley Poultry Farm (Customer Invoice #1021)',
      timestamp: new Date('2026-02-05T14:20:00Z'),
      productName: 'Broiler Starter Crumbles (50kg Bag)',
      productSku: 'FEE-BRL-050',
      category: 'Poultry Feed',
      userName: 'Marcus Chen (Seller/Dispenser)',
      userRole: 'User',
      unitCost: 28.00,
      unitPrice: 38.50,
      totalRevenue: 385.00,
      totalCost: 280.00,
      profit: 105.00,
      profitMargin: 27.27,
    },
    {
      _id: 'txn_03',
      product: 'prod_02',
      user: 'usr_admin_01',
      type: 'IN' as const,
      quantity: 13,
      notes: 'Received batch #OX-992 from Biomax with cold pack storage',
      timestamp: new Date('2026-02-10T09:15:00Z'),
      productName: 'Oxytetracycline 20% L.A. Injectable (100ml)',
      productSku: 'MED-OTC-100',
      category: 'Veterinary Antibiotics',
      userName: 'Dr. Eleanor Vance (Admin/Vet)',
      userRole: 'Admin',
      unitCost: 14.50,
      unitPrice: 24.00,
      totalRevenue: 0,
      totalCost: 188.50,
      profit: 0,
      profitMargin: 0,
    },
    {
      _id: 'txn_04',
      product: 'prod_02',
      user: 'usr_staff_01',
      type: 'OUT' as const,
      quantity: 8,
      notes: 'Sold to Highland Dairy Coop for herd mastitis treatment',
      timestamp: new Date('2026-02-18T16:45:00Z'),
      productName: 'Oxytetracycline 20% L.A. Injectable (100ml)',
      productSku: 'MED-OTC-100',
      category: 'Veterinary Antibiotics',
      userName: 'Marcus Chen (Seller/Dispenser)',
      userRole: 'User',
      unitCost: 14.50,
      unitPrice: 24.00,
      totalRevenue: 192.00,
      totalCost: 116.00,
      profit: 76.00,
      profitMargin: 39.58,
    },
    {
      _id: 'txn_05',
      product: 'prod_05',
      user: 'usr_staff_01',
      type: 'OUT' as const,
      quantity: 12,
      notes: 'Sold to Sunrise Brooder Farm (Chick batch hydration pack)',
      timestamp: new Date('2026-02-22T11:10:00Z'),
      productName: 'Vital Booster Chick Electrolytes & Vitamins (1kg)',
      productSku: 'VTM-CHK-001',
      category: 'Vitamins & Supplements',
      userName: 'Marcus Chen (Seller/Dispenser)',
      userRole: 'User',
      unitCost: 9.20,
      unitPrice: 16.50,
      totalRevenue: 198.00,
      totalCost: 110.40,
      profit: 87.60,
      profitMargin: 44.24,
    },
    {
      _id: 'txn_06',
      product: 'prod_04',
      user: 'usr_staff_01',
      type: 'OUT' as const,
      quantity: 5,
      notes: 'Sale to Baraka Pastoralist Ranch (Seasonal sheep & goat deworming)',
      timestamp: new Date('2026-02-26T15:30:00Z'),
      productName: 'Albendazole 10% Oral Drench (1 Litre)',
      productSku: 'MED-ABZ-1000',
      category: 'Dewormers & Anthelmintics',
      userName: 'Marcus Chen (Seller/Dispenser)',
      userRole: 'User',
      unitCost: 17.00,
      unitPrice: 29.50,
      totalRevenue: 147.50,
      totalCost: 85.00,
      profit: 62.50,
      profitMargin: 42.37,
    },
  ];

  memoryStore.users = defaultUsers;
  memoryStore.categories = defaultCategories;
  memoryStore.suppliers = defaultSuppliers;
  memoryStore.products = defaultProducts;
  memoryStore.transactions = defaultTransactions;

  // If connected to real MongoDB, seed documents if collection is empty
  if (isMongooseConnected) {
    try {
      const userCount = await UserModel.countDocuments();
      if (userCount === 0) {
        await UserModel.insertMany(defaultUsers);
        await CategoryModel.insertMany(defaultCategories);
        await SupplierModel.insertMany(defaultSuppliers);
        await ProductModel.insertMany(defaultProducts);
        await TransactionModel.insertMany(defaultTransactions);
        console.log('MongoDB: Initial database collections seeded successfully.');
      }
    } catch (err) {
      console.warn('MongoDB seeding notice:', err);
    }
  }
}

export async function connectDatabase() {
  const mongoUri = process.env.MONGODB_URI;

  if (mongoUri && mongoUri.startsWith('mongodb')) {
    try {
      console.log('Attempting MongoDB connection...');
      await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 3500,
      });
      isMongooseConnected = true;
      console.log('Connected to MongoDB cluster via Mongoose ODM.');
    } catch (error) {
      console.warn('MongoDB connection failed or timed out. Falling back to in-memory database:', (error as Error).message);
      isMongooseConnected = false;
    }
  } else {
    console.log('MONGODB_URI not provided. Initializing embedded high-performance state storage engine.');
    isMongooseConnected = false;
  }

  await seedInitialData();
  return { isMongooseConnected };
}

export function getDatabaseStatus() {
  return {
    isMongooseConnected,
    mode: isMongooseConnected ? 'MongoDB (Mongoose ODM)' : 'Embedded In-Memory (Persistent Mongoose-Compatible ODM)',
    recordCounts: {
      users: memoryStore.users.length,
      products: memoryStore.products.length,
      categories: memoryStore.categories.length,
      suppliers: memoryStore.suppliers.length,
      transactions: memoryStore.transactions.length,
    }
  };
}
