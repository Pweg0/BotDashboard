import mongoose, { Schema, InferSchemaType } from 'mongoose';

const GuildConfigSchema = new Schema(
  {
    guildId: { type: String, required: true, unique: true },
    categoryChannels: {
      type: Map,
      of: String,
      default: {},
    },
    ordersChannelId: { type: String },
    adminRoleId: { type: String },
  },
  {
    timestamps: true,
  }
);

export type IGuildConfig = InferSchemaType<typeof GuildConfigSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const GuildConfig =
  (mongoose.models.GuildConfig as mongoose.Model<IGuildConfig>) ||
  mongoose.model<IGuildConfig>('GuildConfig', GuildConfigSchema);
