import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import {
  getSuppliers,
  createSupplier,
  updateSupplier,
  deleteSupplier,
} from '../../api/suppliers';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const Suppliers = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    nombre: '',
    telefono: '',
    email: '',
    direccion: '',
  });

  const fetchSuppliers = async () => {
    setError('');
    try {
      const res = await getSuppliers();
      setSuppliers(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al cargar proveedores');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const resetForm = () => {
    setForm({ nombre: '', telefono: '', email: '', direccion: '' });
    setEditing(null);
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await updateSupplier(editing._id, form);
      } else {
        await createSupplier(form);
      }
      resetForm();
      fetchSuppliers();
      Swal.fire({ icon: 'success', title: 'Proveedor guardado', timer: 1500, showConfirmButton: false, background: '#171717', color: '#fff' });
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.message || 'Error al guardar proveedor', background: '#171717', color: '#fff', confirmButtonColor: '#fff', confirmButtonText: 'OK' });
    }
  };

  const handleEdit = (sup) => {
    setEditing(sup);
    setForm({
      nombre: sup.nombre,
      telefono: sup.telefono || '',
      email: sup.email || '',
      direccion: sup.direccion || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    const confirmed = await Swal.fire({ icon: 'question', title: '¿Eliminar este proveedor?', text: 'Esta acción no se puede deshacer', showCancelButton: true, confirmButtonText: 'Eliminar', cancelButtonText: 'Cancelar', background: '#171717', color: '#fff', confirmButtonColor: '#ef4444' });
    if (!confirmed.isConfirmed) return;
    try {
      await deleteSupplier(id);
      fetchSuppliers();
      Swal.fire({ icon: 'success', title: 'Proveedor eliminado', timer: 1500, showConfirmButton: false, background: '#171717', color: '#fff' });
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'Error al eliminar proveedor', background: '#171717', color: '#fff', confirmButtonColor: '#fff', confirmButtonText: 'OK' });
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Proveedores</h1>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="bg-white/10 hover:bg-white/20 text-white border border-white/10 px-4 py-2 rounded-lg transition-all text-sm"
        >
          + Nuevo Proveedor
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-neutral-900 border border-white/10 rounded-xl shadow-2xl shadow-black/40 p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-bold text-white mb-4">
              {editing ? 'Editar Proveedor' : 'Nuevo Proveedor'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
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
                <label className="block text-xs text-white/40 font-medium uppercase tracking-wider mb-1.5">Teléfono</label>
                <input
                  type="text"
                  value={form.telefono}
                  onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                  className="w-full px-3 py-2.5 bg-white/[0.07] border border-white/10 rounded-lg text-white placeholder-white/20 focus:outline-none focus:border-white/30 transition-all text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-white/40 font-medium uppercase tracking-wider mb-1.5">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-3 py-2.5 bg-white/[0.07] border border-white/10 rounded-lg text-white placeholder-white/20 focus:outline-none focus:border-white/30 transition-all text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-white/40 font-medium uppercase tracking-wider mb-1.5">Dirección</label>
                <input
                  type="text"
                  value={form.direccion}
                  onChange={(e) => setForm({ ...form, direccion: e.target.value })}
                  className="w-full px-3 py-2.5 bg-white/[0.07] border border-white/10 rounded-lg text-white placeholder-white/20 focus:outline-none focus:border-white/30 transition-all text-sm"
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 text-white/50 border border-white/10 rounded-lg text-sm hover:bg-white/5 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white border border-white/10 rounded-lg text-sm transition-all"
                >
                  {editing ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-4 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="bg-neutral-900/50 backdrop-blur-xl border border-white/5 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-white/5">
              <tr>
                <th className="text-left px-4 py-3 text-white/40 font-medium uppercase tracking-wider text-[11px]">Nombre</th>
                <th className="text-left px-4 py-3 text-white/40 font-medium uppercase tracking-wider text-[11px]">Teléfono</th>
                <th className="text-left px-4 py-3 text-white/40 font-medium uppercase tracking-wider text-[11px]">Email</th>
                <th className="text-left px-4 py-3 text-white/40 font-medium uppercase tracking-wider text-[11px]">Dirección</th>
                <th className="text-left px-4 py-3 text-white/40 font-medium uppercase tracking-wider text-[11px]">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {suppliers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-white/30">
                    No hay proveedores
                  </td>
                </tr>
              ) : (
                suppliers.map((sup) => (
                  <tr key={sup._id} className="border-t border-white/5 hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3 font-medium text-white">{sup.nombre}</td>
                    <td className="px-4 py-3 text-white/50">{sup.telefono || '—'}</td>
                    <td className="px-4 py-3 text-white/50">{sup.email || '—'}</td>
                    <td className="px-4 py-3 text-white/50">{sup.direccion || '—'}</td>
                    <td className="px-4 py-3 flex gap-2">
                      <button
                        onClick={() => handleEdit(sup)}
                        className="text-blue-400 hover:text-blue-300 font-medium text-sm"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(sup._id)}
                        className="text-red-400 hover:text-red-300 font-medium text-sm"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Suppliers;
