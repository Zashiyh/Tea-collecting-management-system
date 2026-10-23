
import mongoose, { Schema, type Model } from "mongoose";

export interface IFertilizerPriceHistory {
  price: number;
  effectiveFrom: Date;
  note?: string;
}

export interface IFertilizerProduct extends mongoose.Document {
  productId: string;
  name: string;
  unit: string;
  currentPrice: number;
  priceHistory: IFertilizerPriceHistory[];
  status: "ACTIVE" | "INACTIVE";
}

const FertilizerPriceHistorySchema =
  new Schema<IFertilizerPriceHistory>(
    {
      price: {
        type: Number,
        required: true,
        min: 0,
      },
      effectiveFrom: {
        type: Date,
        required: true,
      },
      note: {
        type: String,
        trim: true,
        maxlength: 500,
      },
    },
    { _id: false }
  );

const FertilizerProductSchema =
  new Schema<IFertilizerProduct>(
    {
      productId: {
        type: String,
        required: true,
        unique: true,
      },
      name: {
        type: String,
        required: true,
        trim: true,
      },
      unit: {
        type: String,
        required: true,
        default: "kg",
        trim: true,
      },
      currentPrice: {
        type: Number,
        required: true,
        min: 0,
      },
      priceHistory: {
        type: [FertilizerPriceHistorySchema],
        default: [],
      },
      status: {
        type: String,
        enum: ["ACTIVE", "INACTIVE"],
        default: "ACTIVE",
      },
    },
    { timestamps: true }
  );

const FertilizerProduct: Model<IFertilizerProduct> =
  mongoose.models.FertilizerProduct ||
  mongoose.model<IFertilizerProduct>(
    "FertilizerProduct",
    FertilizerProductSchema
  );

export default FertilizerProduct;
