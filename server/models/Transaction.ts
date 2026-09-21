import mongoose, { Document, Schema } from 'mongoose';

export interface ITransaction extends Document {
  product: mongoose.Types.ObjectId | string;
  user: mongoose.Types.ObjectId | string;
  type: 'IN' | 'OUT';
  quantity: number;
  notes?: string;
  timestamp: Date;
  // Denormalized details for high-performance reporting
  productName?: string;
  productSku?: string;
  category?: string;
  userName?: string;
  userRole?: string;
  // Financial & Profit calculation fields
  unitCost?: number;     // Cost price per unit at transaction time
  unitPrice?: number;    // Selling price per unit at transaction time
  totalRevenue?: number; // Total gross revenue for sales (quantity * unitPrice)
  totalCost?: number;    // Total cost of goods sold or acquired (quantity * unitCost)
  profit?: number;       // Net profit realized on sale (totalRevenue - totalCost)
  profitMargin?: number; // Profit margin percentage ((profit / totalRevenue) * 100)
}

export const transactionSchema = new Schema<ITransaction>({
  product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['IN', 'OUT'], required: true },
  quantity: { type: Number, required: true, min: 1 },
  notes: { type: String, default: '', trim: true },
  timestamp: { type: Date, default: Date.now },
  productName: { type: String },
  productSku: { type: String },
  category: { type: String },
  userName: { type: String },
  userRole: { type: String },
  unitCost: { type: Number, default: 0 },
  unitPrice: { type: Number, default: 0 },
  totalRevenue: { type: Number, default: 0 },
  totalCost: { type: Number, default: 0 },
  profit: { type: Number, default: 0 },
  profitMargin: { type: Number, default: 0 },
});

export const TransactionModel = mongoose.models.Transaction || mongoose.model<ITransaction>('Transaction', transactionSchema);
