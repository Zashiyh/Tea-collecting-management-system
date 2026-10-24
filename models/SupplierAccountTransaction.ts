
import mongoose, { Schema } from "mongoose";

export type SupplierTransactionType = "ADVANCE" | "LOAN" | "FERTILIZER";
export type DeductionMode = "FULL" | "INSTALLMENT";
export type InstallmentStatus = "PENDING" | "DEDUCTED";
export type TransactionStatus = "ACTIVE" | "SETTLED" | "CANCELLED";

export interface ILoanInstallment {
  monthKey: string;
  amount: number;
  deductedAmount: number;
  status: InstallmentStatus;
  settlementId?: string;
  deductedAt?: Date;
}

export interface ISupplierPayment {
  paymentId: string;
  amount: number;
  paymentDate: Date;
  notes?: string;
  createdAt: Date;
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
  firstDeductionMonth?: string;
  installmentMonths?: number;
  monthlyInstallmentAmount?: number;
  installments: ILoanInstallment[];
  payments: ISupplierPayment[];
  fertilizerName?: string;
  fertilizerProductId?: string;
  fertilizerQuantity?: number;
  fertilizerUnit?: string;
  notes?: string;
  status: TransactionStatus;
}

const InstallmentSchema = new Schema<ILoanInstallment>(
  {
    monthKey: { type: String, required: true },
    amount: { type: Number, required: true, min: 0 },
    deductedAmount: { type: Number, default: 0, min: 0 },
    status: {
      type: String,
      enum: ["PENDING", "DEDUCTED"],
      default: "PENDING",
    },
    settlementId: { type: String },
    deductedAt: { type: Date },
  },
  { _id: false }
);

const SupplierPaymentSchema = new Schema<ISupplierPayment>(
  {
    paymentId: { type: String, required: true },
    amount: { type: Number, required: true, min: 0.01 },
    paymentDate: { type: Date, required: true },
    notes: { type: String, trim: true, maxlength: 500 },
    createdAt: { type: Date, default: Date.now, required: true },
  },
  { _id: false }
);

const SupplierAccountTransactionSchema =
  new Schema<ISupplierAccountTransaction>(
    {
      transactionId: { type: String, required: true, unique: true },
      supplierId: { type: String, required: true, index: true },
      supplierName: { type: String, required: true },
      type: {
        type: String,
        enum: ["ADVANCE", "LOAN", "FERTILIZER"],
        required: true,
      },
      amount: { type: Number, required: true, min: 0.01 },
      outstandingAmount: { type: Number, required: true, min: 0 },
      transactionDate: { type: Date, default: Date.now },
      deductionMode: {
        type: String,
        enum: ["FULL", "INSTALLMENT"],
        required: true,
      },
      firstDeductionMonth: { type: String },
      installmentMonths: { type: Number, min: 1 },
      monthlyInstallmentAmount: { type: Number, min: 0 },
      installments: {
        type: [InstallmentSchema],
        default: [],
      },
      payments: {
        type: [SupplierPaymentSchema],
        default: [],
      },
      fertilizerName: { type: String, trim: true },
      fertilizerProductId: { type: String },
      fertilizerQuantity: { type: Number, min: 0 },
      fertilizerUnit: { type: String },
      notes: { type: String, trim: true, maxlength: 1000 },
      status: {
        type: String,
        enum: ["ACTIVE", "SETTLED", "CANCELLED"],
        default: "ACTIVE",
      },
    },
    { timestamps: true }
  );

SupplierAccountTransactionSchema.index({
  supplierId: 1,
  transactionDate: -1,
});

const SupplierAccountTransaction =
  mongoose.models.SupplierAccountTransaction ||
  mongoose.model<ISupplierAccountTransaction>(
    "SupplierAccountTransaction",
    SupplierAccountTransactionSchema
  );

export default SupplierAccountTransaction;
