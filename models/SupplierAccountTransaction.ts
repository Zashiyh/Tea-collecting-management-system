
import mongoose, { Schema, type Model } from "mongoose";

export type SupplierTransactionType =
  | "ADVANCE"
  | "LOAN"
  | "FERTILIZER";

export type DeductionMode = "FULL" | "INSTALLMENT";

export interface ILoanInstallment {
  monthKey: string;
  amount: number;
  deductedAmount: number;
  status: "PENDING" | "DEDUCTED";
  settlementId?: string;
  deductedAt?: Date;
}

export interface ISupplierAccountTransaction
  extends mongoose.Document {
  transactionId: string;
  supplierId: string;
  supplierName: string;
  type: SupplierTransactionType;
  amount: number;
  outstandingAmount: number;
  transactionDate: Date;
  deductionMode: DeductionMode;
  firstDeductionMonth: string;
  installmentMonths: number;
  monthlyInstallmentAmount: number;
  installments: ILoanInstallment[];
  fertilizerProductId?: string;
  fertilizerName?: string;
  fertilizerQuantity?: number;
  fertilizerUnit?: string;
  fertilizerUnitPrice?: number;
  notes?: string;
  status: "ACTIVE" | "SETTLED" | "CANCELLED";
}

const InstallmentSchema = new Schema<ILoanInstallment>(
  {
    monthKey: {
      type: String,
      required: true,
      match: /^\d{4}-(0[1-9]|1[0-2])$/,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    deductedAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: ["PENDING", "DEDUCTED"],
      default: "PENDING",
    },
    settlementId: String,
    deductedAt: Date,
  },
  { _id: false }
);

const SupplierAccountTransactionSchema =
  new Schema<ISupplierAccountTransaction>(
    {
      transactionId: {
        type: String,
        required: true,
        unique: true,
        index: true,
      },
      supplierId: {
        type: String,
        required: true,
        index: true,
      },
      supplierName: {
        type: String,
        required: true,
        trim: true,
      },
      type: {
        type: String,
        enum: ["ADVANCE", "LOAN", "FERTILIZER"],
        required: true,
      },
      amount: {
        type: Number,
        required: true,
        min: 0.01,
      },
      outstandingAmount: {
        type: Number,
        required: true,
        min: 0,
      },
      transactionDate: {
        type: Date,
        required: true,
        default: Date.now,
      },
      deductionMode: {
        type: String,
        enum: ["FULL", "INSTALLMENT"],
        default: "FULL",
      },
      firstDeductionMonth: {
        type: String,
        required: true,
        match: /^\d{4}-(0[1-9]|1[0-2])$/,
      },
      installmentMonths: {
        type: Number,
        default: 1,
        min: 1,
        max: 120,
      },
      monthlyInstallmentAmount: {
        type: Number,
        default: 0,
        min: 0,
      },
      installments: {
        type: [InstallmentSchema],
        default: [],
      },
      fertilizerProductId: String,
      fertilizerName: String,
      fertilizerQuantity: {
        type: Number,
        min: 0,
      },
      fertilizerUnit: String,
      fertilizerUnitPrice: {
        type: Number,
        min: 0,
      },
      notes: {
        type: String,
        trim: true,
        maxlength: 1000,
      },
      status: {
        type: String,
        enum: ["ACTIVE", "SETTLED", "CANCELLED"],
        default: "ACTIVE",
        index: true,
      },
    },
    { timestamps: true }
  );

SupplierAccountTransactionSchema.index({
  supplierId: 1,
  transactionDate: -1,
});

const SupplierAccountTransaction: Model<ISupplierAccountTransaction> =
  mongoose.models.SupplierAccountTransaction ||
  mongoose.model<ISupplierAccountTransaction>(
    "SupplierAccountTransaction",
    SupplierAccountTransactionSchema
  );

export default SupplierAccountTransaction;
