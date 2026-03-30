import mongoose, { Schema, InferSchemaType } from 'mongoose';

const CategorySchema = new Schema(
  {
    name: { type: String, required: true },
    channelId: { type: String, required: true },
    guildId: { type: String, required: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

CategorySchema.index({ guildId: 1, name: 1 }, { unique: true });

export type ICategory = InferSchemaType<typeof CategorySchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Category =
  (mongoose.models.Category as mongoose.Model<ICategory>) ||
  mongoose.model<ICategory>('Category', CategorySchema);
