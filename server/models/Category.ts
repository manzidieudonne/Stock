import mongoose, { Document, Schema } from 'mongoose';

export interface ICategory extends Document {
  name: string;
  description?: string;
  createdAt: Date;
}

export const categorySchema = new Schema<ICategory>({
  name: { type: String, required: true, unique: true, trim: true },
  description: { type: String, default: '', trim: true },
  createdAt: { type: Date, default: Date.now },
});

export const CategoryModel = mongoose.models.Category || mongoose.model<ICategory>('Category', categorySchema);
