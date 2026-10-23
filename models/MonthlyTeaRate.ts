
import mongoose, { Schema, type Model } from "mongoose";

export interface IMonthlyTeaRate extends mongoose.Document {
  monthKey: string;
  supplierId: string;
  supplierName?: string;
  ratePerKg: number;
  notes?: string;
}

const MonthlyTeaRateSchema = new Schema<IMonthlyTeaRate>(
  {
    monthKey: {
      type: String,
      required: true,
      match: /^\d{4}-(0[1-9]|1[0-2])$/,
    },
    // "__DEFAULT__" means the factory-wide monthly rate.
    supplierId: {
      type: String,
      required: true,
      default: "__DEFAULT__",
    },
    supplierName: {
      type: String,
      trim: true,
    },
    ratePerKg: {
      type: Number,
      required: true,
      min: 0,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 500,
    },
  },
  { timestamps: true }
);

MonthlyTeaRateSchema.index(
  { monthKey: 1, supplierId: 1 },
  { unique: true }
);

const MonthlyTeaRate: Model<IMonthlyTeaRate> =
  mongoose.models.MonthlyTeaRate ||
  mongoose.model<IMonthlyTeaRate>(
    "MonthlyTeaRate",
    MonthlyTeaRateSchema
  );

export default MonthlyTeaRate;
