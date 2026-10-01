import mongoose, { Schema, Document, Model } from "mongoose";

export interface ITeaCollection extends Document {
  collectionId: string;
  date: Date;

  areaId: string;
  areaName: string;

  supplierId: string;
  supplierName: string;

  weightKg: number;
  ratePerKg: number;
  totalAmount: number;

  notes?: string;
  recordedBy?: string;

  createdAt: Date;
  updatedAt: Date;
}

const TeaCollectionSchema = new Schema<ITeaCollection>(
  {
    collectionId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    date: {
      type: Date,
      required: true,
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

    supplierId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    supplierName: {
      type: String,
      required: true,
      trim: true,
    },

    weightKg: {
      type: Number,
      required: true,
      min: 0,
    },

    ratePerKg: {
      type: Number,
      required: true,
      min: 0,
    },

    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    notes: {
      type: String,
      default: "",
      trim: true,
    },

    recordedBy: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

TeaCollectionSchema.index({
  areaId: 1,
  date: 1,
});

TeaCollectionSchema.index({
  supplierId: 1,
  date: 1,
});

const TeaCollection: Model<ITeaCollection> =
  mongoose.models.TeaCollection ||
  mongoose.model<ITeaCollection>(
    "TeaCollection",
    TeaCollectionSchema
  );

export default TeaCollection;