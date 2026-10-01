import mongoose, { Schema, Document, Model } from "mongoose";

export interface IArea extends Document {
  areaId: string;
  name: string;
  description: string;
  status: "Active" | "Inactive";
  createdAt: Date;
  updatedAt: Date;
}

const AreaSchema = new Schema<IArea>(
  {
    areaId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
      trim: true,
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

const Area: Model<IArea> =
  mongoose.models.Area ||
  mongoose.model<IArea>("Area", AreaSchema);

export default Area;