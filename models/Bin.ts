import mongoose, { Document, Model } from 'mongoose';

export interface IBin extends Document {
  id: string; 
  location: string;
  fillLevel: number;
  wasteType: string;
  battery: number;
  status: string;
  lastUpdated: number;
}

const binSchema = new mongoose.Schema<IBin>({
  id: { type: String, required: true, unique: true },
  location: { type: String, required: true },
  fillLevel: { type: Number, default: 0 },
  wasteType: { type: String, required: true },
  battery: { type: Number, default: 100 },
  status: { type: String, default: 'active' },
  lastUpdated: { type: Number, default: () => Date.now() }
});

const Bin: Model<IBin> = mongoose.models.Bin || mongoose.model<IBin>('Bin', binSchema);
export default Bin;
