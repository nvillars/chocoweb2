import { Schema, models, model } from 'mongoose';

const UserSchema = new Schema({
  email: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  role: { type: String, enum: ['admin', 'user'], default: 'user' }
}, { timestamps: true });

export function getUserModel() {
  return models.User || model('User', UserSchema);
}
