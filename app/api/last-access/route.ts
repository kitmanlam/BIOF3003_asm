import { NextResponse } from 'next/server';
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI as string;
if (!MONGODB_URI) {
  throw new Error('MONGODB_URI not defined');
}

let cached = (global as any).mongoose;
if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  if (cached.conn) {
    return cached.conn;
  }
  if (!cached.promise) {
    const opts = { bufferCommands: false };
    cached.promise = mongoose
      .connect(MONGODB_URI, opts)
      .then((mongoose) => mongoose);
  }
  cached.conn = await cached.promise;
  return cached.conn;
}

const RecordSchema = new mongoose.Schema({
  subjectId: { type: String, required: true },
  heartRate: { bpm: Number, confidence: Number },
  hrv: { sdnn: Number, confidence: Number },
  timestamp: { type: Date, default: Date.now },
});

const Record = mongoose.models.Record || mongoose.model('Record', RecordSchema);

// POST Handler
export async function POST(request: Request) {
  try {
    await dbConnect();
    const body = await request.json();
    const newRecord = await Record.create(body);
    return NextResponse.json({ success: true, data: newRecord }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const subjectId = searchParams.get('subjectId');
  
    if (!subjectId) {
      return NextResponse.json({ success: false, error: 'Missing subjectId' });
    }
  
    try {
      await dbConnect();
      // Find all records for the subject
      const records = await Record.find({ subjectId }).sort({ timestamp: -1 });
      
      if (!records || records.length === 0) {
        return NextResponse.json({ success: false, error: 'No records found' });
      }

      // Calculate averages
      const totalRecords = records.length;
      const avgHeartRate = records.reduce((sum, record) => sum + record.heartRate.bpm, 0) / totalRecords;
      const avgHRV = records.reduce((sum, record) => sum + record.hrv.sdnn, 0) / totalRecords;
      const lastAccess = records[0].timestamp; // Most recent record

      return NextResponse.json({ 
        success: true, 
        avgHeartRate: Math.round(avgHeartRate), 
        avgHRV: Math.round(avgHRV),
        lastAccess 
      });
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error.message });
    }
}