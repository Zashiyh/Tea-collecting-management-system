
import mongoose, { Schema, type Model } from "mongoose";

export interface ISettlementDeduction {
  transactionId: string;
  type: "ADVANCE" | "LOAN" | "FERTILIZER";
  description: string;
  amount: number;
}

export interface ISupplierMonthlySettlement
  extends mongoose.Document {
  settlementId: string;
  supplierId: string;
  supplierName: string;
  monthKey: string;
  totalKg: number;
  ratePerKg: number;
  grossAmount: number;
  deductions: ISettlementDeduction[];
  totalDeductions: number;
  netAmount: number;
  status: "DRAFT" | "FINALIZED" | "PAID";
  finalizedAt?: Date;
  paidAt?: Date;
  paymentReference?: string;
  notes?: string;
}

const SettlementDeductionSchema =
  new Schema<ISettlementDeduction>(
    {
      transactionId: {
        type: String,
        required: true,
      },
      type: {
        type: String,
        enum: ["ADVANCE", "LOAN", "FERTILIZER"],
        required: true,
      },
      description: {
        type: String,
        required: true,
      },
      amount: {
        type: Number,
        required: true,
        min: 0,
      },
    },
    { _id: false }
  );

const SupplierMonthlySettlementSchema =
  new Schema<ISupplierMonthlySettlement>(
    {
      settlementId: {
        type: String,
        required: true,
        unique: true,
      },
      supplierId: {
        type: String,
        required: true,
      },
      supplierName: {
        type: String,
        required: true,
      },
      monthKey: {
        type: String,
        required: true,
        match: /^\d{4}-(0[1-9]|1[0-2])$/,
      },
      totalKg: {
        type: Number,
        required: true,
        min: 0,
      },
      ratePerKg: {
        type: Number,
        required: true,
        min: 0,
      },
      grossAmount: {
        type: Number,
        required: true,
        min: 0,
      },
      deductions: {
        type: [SettlementDeductionSchema],
        default: [],
      },
      totalDeductions: {
        type: Number,
        required: true,
        min: 0,
      },
      netAmount: {
        type: Number,
        required: true,
        min: 0,
      },
      status: {
        type: String,
        enum: ["DRAFT", "FINALIZED", "PAID"],
        default: "DRAFT",
      },
      finalizedAt: Date,
      paidAt: Date,
      paymentReference: String,
      notes: {
        type: String,
        trim: true,
        maxlength: 1000,
      },
    },
    { timestamps: true }
  );

SupplierMonthlySettlementSchema.index(
  { supplierId: 1, monthKey: 1 },
  { unique: true }
);

const SupplierMonthlySettlement: Model<ISupplierMonthlySettlement> =
  mongoose.models.SupplierMonthlySettlement ||
  mongoose.model<ISupplierMonthlySettlement>(
    "SupplierMonthlySettlement",
    SupplierMonthlySettlementSchema
  );

export default SupplierMonthlySettlement;
