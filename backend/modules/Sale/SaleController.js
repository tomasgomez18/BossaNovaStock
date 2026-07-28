import mongoose from 'mongoose';
import Sale from './SaleModel.js';
import Product from '../Product/ProductModel.js';
import Return from '../Return/ReturnModel.js';
import DailyClose from './DailyCloseModel.js';
import { createSaleSchema } from './SaleSchema.js';

const parseDate = (str) => {
  if (!str) return null;
  const [y, m, d] = str.split('-').map(Number);
  if (isNaN(y) || isNaN(m) || isNaN(d)) return null;
  return new Date(y, m - 1, d);
};

const todayDateRange = () => {
  const d = new Date();
  const start = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const end = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
  return { $gte: start, $lt: end };
};

const getItems = (sale) => {
  return (sale.items && sale.items.length > 0)
    ? sale.items
    : [{ producto: sale.producto, cantidad: sale.cantidad, precio: sale.precio, talle: sale.talle, subtotal: sale.total }];
};

export const createSale = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const data = createSaleSchema.parse(req.body);

    const items = [];
    for (const item of data.items) {
      const product = await Product.findById(item.producto).session(session);
      if (!product) {
        await session.abortTransaction();
        return res.status(404).json({ message: `Producto ${item.producto} no encontrado` });
      }

      if (product.talles?.length > 0 && !item.talle) {
        await session.abortTransaction();
        return res.status(400).json({ message: `Debe seleccionar un talle para "${product.nombre}"` });
      }

      if (item.talle) {
        const idx = product.talles.findIndex((t) => t.talle === item.talle);
        if (idx === -1) {
          await session.abortTransaction();
          return res.status(400).json({ message: `Talle "${item.talle}" no encontrado en "${product.nombre}"` });
        }
        if (product.talles[idx].cantidad < item.cantidad) {
          await session.abortTransaction();
          return res.status(400).json({
            message: `Stock insuficiente para "${product.nombre}" talle "${item.talle}". Solo hay ${product.talles[idx].cantidad} unidad(es).`,
          });
        }
        product.talles[idx].cantidad -= item.cantidad;
      } else {
        if (product.cantidad < item.cantidad) {
          await session.abortTransaction();
          return res.status(400).json({
            message: `Stock insuficiente para "${product.nombre}". Solo hay ${product.cantidad} unidad(es).`,
          });
        }
        product.cantidad -= item.cantidad;
      }

      await product.save({ session });

      items.push({
        producto: item.producto,
        cantidad: item.cantidad,
        precio: item.precio,
        talle: item.talle || '',
        subtotal: item.precio * item.cantidad,
      });
    }

    const subtotal = items.reduce((s, i) => s + i.subtotal, 0);
    const total = subtotal * (1 - (data.descuento || 0) / 100);

    const sumaPagos = (data.pagos || []).reduce((s, p) => s + p.monto, 0);
    if (Math.abs(sumaPagos - total) > 0.01) {
      await session.abortTransaction();
      return res.status(400).json({
        message: `La suma de los montos de pago ($${sumaPagos.toFixed(2)}) no coincide con el total ($${total.toFixed(2)})`,
      });
    }

    const sale = await Sale.create([{
      items,
      total,
      empleado: data.empleado,
      pagos: data.pagos,
      descuento: data.descuento || 0,
    }], { session });

    await session.commitTransaction();

    const populated = await sale[0].populate('items.producto', 'nombre');

    res.status(201).json(populated);
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
};

export const deleteSale = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const sale = await Sale.findById(req.params.id).session(session);
    if (!sale) {
      await session.abortTransaction();
      return res.status(404).json({ message: 'Venta no encontrada' });
    }

    const items = getItems(sale);

    const returnCount = await Return.countDocuments({ producto: { $in: items.map(i => i.producto) } }).session(session);
    if (returnCount > 0) {
      await session.abortTransaction();
      return res.status(400).json({ message: 'No se puede eliminar la venta porque tiene devoluciones asociadas' });
    }

    for (const item of items) {
      const product = await Product.findById(item.producto).session(session);
      if (product) {
        if (item.talle) {
          const idx = product.talles.findIndex((t) => t.talle === item.talle);
          if (idx !== -1) {
            product.talles[idx].cantidad += item.cantidad;
          }
        }
        product.cantidad += item.cantidad;
        await product.save({ session });
      }
    }

    await Sale.findByIdAndDelete(req.params.id).session(session);
    await session.commitTransaction();
    res.json({ message: 'Venta eliminada correctamente' });
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
};

export const getSales = async (req, res, next) => {
  try {
    const { desde, hasta } = req.query;
    const filter = {};

    if (desde || hasta) {
      const start = parseDate(desde) || new Date(0);
      const end = parseDate(hasta);
      filter.createdAt = { $gte: start, $lt: end ? new Date(end.getFullYear(), end.getMonth(), end.getDate() + 1) : new Date(8640000000000000) };
    }

    const sales = await Sale.find(filter)
      .populate('items.producto', 'nombre categoria')
      .populate('producto', 'nombre categoria')
      .sort({ createdAt: -1 });

    const total = sales.reduce((sum, s) => sum + s.total, 0);

    res.json({ sales, total });
  } catch (error) {
    next(error);
  }
};

export const getMostSold = async (req, res, next) => {
  try {
    const { desde, hasta, limit = 5 } = req.query;
    const filter = {};

    if (desde || hasta) {
      const start = parseDate(desde) || new Date(0);
      const end = parseDate(hasta);
      filter.createdAt = { $gte: start, $lt: end ? new Date(end.getFullYear(), end.getMonth(), end.getDate() + 1) : new Date(8640000000000000) };
    }

    const sales = await Sale.find(filter);

    const productMap = {};
    for (const sale of sales) {
      const items = getItems(sale);
      for (const item of items) {
        const pid = item.producto?.toString() || item.producto;
        if (!productMap[pid]) productMap[pid] = { totalVendido: 0, ingresos: 0 };
        productMap[pid].totalVendido += item.cantidad;
        const itemSubtotal = item.subtotal || (item.cantidad * (item.precio || 0));
        const ratio = sale.total > 0 ? itemSubtotal / sale.total : 1 / items.length;
        productMap[pid].ingresos += sale.total * ratio;
      }
    }

    const sorted = Object.entries(productMap)
      .map(([productoId, data]) => ({ productoId, ...data }))
      .sort((a, b) => b.totalVendido - a.totalVendido)
      .slice(0, Number(limit));

    const products = await Product.find({ _id: { $in: sorted.map(r => r.productoId) } });
    const productNames = {};
    for (const p of products) {
      productNames[p._id.toString()] = { nombre: p.nombre, categoria: p.categoria };
    }

    res.json(sorted.map(r => ({
      ...r,
      nombre: productNames[r.productoId]?.nombre || 'Producto eliminado',
      categoria: productNames[r.productoId]?.categoria || '',
    })));
  } catch (error) {
    next(error);
  }
};

export const getDailyClose = async (req, res, next) => {
  try {
    const sales = await Sale.find({ createdAt: todayDateRange() });

    const total = sales.reduce((sum, s) => sum + s.total, 0);
    const cantidad = sales.reduce((sum, s) => {
      const items = getItems(s);
      return sum + items.reduce((acc, i) => acc + i.cantidad, 0);
    }, 0);

    const porMetodo = sales.reduce((acc, s) => {
      if (s.pagos && s.pagos.length > 0) {
        const vistos = new Set();
        for (const p of s.pagos) {
          if (!acc[p.metodo]) acc[p.metodo] = { total: 0, cantidad: 0 };
          acc[p.metodo].total += p.monto;
          vistos.add(p.metodo);
        }
        const items = getItems(s);
        const totalUnidades = items.reduce((a, i) => a + i.cantidad, 0);
        for (const m of vistos) {
          acc[m].cantidad += totalUnidades;
        }
      } else {
        const m = s.metodoPago || 'efectivo';
        if (!acc[m]) acc[m] = { total: 0, cantidad: 0 };
        acc[m].total += s.total;
        const items = getItems(s);
        acc[m].cantidad += items.reduce((a, i) => a + i.cantidad, 0);
      }
      return acc;
    }, {});

    const today = new Date();
    const fechaDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    const close = await DailyClose.findOneAndUpdate(
      { fecha: fechaDate },
      {
        fecha: fechaDate,
        total,
        cantidad,
        efectivo: porMetodo.efectivo || { total: 0, cantidad: 0 },
        transferencia: porMetodo.transferencia || { total: 0, cantidad: 0 },
        tarjeta: porMetodo.tarjeta || { total: 0, cantidad: 0 },
        cerradoAt: new Date(),
      },
      { upsert: true, new: true }
    );

    res.json({
      fecha: new Date().toLocaleDateString('es-AR'),
      total: close.total,
      cantidad: close.cantidad,
      efectivo: close.efectivo,
      transferencia: close.transferencia,
      tarjeta: close.tarjeta,
      cerradoAt: close.cerradoAt,
    });
  } catch (error) {
    next(error);
  }
};

export const getDailyCloses = async (req, res, next) => {
  try {
    const { desde, hasta } = req.query;
    const filter = {};

    if (desde || hasta) {
      const start = parseDate(desde) || new Date(0);
      const end = parseDate(hasta);
      filter.fecha = {
        $gte: start,
        $lt: end ? new Date(end.getFullYear(), end.getMonth(), end.getDate() + 1) : new Date(8640000000000000),
      };
    }

    const closes = await DailyClose.find(filter).sort({ fecha: -1 });
    res.json(closes);
  } catch (error) {
    next(error);
  }
};

export const runMigration = async (req, res, next) => {
  try {
    const cursor = Sale.find({ items: { $exists: false } }).cursor();
    let count = 0;
    for await (const sale of cursor) {
      sale.items = [{
        producto: sale.producto,
        cantidad: sale.cantidad,
        precio: sale.precio,
        talle: sale.talle || '',
        subtotal: sale.total,
      }];
      await sale.save();
      count++;
    }
    res.json({ message: `Migradas ${count} ventas al formato items[]` });
  } catch (error) {
    next(error);
  }
};

export const getSalesStats = async (req, res, next) => {
  try {
    const { desde, hasta } = req.query;
    const filter = {};

    if (desde || hasta) {
      const start = parseDate(desde) || new Date(0);
      const end = parseDate(hasta);
      filter.createdAt = { $gte: start, $lt: end ? new Date(end.getFullYear(), end.getMonth(), end.getDate() + 1) : new Date(8640000000000000) };
    }

    const sales = await Sale.find(filter);

    const total = sales.reduce((sum, s) => sum + s.total, 0);
    const cantidad = sales.reduce((sum, s) => {
      const items = getItems(s);
      return sum + items.reduce((acc, i) => acc + i.cantidad, 0);
    }, 0);

    const porMetodo = sales.reduce((acc, s) => {
      if (s.pagos && s.pagos.length > 0) {
        const vistos = new Set();
        for (const p of s.pagos) {
          if (!acc[p.metodo]) acc[p.metodo] = { total: 0, cantidad: 0 };
          acc[p.metodo].total += p.monto;
          vistos.add(p.metodo);
        }
        const items = getItems(s);
        const totalUnidades = items.reduce((a, i) => a + i.cantidad, 0);
        for (const m of vistos) {
          acc[m].cantidad += totalUnidades;
        }
      } else {
        const m = s.metodoPago || 'efectivo';
        if (!acc[m]) acc[m] = { total: 0, cantidad: 0 };
        acc[m].total += s.total;
        const items = getItems(s);
        acc[m].cantidad += items.reduce((a, i) => a + i.cantidad, 0);
      }
      return acc;
    }, {});

    res.json({
      total,
      cantidad,
      efectivo: porMetodo.efectivo || { total: 0, cantidad: 0 },
      transferencia: porMetodo.transferencia || { total: 0, cantidad: 0 },
      tarjeta: porMetodo.tarjeta || { total: 0, cantidad: 0 },
    });
  } catch (error) {
    next(error);
  }
};
