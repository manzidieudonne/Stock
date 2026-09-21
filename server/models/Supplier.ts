import mongoose, { Document, Schema } from 'mongoose';

export interface ISupplier extends Document {
  name: string;
  email: string;
  phone: string;
  address?: string;
  createdAt: Date;
}

export const supplierSchema = new Schema<ISupplier>({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true },
  phone: { type: String, required: true, trim: true },
  address: { type: String, default: '', trim: true },
  createdAt: { type: Date, default: Date.now },
});

export const SupplierModel = mongoose.models.Supplier || mongoose.model<ISupplier>('Supplier', supplierSchema);
