import { useState } from 'react';

const ProductForm = ({ initial, onSubmit, onCancel }) => {
  const [form, setForm] = useState({
    nombre: initial?.nombre || '',
    precio: initial?.precio || '',
    talles: initial?.talles?.length ? initial.talles.map((t) => ({ ...t })) : [{ talle: '', cantidad: '' }],
    categoria: initial?.categoria || '',
    proveedor: initial?.proveedor || '',
    stockMinimo: initial?.stockMinimo ?? 2,
  });

  const updateTalle = (index, field, value) => {
    const updated = [...form.talles];
    updated[index] = { ...updated[index], [field]: value };
    setForm({ ...form, talles: updated });
  };

  const addTalle = () => {
    setForm({ ...form, talles: [...form.talles, { talle: '', cantidad: '' }] });
  };

  const removeTalle = (index) => {
    if (form.talles.length <= 1) return;
    setForm({ ...form, talles: form.talles.filter((_, i) => i !== index) });
  };

  const totalCantidad = form.talles.reduce(
    (sum, t) => sum + (Number(t.cantidad) || 0),
    0
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    const tallesValidos = form.talles.filter((t) => t.talle.trim());
    onSubmit({
      ...form,
      precio: Number(form.precio),
      talles: tallesValidos.map((t) => ({
        talle: t.talle.trim(),
        cantidad: Number(t.cantidad) || 0,
      })),
      stockMinimo: Number(form.stockMinimo),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="block text-xs text-white/40 font-medium uppercase tracking-wider mb-1.5">Nombre</label>
          <input
            type="text"
            required
            value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            className="w-full px-3 py-2.5 bg-white/[0.07] border border-white/10 rounded-lg text-white placeholder-white/20 focus:outline-none focus:border-white/30 transition-all text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-white/40 font-medium uppercase tracking-wider mb-1.5">Precio</label>
          <input
            type="number"
            step="0.01"
            required
            min="0"
            value={form.precio}
            onChange={(e) => setForm({ ...form, precio: e.target.value })}
            className="w-full px-3 py-2.5 bg-white/[0.07] border border-white/10 rounded-lg text-white placeholder-white/20 focus:outline-none focus:border-white/30 transition-all text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-white/40 font-medium uppercase tracking-wider mb-1.5">Stock Mínimo</label>
          <input
            type="number"
            required
            min="0"
            value={form.stockMinimo}
            onChange={(e) => setForm({ ...form, stockMinimo: e.target.value })}
            className="w-full px-3 py-2.5 bg-white/[0.07] border border-white/10 rounded-lg text-white placeholder-white/20 focus:outline-none focus:border-white/30 transition-all text-sm"
          />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-xs text-white/40 font-medium uppercase tracking-wider">Talles</label>
          <button
            type="button"
            onClick={addTalle}
            className="text-xs text-green-400 bg-green-500/10 border border-green-500/30 px-2 py-1 rounded-lg hover:bg-green-500/20 transition-all"
          >
            + Agregar talle
          </button>
        </div>
        <div className="space-y-2">
          {form.talles.map((t, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Talle"
                value={t.talle}
                onChange={(e) => updateTalle(i, 'talle', e.target.value)}
                className="w-24 px-3 py-2 bg-white/[0.07] border border-white/10 rounded-lg text-white placeholder-white/20 focus:outline-none focus:border-white/30 transition-all text-sm"
              />
              <input
                type="number"
                min="0"
                placeholder="Cant."
                value={t.cantidad}
                onChange={(e) => updateTalle(i, 'cantidad', e.target.value)}
                className="w-24 px-3 py-2 bg-white/[0.07] border border-white/10 rounded-lg text-white placeholder-white/20 focus:outline-none focus:border-white/30 transition-all text-sm"
              />
              {form.talles.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeTalle(i)}
                  className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>
        <p className="text-xs text-white/30 mt-2">Total: {totalCantidad} unidades</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-white/40 font-medium uppercase tracking-wider mb-1.5">Categoría</label>
          <input
            type="text"
            required
            value={form.categoria}
            onChange={(e) => setForm({ ...form, categoria: e.target.value })}
            className="w-full px-3 py-2.5 bg-white/[0.07] border border-white/10 rounded-lg text-white placeholder-white/20 focus:outline-none focus:border-white/30 transition-all text-sm"
            placeholder="Ej: Pantalones, Remeras, Buzos..."
          />
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
          className="px-4 py-2 text-white/50 border border-white/10 rounded-lg text-sm hover:bg-white/5 transition-all"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white border border-white/10 rounded-lg text-sm transition-all"
        >
          {initial ? 'Actualizar' : 'Crear'} Producto
        </button>
      </div>
    </form>
  );
};

export default ProductForm;
