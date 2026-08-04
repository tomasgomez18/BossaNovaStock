import { useState, useMemo } from 'react';

const stockPorColor = (colores, variants) => {
  if (!colores || colores.length === 0) return null;
  return colores.map((c) => ({
    color: c,
    stock: variants
      .filter((v) => v.color === c)
      .reduce((s, v) => s + (Number(v.cantidad) || 0), 0),
  }));
};

const ProductForm = ({ initial, onSubmit, onCancel, isSubmitting: externalSubmitting }) => {
  const extractColores = (prod) => {
    if (prod?.colores?.length) return prod.colores;
    const fromVariants = [...new Set((prod?.variants ?? []).map((v) => v.color).filter(Boolean))];
    return fromVariants.length ? fromVariants : [];
  };

  const [form, setForm] = useState({
    nombre: initial?.nombre || '',
    precio: initial?.precio ?? '',
    colores: extractColores(initial),
    variants: initial?.variants?.length
      ? initial.variants.map((v) => ({ ...v }))
      : [],
    categoria: initial?.categoria || '',
    proveedor: initial?.proveedor || '',
    stockMinimo: initial?.stockMinimo ?? 2,
  });
  const [newColor, setNewColor] = useState('');
  const [errores, setErrores] = useState({});

  const groups = useMemo(() => {
    const map = {};
    for (const c of form.colores) map[c] = [];
    for (const v of form.variants) {
      if (v.color && map[v.color]) map[v.color].push(v);
    }
    return map;
  }, [form.colores, form.variants]);

  const stockResumen = useMemo(
    () => stockPorColor(form.colores, form.variants),
    [form.colores, form.variants]
  );

  const handleAddColor = () => {
    const c = newColor.trim();
    if (!c) return;
    if (form.colores.includes(c)) {
      setNewColor('');
      return;
    }
    setForm({ ...form, colores: [...form.colores, c] });
    setNewColor('');
  };

  const handleRemoveColor = (color) => {
    setForm({
      ...form,
      colores: form.colores.filter((c) => c !== color),
      variants: form.variants.filter((v) => v.color !== color),
    });
  };

  const addVariantToColor = (color) => {
    setForm({
      ...form,
      variants: [...form.variants, { talle: '', color, cantidad: '' }],
    });
  };

  const updateVariant = (index, field, value) => {
    const updated = [...form.variants];
    updated[index] = { ...updated[index], [field]: value };
    setForm({ ...form, variants: updated });
  };

  const removeVariant = (index) => {
    setForm({ ...form, variants: form.variants.filter((_, i) => i !== index) });
  };

  const totalCantidad = form.variants.reduce(
    (sum, v) => sum + (Number(v.cantidad) || 0),
    0
  );

  const validate = () => {
    const errs = {};
    if (!form.nombre.trim()) errs.nombre = 'El nombre es obligatorio';
    if (form.precio === '' || Number(form.precio) <= 0) errs.precio = 'El precio debe ser mayor a $0';
    if (!form.categoria.trim()) errs.categoria = 'La categoría es obligatoria';
    if (form.stockMinimo === '' || Number(form.stockMinimo) < 0) errs.stockMinimo = 'El stock mínimo no puede ser negativo';
    if (form.colores.length === 0 && form.variants.length > 0) errs.colores = 'Agregue al menos un color';
    if (form.colores.length > 0 && form.variants.length === 0) errs.variants = 'Agregue al menos una variante con talle y cantidad';
    setErrores(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    const variantsValidos = form.variants
      .filter((v) => v.talle.trim())
      .map((v) => ({
        talle: v.talle.trim(),
        color: v.color,
        cantidad: Number(v.cantidad) || 0,
      }));
    onSubmit({
      ...form,
      precio: Number(form.precio),
      colores: form.colores,
      variants: variantsValidos,
      stockMinimo: Number(form.stockMinimo),
    });
  };

  const campoCls = (campo) =>
    `w-full px-3 py-2.5 bg-white/[0.07] border rounded-lg text-white placeholder-white/20 focus:outline-none focus:border-white/30 transition-all text-sm ${
      errores[campo] ? 'border-red-500/50' : 'border-white/10'
    }`;

  const isSubmitting = externalSubmitting;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="col-span-1 sm:col-span-2">
          <label className="block text-xs text-white/40 font-medium uppercase tracking-wider mb-1.5">
            Nombre <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            required
            value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            className={campoCls('nombre')}
          />
          {errores.nombre && (
            <p className="text-red-400 text-xs mt-1">{errores.nombre}</p>
          )}
        </div>
        <div>
          <label className="block text-xs text-white/40 font-medium uppercase tracking-wider mb-1.5">
            Precio <span className="text-red-400">*</span>
          </label>
          <input
            type="number"
            step="0.01"
            required
            min="0"
            value={form.precio}
            onChange={(e) => setForm({ ...form, precio: e.target.value })}
            className={campoCls('precio')}
          />
          {errores.precio && (
            <p className="text-red-400 text-xs mt-1">{errores.precio}</p>
          )}
        </div>
        <div>
          <label className="block text-xs text-white/40 font-medium uppercase tracking-wider mb-1.5">
            Stock Mínimo
          </label>
          <input
            type="number"
            required
            min="0"
            value={form.stockMinimo}
            onChange={(e) => setForm({ ...form, stockMinimo: e.target.value })}
            className={campoCls('stockMinimo')}
          />
          <p className="text-white/20 text-[10px] mt-1">
            Cuando el stock total baje de este número, se mostrará una alerta
          </p>
          {errores.stockMinimo && (
            <p className="text-red-400 text-xs mt-1">{errores.stockMinimo}</p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-xs text-white/40 font-medium uppercase tracking-wider mb-1.5">
          Colores del producto
        </label>
        <div className="flex items-center gap-2 mb-2">
          <input
            type="text"
            value={newColor}
            onChange={(e) => setNewColor(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddColor())}
            placeholder="Ej: Azul, Rojo..."
            className="flex-1 px-3 py-2 bg-white/[0.07] border border-white/10 rounded-lg text-white placeholder-white/20 focus:outline-none focus:border-white/30 transition-all text-sm"
          />
          <button
            type="button"
            onClick={handleAddColor}
            disabled={!newColor.trim()}
            className="text-xs text-green-400 bg-green-500/10 border border-green-500/30 px-3 py-2 rounded-lg hover:bg-green-500/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            + Agregar
          </button>
        </div>
        {form.colores.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {form.colores.map((c) => {
              const count = groups[c]?.length || 0;
              return (
                <span
                  key={c}
                  className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-white/10 border border-white/10 text-white/70"
                >
                  {c}
                  <span className="text-white/30">({count})</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveColor(c)}
                    className="text-white/30 hover:text-red-400 transition-colors"
                  >
                    ✕
                  </button>
                </span>
              );
            })}
          </div>
        )}
        {errores.colores && (
          <p className="text-red-400 text-xs mb-2">{errores.colores}</p>
        )}
      </div>

      {form.colores.length > 0 && (
        <div>
          <label className="block text-xs text-white/40 font-medium uppercase tracking-wider mb-2">
            Variantes por color
          </label>
          {errores.variants && (
            <p className="text-red-400 text-xs mb-2">{errores.variants}</p>
          )}
          <div className="space-y-4">
            {form.colores.map((color) => {
              const idxs = form.variants
                .map((v, i) => (v.color === color ? i : -1))
                .filter((i) => i !== -1);
              return (
                <div key={color} className="bg-white/[0.03] border border-white/5 rounded-lg p-3">
                  <p className="text-sm font-semibold text-white mb-2">{color}</p>
                  {idxs.length === 0 && (
                    <p className="text-xs text-white/30 mb-2">
                      Sin variantes aún — agregue talle y cantidad
                    </p>
                  )}
                  <div className="space-y-2">
                    {idxs.map((i) => (
                      <div key={i} className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="Talle"
                          value={form.variants[i].talle}
                          onChange={(e) => updateVariant(i, 'talle', e.target.value)}
                          className="flex-1 sm:flex-none w-24 px-3 py-2 bg-white/[0.07] border border-white/10 rounded-lg text-white placeholder-white/20 focus:outline-none focus:border-white/30 transition-all text-sm"
                        />
                        <input
                          type="number"
                          min="0"
                          placeholder="Cantidad"
                          value={form.variants[i].cantidad}
                          onChange={(e) => updateVariant(i, 'cantidad', e.target.value)}
                          className="flex-1 sm:flex-none w-24 px-3 py-2 bg-white/[0.07] border border-white/10 rounded-lg text-white placeholder-white/20 focus:outline-none focus:border-white/30 transition-all text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => removeVariant(i)}
                          className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => addVariantToColor(color)}
                    className="mt-2 text-xs text-green-400/80 hover:text-green-400 transition-colors"
                  >
                    + Agregar talle
                  </button>
                </div>
              );
            })}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-3 text-xs">
            <span className="text-white/50">
              Total: <span className="text-white font-semibold">{totalCantidad}</span> unidades
            </span>
            {stockResumen && (
              <span className="text-white/30">
                Por color:{' '}
                {stockResumen
                  .filter((s) => s.stock > 0)
                  .map((s) => (
                    <span key={s.color} className="text-white/60">
                      {s.color}: {s.stock}{' '}
                    </span>
                  ))}
              </span>
            )}
          </div>
        </div>
      )}

      {form.colores.length === 0 && (
        <div className="py-4 text-center text-white/30 text-xs border border-dashed border-white/10 rounded-lg">
          Agregue al menos un color para empezar a cargar variantes
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-white/40 font-medium uppercase tracking-wider mb-1.5">
            Categoría <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            required
            value={form.categoria}
            onChange={(e) => setForm({ ...form, categoria: e.target.value })}
            className={campoCls('categoria')}
            placeholder="Ej: Pantalones, Remeras..."
          />
          {errores.categoria && (
            <p className="text-red-400 text-xs mt-1">{errores.categoria}</p>
          )}
        </div>
        <div>
          <label className="block text-xs text-white/40 font-medium uppercase tracking-wider mb-1.5">Proveedor</label>
          <input
            type="text"
            value={form.proveedor}
            onChange={(e) => setForm({ ...form, proveedor: e.target.value })}
            className="w-full px-3 py-2.5 bg-white/[0.07] border border-white/10 rounded-lg text-white placeholder-white/20 focus:outline-none focus:border-white/30 transition-all text-sm"
            placeholder="Nombre del proveedor"
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="px-4 py-2 text-white/50 border border-white/10 rounded-lg text-sm hover:bg-white/5 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white border border-white/10 rounded-lg text-sm transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isSubmitting && (
            <svg className="animate-spin h-4 w-4 text-white/70" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          )}
          {isSubmitting ? 'Guardando...' : initial ? 'Actualizar Producto' : 'Crear Producto'}
        </button>
      </div>
    </form>
  );
};

export default ProductForm;
