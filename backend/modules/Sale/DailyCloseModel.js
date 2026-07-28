import mongoose from 'mongoose';

const dailyCloseSchema = new mongoose.Schema({
  fecha: {
    type: Date,
    required: true,
    unique: true,
  },
  total: { type: Number, required: true },
  cantidad: { type: Number, required: true },
  efectivo: {
    total: { type: Number, default: 0 },
    cantidad: { type: Number, default: 0 },
  },
  transferencia: {
    total: { type: Number, default: 0 },
    cantidad: { type: Number, default: 0 },
  },
  tarjeta: {
    total: { type: Number, default: 0 },
    cantidad: { type: Number, default: 0 },
  },
  cerradoAt: { type: Date, default: Date.now },
});

export default mongoose.model('DailyClose', dailyCloseSchema);
