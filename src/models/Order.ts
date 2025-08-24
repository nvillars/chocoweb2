import { Schema, models, model, Types } from 'mongoose';

const OrderItem = new Schema({
  productId: { type: Types.ObjectId, ref: 'Product', required: true },
  qty: { type: Number, required: true },
  unitPriceCents: { type: Number, required: true }
}, { _id: false });

const OrderSchema = new Schema({
  userId: { type: Types.ObjectId, ref: 'User', required: true },
  items: { type: [OrderItem], required: true },
  status: { type: String, enum: ['pending', 'paid', 'shipped'], default: 'pending' }
}, { timestamps: true });

export function getOrderModel() {
  return models.Order || model('Order', OrderSchema);
}
