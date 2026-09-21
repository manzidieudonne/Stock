import mongoose, { Document, Schema } from 'mongoose';

export interface IProduct extends Document {
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
}

export const productSchema = new Schema<IProduct>({
  name: { type: String, required: true, trim: true },
  sku: { type: String, required: true, unique: true, uppercase: true, trim: true },
  category: { type: String, required: true, trim: true },
  quantity: { type: Number, required: true, default: 0, min: 0 },
  unitPrice: { type: Number, required: true, min: 0 },
  costPrice: { type: Number, required: true, min: 0 },
  minStock: { type: Number, required: true, default: 5, min: 0 },
  supplier: { type: String, required: true, trim: true },
  imageUrl: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
});

export const ProductModel = mongoose.models.Product || mongoose.model<IProduct>('Product', productSchema);
