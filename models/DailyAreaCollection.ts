import mongoose, {
  Schema,
  Document,
  Model,
} from "mongoose";

export interface IDailyAreaCollection extends Document {
  collectionId: string;
  date: Date;
  areaId: string;
  areaName: string;
  totalKg: number;
  factoryWeightKg: number;
  differenceKg: number;
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

const DailyAreaCollectionSchema =
  new Schema<IDailyAreaCollection>(
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
        index: true,
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

      totalKg: {
        type: Number,
        required: true,
        min: 0,
        default: 0,
      },

      factoryWeightKg: {
        type: Number,
        required: true,
        min: 0,
        default: 0,
      },

      differenceKg: {
        type: Number,
        required: true,
        default: 0,
      },

      notes: {
        type: String,
        default: "",
        trim: true,
      },
    },
    {
      timestamps: true,

      // Use one fixed MongoDB collection
      collection: "dailyareacollections",
    }
  );

DailyAreaCollectionSchema.index(
  {
    areaId: 1,
    date: 1,
  },
  {
    unique: true,
  }
);

const DailyAreaCollection: Model<IDailyAreaCollection> =
  mongoose.models.DailyAreaCollection ||
  mongoose.model<IDailyAreaCollection>(
    "DailyAreaCollection",
    DailyAreaCollectionSchema
  );

export default DailyAreaCollection;