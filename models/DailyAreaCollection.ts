import mongoose, {
  Schema,
  Document,
  Model,
} from "mongoose";

export interface IDailyAreaCollection
  extends Document {
  collectionId: string;
  date: Date;
  areaId: string;
  areaName: string;

  // Total tea collected from the area
  totalKg: number;

  // Weight measured at factory
  factoryWeightKg: number;

  // Area weight - factory weight
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

      // Tea weight collected from the area
      totalKg: {
        type: Number,
        required: true,
        min: 0,
        default: 0,
      },

      // Factory measured weight
      factoryWeightKg: {
        type: Number,
        required: true,
        min: 0,
        default: 0,
      },

      // Difference between area weight and factory weight
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