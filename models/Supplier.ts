import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISupplier extends Document {
  supplierId: string;
  name: string;
  phone: string;
  areaId: string;
  areaName: string;
  village: string;
  address?: string;
  status: "Active" | "Inactive";
  createdAt: Date;
  updatedAt: Date;
}

const SupplierSchema = new Schema<ISupplier>(
  {
    supplierId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    phone: {
      type: String,
      required: true,
      trim: true,
    },

    areaId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    areaName: {
      type: String,
      required: true,
      trim: true,
    },

    village: {
      type: String,
      required: true,
      trim: true,
    },

    address: {
      type: String,
      trim: true,
      default: "",
    },

    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },
  },
  {
    timestamps: true,
  }
);

SupplierSchema.index({ areaId: 1 });

const Supplier: Model<ISupplier> =
  mongoose.models.Supplier ||
  mongoose.model<ISupplier>("Supplier", SupplierSchema);

export default Supplier;