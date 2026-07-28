import mongoose from 'mongoose';

const talleSubSchema = new mongoose.Schema({
  talle: { type: String, required: true, trim: true },
  cantidad: { type: Number, required: true, min: 0, default: 0 },
}, { _id: false });

const productSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: true,
      trim: true,
    },
    precio: {
      type: Number,
      required: true,
      min: 0,
    },
    cantidad: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    talles: {
      type: [talleSubSchema],
      default: [],
    },
    categoria: {
      type: String,
      required: true,
      trim: true,
    },
    proveedor: {
      type: String,
      trim: true,
      default: '',
    },
    stockMinimo: {
      type: Number,
      default: 2,
      min: 0,
    },
  },
  { timestamps: true }
);

productSchema.pre('save', function (next) {
  this.cantidad = this.talles.reduce((sum, t) => sum + t.cantidad, 0);
  next();
});

productSchema.index({ nombre: 'text' });
productSchema.index({ categoria: 1 });

export default mongoose.model('Product', productSchema);
