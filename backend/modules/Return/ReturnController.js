import mongoose from 'mongoose';
import Return from './ReturnModel.js';
import Product from '../Product/ProductModel.js';
import Sale from '../Sale/SaleModel.js';
import { createReturnSchema } from './ReturnSchema.js';

export const createReturn = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const data = createReturnSchema.parse(req.body);

    const product = await Product.findById(data.producto).session(session);
    if (!product) {
      await session.abortTransaction();
      return res.status(404).json({ message: 'Producto no encontrado' });
    }

    if (product.talles?.length > 0 && !data.talle) {
      await session.abortTransaction();
      return res.status(400).json({ message: 'Debe seleccionar un talle' });
    }

    if (data.talle) {
      const idx = product.talles.findIndex((t) => t.talle === data.talle);
      if (idx === -1) {
        product.talles.push({ talle: data.talle, cantidad: 0 });
      }
    }

    await product.save({ session });

    if (data.talle) {
      const idx = product.talles.findIndex((t) => t.talle === data.talle);
      product.talles[idx].cantidad += data.cantidad;
    }

    await product.save({ session });

    let pendiente = data.cantidad;
    const sales = await Sale.find({ producto: data.producto }).sort({ createdAt: -1 }).session(session);

    for (const sale of sales) {
      if (pendiente <= 0) break;

      if (sale.cantidad <= pendiente) {
        pendiente -= sale.cantidad;
        await Sale.findByIdAndDelete(sale._id).session(session);
      } else {
        sale.cantidad -= pendiente;
        sale.total = sale.precio * sale.cantidad;
        await sale.save({ session });
        pendiente = 0;
      }
    }

    const returnRecord = await Return.create([data], { session });

    await session.commitTransaction();

    const populated = await returnRecord[0].populate('producto', 'nombre');

    res.status(201).json(populated);
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
};

export const deleteReturn = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const returnRecord = await Return.findById(req.params.id).session(session);
    if (!returnRecord) {
      await session.abortTransaction();
      return res.status(404).json({ message: 'Devolución no encontrada' });
    }

    const product = await Product.findById(returnRecord.producto).session(session);
    if (product) {
      if (returnRecord.talle) {
        const idx = product.talles.findIndex((t) => t.talle === returnRecord.talle);
        if (idx !== -1) {
          product.talles[idx].cantidad -= returnRecord.cantidad;
          if (product.talles[idx].cantidad < 0) product.talles[idx].cantidad = 0;
        }
      }
      await product.save({ session });
    }

    await Return.findByIdAndDelete(req.params.id).session(session);
    await session.commitTransaction();
    res.json({ message: 'Devolución eliminada correctamente' });
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
};

export const getReturns = async (req, res, next) => {
  try {
    const returns = await Return.find()
      .populate('producto', 'nombre categoria')
      .sort({ createdAt: -1 });

    res.json(returns);
  } catch (error) {
    next(error);
  }
};
