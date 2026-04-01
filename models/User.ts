import mongoose, { Document, Model } from 'mongoose';

export interface IUser extends Document {
  uid: string;
  email: string;
  password?: string;
  role: string;
  points: number;
  rank: string;
  impact: number; // in kg
  createdAt: Date;
}

const userSchema = new mongoose.Schema<IUser>({
  uid: { type: String, required: true, unique: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  points: { type: Number, default: 0 },
  rank: { type: String, default: 'Citizen' },
  impact: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', userSchema);
export default User;
