import mongoose, { Document, Schema } from 'mongoose';

export interface IReport extends Document {
  lat: number;
  lng: number;
  wasteType: string;
  description: string;
  status: 'Pending' | 'In Progress' | 'Resolved';
  severity: 'Low' | 'Medium' | 'High';
  uid: string;
  timestamp: Date;
}

const reportSchema = new Schema<IReport>({
  lat: { type: Number, required: true },
  lng: { type: Number, required: true },
  wasteType: { type: String, required: true },
  description: { type: String, required: true },
  status: { type: String, enum: ['Pending', 'In Progress', 'Resolved'], default: 'Pending' },
  severity: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' },
  uid: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

const Report = mongoose.models.Report || mongoose.model<IReport>('Report', reportSchema);
export default Report;
