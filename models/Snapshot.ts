import mongoose, { Document, Schema } from 'mongoose';

export interface ISnapshot extends Document {
  date: Date;
  totalWaste: number;
  totalRecycled: number;
  activeGuardians: number;
}

const snapshotSchema = new Schema<ISnapshot>({
  date: { type: Date, required: true, unique: true },
  totalWaste: { type: Number, default: 0 },
  totalRecycled: { type: Number, default: 0 },
  activeGuardians: { type: Number, default: 0 }
});

const Snapshot = mongoose.models.Snapshot || mongoose.model<ISnapshot>('Snapshot', snapshotSchema);
export default Snapshot;
