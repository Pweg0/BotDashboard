import mongoose, { Schema, InferSchemaType } from 'mongoose';

const OrderSchema = new Schema(
  {
    userId: { type: String, required: true },
    username: { type: String, required: true },
    userAvatar: { type: String },
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    productSnapshot: {
      name: { type: String, required: true },
      price: { type: Number, required: true },
    },
    quantity: { type: Number, required: true, default: 1 },
    amount: { type: Number, required: true },
    paymentMethod: { type: String, enum: ['pix', 'card'], required: true },
    status: {
      type: String,
      enum: ['pending_payment', 'paid', 'delivered', 'cancelled', 'expired'],
      default: 'pending_payment',
    },
    mercadoPagoPaymentId: { type: String, index: true, sparse: true },
    externalReference: { type: String, required: true, unique: true },
    pixQrCode: { type: String },
    pixQrCodeBase64: { type: String },
    pixExpiresAt: { type: Date },
    pixDmMessageId: { type: String },
    guildId: { type: String, required: true },
    statusHistory: {
      type: [
        {
          status: { type: String, required: true },
          changedAt: { type: Date, required: true },
          _id: false,
        },
      ],
      default: [],
    },
    discordNotified: { type: Boolean, default: false },
    paidAt: { type: Date },
    deliveredAt: { type: Date },
    cancelledAt: { type: Date },
    cancelledBy: { type: String, enum: ['admin', 'system'], default: undefined },
    ordersChannelMessageId: { type: String },
  },
  {
    timestamps: true,
  }
);

export type IOrder = InferSchemaType<typeof OrderSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Order =
  (mongoose.models.Order as mongoose.Model<IOrder>) ||
  mongoose.model<IOrder>('Order', OrderSchema);
