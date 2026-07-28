import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { getReturns, deleteReturn } from '../../api/returns';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const Returns = () => {
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => { fetchReturns(); }, []);

  const fetchReturns = async () => {
    setLoading(true);
    try {
      const res = await getReturns();
      setReturns(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al cargar devoluciones');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    const confirmed = await Swal.fire({
      icon: 'question',
      title: '¿Eliminar esta devolución?',
      text: 'El stock del producto se ajustará automáticamente',
      showCancelButton: true,
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar',
      background: '#171717',
      color: '#fff',
      confirmButtonColor: '#ef4444',
    });
    if (!confirmed.isConfirmed) return;
    try {
      await deleteReturn(id);
      Swal.fire({ icon: 'success', title: 'Devolución eliminada', timer: 1500, showConfirmButton: false, background: '#171717', color: '#fff' });
      fetchReturns();
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.message || 'Error al eliminar devolución', background: '#171717', color: '#fff', confirmButtonColor: '#fff', confirmButtonText: 'OK' });
    }
  };

  const formatDate = (date) =>
    new Date(date).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Historial de Devoluciones</h1>

      {error && (
        <div className="bg-red-500/15 border border-red-500/25 text-red-300 px-4 py-2.5 rounded-lg mb-4 text-sm">
          {error}
        </div>
      )}

      <div className="bg-neutral-900/50 backdrop-blur-xl border border-white/5 rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-white/5">
            <tr>
              <th className="text-left px-4 py-3 text-white/40 font-medium uppercase tracking-wider text-[11px]">Producto</th>
              <th className="text-left px-4 py-3 text-white/40 font-medium uppercase tracking-wider text-[11px]">Categoría</th>
              <th className="text-left px-4 py-3 text-white/40 font-medium uppercase tracking-wider text-[11px]">Cantidad</th>
              <th className="text-left px-4 py-3 text-white/40 font-medium uppercase tracking-wider text-[11px]">Talle</th>
              <th className="text-left px-4 py-3 text-white/40 font-medium uppercase tracking-wider text-[11px]">Motivo</th>
              <th className="text-left px-4 py-3 text-white/40 font-medium uppercase tracking-wider text-[11px]">Fecha</th>
              <th className="text-right px-4 py-3 text-white/40 font-medium uppercase tracking-wider text-[11px]">Acción</th>
            </tr>
          </thead>
          <tbody>
            {returns.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-8 text-white/30">
                  No hay devoluciones registradas
                </td>
              </tr>
            ) : (
              returns.map((r) => (
                <tr key={r._id} className="border-t border-white/5 hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3 font-medium text-white">{r.producto?.nombre}</td>
                  <td className="px-4 py-3 text-white/50">{r.producto?.categoria || '—'}</td>
                  <td className="px-4 py-3 text-white">{r.cantidad}</td>
                  <td className="px-4 py-3 text-white/50">{r.talle || '—'}</td>
                  <td className="px-4 py-3 text-white/50">{r.motivo}</td>
                  <td className="px-4 py-3 text-white/30 text-xs">{formatDate(r.createdAt)}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleDelete(r._id)}
                      className="text-red-400 hover:text-red-300 text-xs border border-red-500/30 px-2 py-1 rounded-lg hover:bg-red-500/10 transition-all"
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
    </div>
  );
};

export default Returns;
