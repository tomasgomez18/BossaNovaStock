import { z } from 'zod';

const talleSchema = z.object({
  talle: z.string().min(1, 'El talle es requerido'),
  cantidad: z.number().int().min(0, 'La cantidad no puede ser negativa'),
});

export const createProductSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  precio: z.number().positive('El precio debe ser mayor a 0'),
  talles: z.array(talleSchema).optional().default([]),
  categoria: z.string().min(1, 'La categoría es requerida'),
  proveedor: z.string().optional().default(''),
  stockMinimo: z.number().int().min(0).optional().default(2),
});

export const exchangeSchema = z.object({
  productoDevolver: z.string().min(1, 'Producto a devolver requerido'),
  cantidadDevolver: z.number().int().positive('Debe devolver al menos 1'),
  talleDevolver: z.string().optional().default(''),
  productoCargar: z.string().min(1, 'Producto a cargar requerido'),
  cantidadCargar: z.number().int().positive('Debe cargar al menos 1'),
  talleCargar: z.string().optional().default(''),
  motivo: z.string().optional().default('Cambio'),
});

export const addStockSchema = z.object({
  cantidad: z.number().int().positive('Debe agregar al menos 1'),
  talle: z.string().optional().default(''),
});

export const sellProductSchema = z.object({
  cantidad: z.number().int().positive('Debe vender al menos 1'),
  talle: z.string().optional().default(''),
});

export const updateProductSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido').optional(),
  precio: z.number().positive('El precio debe ser mayor a 0').optional(),
  talles: z.array(talleSchema).optional(),
  categoria: z.string().min(1, 'La categoría es requerida').optional(),
  proveedor: z.string().optional(),
  stockMinimo: z.number().int().min(0).optional(),
});
