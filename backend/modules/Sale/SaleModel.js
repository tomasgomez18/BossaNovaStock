import mongoose from 'mongoose';

const itemSchema = new mongoose.Schema({
  producto: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  cantidad: { type: Number, required: true, min: 1 },
  precio: { type: Number, required: true, min: 0 },
  talle: { type: String, default: '' },
  subtotal: { type: Number, required: true, min: 0 },
}, { _id: false });

const saleSchema = new mongoose.Schema({
  items: [itemSchema],
  producto: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  cantidad: { type: Number, min: 1 },
  precio: { type: Number, min: 0 },
  talle: { type: String, default: '' },
  total: { type: Number, required: true, min: 0 },
  empleado: { type: String, required: true, trim: true },
  pagos: [{
    metodo: { type: String, enum: ['efectivo', 'transferencia', 'tarjeta'], required: true },
    monto: { type: Number, required: true, min: 0 },
  }],
  metodoPago: { type: String, enum: ['efectivo', 'transferencia', 'tarjeta'] },
  descuento: { type: Number, default: 0, min: 0, max: 100 },
}, { timestamps: true });

saleSchema.pre('save', function (next) {
  if (this.items && this.items.length > 0) {
    this.producto = this.items[0].producto;
    this.cantidad = this.items[0].cantidad;
    this.precio = this.items[0].precio;
    this.talle = this.items[0].talle;
  }
  if (this.pagos && this.pagos.length > 0 && !this.metodoPago) {
    this.metodoPago = this.pagos[0].metodo;
  }
  next();
});

saleSchema.index({ 'items.producto': 1, createdAt: -1 });
saleSchema.index({ createdAt: -1 });
saleSchema.index({ 'pagos.metodo': 1 });

export default mongoose.model('Sale', saleSchema);
