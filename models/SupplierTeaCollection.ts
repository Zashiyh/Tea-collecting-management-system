import mongoose, {
  Schema,
  Document,
  Model,
} from "mongoose";

export interface ISupplierTeaCollection
  extends Document {
  contributionId: string;
  date: Date;

  areaId: string;
  areaName: string;

  supplierId: string;
  supplierName: string;

  weightKg: number;

  notes: string;

  createdAt: Date;
  updatedAt: Date;
}

const SupplierTeaCollectionSchema =
  new Schema<ISupplierTeaCollection>(
    {
      contributionId: {
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

      notes: {
        type: String,
        default: "",
        trim: true,
      },
    },

    {
      timestamps: true,

      collection:
        "supplierteacollections",
    }
  );

/*
  Area + Date index
*/

SupplierTeaCollectionSchema.index({
  areaId: 1,
  date: 1,
});

/*
  Supplier + Date index
*/

SupplierTeaCollectionSchema.index({
  supplierId: 1,
  date: 1,
});

const SupplierTeaCollection: Model<ISupplierTeaCollection> =
  mongoose.models.SupplierTeaCollection ||
  mongoose.model<ISupplierTeaCollection>(
    "SupplierTeaCollection",
    SupplierTeaCollectionSchema
  );

export default SupplierTeaCollection;