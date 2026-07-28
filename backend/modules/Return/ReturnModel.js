import mongoose from 'mongoose';

const returnSchema = new mongoose.Schema(
  {
    producto: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    cantidad: {
      type: Number,
      required: true,
      min: 1,
    },
    talle: {
      type: String,
      trim: true,
      default: '',
    },
    motivo: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true }
);

returnSchema.index({ producto: 1, createdAt: -1 });
returnSchema.index({ createdAt: -1 });

export default mongoose.model('Return', returnSchema);
