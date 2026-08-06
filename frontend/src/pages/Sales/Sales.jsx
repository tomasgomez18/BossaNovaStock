import { useState, useEffect, Fragment } from 'react';
import Swal from 'sweetalert2';
import { getSales, getSalesStats, getMostSold, deleteSale, getDailyClose, getDailyCloses, deleteDailyClose, resendCloseMail } from '../../api/sales';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useAuth } from '../../context/AuthContext';

const today = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const mondayOfWeek = () => {
  const d = new Date();
  const diff = d.getDay() === 0 ? 6 : d.getDay() - 1;
  d.setDate(d.getDate() - diff);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const sundayOfWeek = () => {
  const d = new Date();
  const diff = d.getDay() === 0 ? 0 : 7 - d.getDay();
  d.setDate(d.getDate() + diff);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const firstOfMonth = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}-01`;
};

const periodos = [
  { key: 'todas', label: 'Todas', desde: () => '', hasta: () => '' },
  { key: 'dia', label: 'Hoy', desde: today, hasta: today },
  { key: 'semana', label: 'Semana', desde: mondayOfWeek, hasta: sundayOfWeek },
  { key: 'mes', label: 'Mes', desde: firstOfMonth, hasta: today },
];

const formatDate = (date) =>
  new Date(date).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

const formatMoney = (n) =>
  `$${Number(n).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;

const getPagos = (s) =>
  (s.pagos && s.pagos.length > 0 ? s.pagos : [{ metodo: s.metodoPago || 'efectivo', monto: s.total }]);

const getItems = (s) =>
  (s.items && s.items.length > 0 ? s.items : [{ producto: s.producto, cantidad: s.cantidad, precio: s.precio, talle: s.talle }]);

const turnoLabel = (t) => (t === 'manana' ? 'Mañana' : t === 'tarde' ? 'Tarde' : 'Día completo');

const turnoTableLabel = (t) => (t === 'manana' ? 'Turno Mañana' : t === 'tarde' ? 'Turno Tarde' : 'Día completo');

const turnoBadge = (t) => {
  if (t === 'manana') return 'bg-sky-500/20 text-sky-400';
  if (t === 'tarde') return 'bg-orange-500/20 text-orange-400';
  return 'bg-white/10 text-white/60';
};

const Sales = () => {
  const { user } = useAuth();

  const [desde, setDesde] = useState(today);
  const [hasta, setHasta] = useState(today);
  const [activePeriodo, setActivePeriodo] = useState('dia');
  const [data, setData] = useState({ sales: [], total: 0 });
  const [stats, setStats] = useState(null);
  const [mostSold, setMostSold] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');

  const [activeTab, setActiveTab] = useState('ventas');

  const [cDesde, setCDesde] = useState(today);
  const [cHasta, setCHasta] = useState(today);
  const [cActivePeriodo, setCActivePeriodo] = useState('dia');
  const [cView, setCView] = useState('turno');
  const [closes, setCloses] = useState([]);
  const [closesLoading, setClosesLoading] = useState(false);

  const [expandedId, setExpandedId] = useState(null);
  const [showCloseHint, setShowCloseHint] = useState(true);

  const fetchData = () => {
    setLoading(true);
    setFetchError('');
    const tz = new Date().getTimezoneOffset();
    Promise.all([
      getSales({ desde, hasta, offset: tz }),
      getSalesStats({ desde, hasta, offset: tz }),
      getMostSold({ desde, hasta, offset: tz }),
    ])
      .then(([salesRes, statsRes, mostSoldRes]) => {
        setData(salesRes.data);
        setStats(statsRes.data);
        setMostSold(mostSoldRes.data);
      })
      .catch((err) => {
        setFetchError(err.response?.data?.message || 'Error al cargar ventas');
      })
      .finally(() => setLoading(false));
  };

  const fetchCloses = () => {
    setClosesLoading(true);
    getDailyCloses({ desde: cDesde, hasta: cHasta, offset: new Date().getTimezoneOffset(), agrupar: cView })
      .then((res) => setCloses(res.data))
      .catch(() => {})
      .finally(() => setClosesLoading(false));
  };

  const viewCloseDetail = (d) => {
    const metodos = [
      { key: 'efectivo', label: 'Efectivo', color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20' },
      { key: 'transferencia', label: 'Transferencia', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
      { key: 'tarjeta', label: 'Tarjeta', color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
    ];

    const fechaStr = new Date(d.fecha).toLocaleDateString('es-AR');

    const block = (c) => {
      const rowsHtml = metodos.map((m) => {
        const info = c[m.key] || { total: 0, cantidad: 0 };
        return `
          <div class="flex items-center justify-between ${m.bg} ${m.border} border rounded-lg px-4 py-3">
            <div>
              <p class="text-sm font-medium text-white">${m.label}</p>
              <p class="text-xs text-white/40">${info.cantidad} unidades</p>
            </div>
            <p class="text-lg font-bold ${m.color}">$${Number(info.total).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</p>
          </div>
        `;
      }).join('');

      return `
        <div>
          <div class="flex items-center justify-between mb-2">
            <p class="text-sm font-bold text-white">${turnoLabel(c.turno)}</p>
            <p class="text-xs text-white/30">${new Date(c.cerradoAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} · ${c.cerradoPor || '—'}</p>
          </div>
          <p class="text-2xl font-bold text-green-400 mb-3">$${Number(c.total).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</p>
          <div class="space-y-2">${rowsHtml}</div>
        </div>
      `;
    };

    const esDia = Array.isArray(d.turnos);
    const title = esDia
      ? `Cierre del ${fechaStr}`
      : `Cierre de ${turnoLabel(d.turno)} del ${fechaStr}`;

    const html = esDia
      ? `
        <div class="text-left space-y-4" style="max-width: 420px; margin: 0 auto;">
          <div class="text-center mb-1">
            <p class="text-xs text-white/40">Total del día</p>
            <p class="text-3xl font-bold text-white mt-1">$${Number(d.total).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</p>
            <p class="text-xs text-white/40 mt-1">${d.cantidad} unidades vendidas</p>
          </div>
          <div class="h-px bg-white/10"></div>
          ${d.turnos.map(block).join('<div class="h-px bg-white/10"></div>')}
        </div>
      `
      : `
        <div class="text-left space-y-3" style="max-width: 420px; margin: 0 auto;">
          ${block(d)}
        </div>
      `;

    Swal.fire({
      icon: 'info',
      title,
      html,
      confirmButtonText: 'Cerrar',
      background: '#171717',
      color: '#fff',
      confirmButtonColor: '#22c55e',
      width: 'min(480px, 94vw)',
    });
  };

  const handleDailyClose = async (turno) => {
    const label = turno === 'tarde' ? 'Tarde' : 'Mañana';
    const hoy = today();

    const { value, isConfirmed } = await Swal.fire({
      icon: 'question',
      title: `Cierre de ${label}`,
      html: `
        <div class="text-left space-y-4" style="max-width: 380px; margin: 0 auto;">
          <div>
            <label class="block text-xs text-white/40 uppercase tracking-wider mb-1.5">Fecha del cierre</label>
            <input type="date" id="swal-fecha" value="${hoy}" max="${hoy}"
              class="w-full px-3 py-2 bg-neutral-800 border border-white/10 rounded-lg text-white focus:outline-none focus:border-white/30 transition-all text-sm" />
            <p class="text-xs text-white/30 mt-1.5 text-left">¿Te olvidaste de cerrar un turno? Podés elegir la fecha y cerrar un día anterior.</p>
          </div>
          <div>
            <label class="block text-xs text-white/40 uppercase tracking-wider mb-1.5">Quién cierra el turno</label>
            <input type="text" id="swal-cerrado-por" placeholder="Nombre del empleado"
              class="w-full px-3 py-2 bg-neutral-800 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-white/30 transition-all text-sm" />
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Confirmar cierre',
      cancelButtonText: 'Cancelar',
      background: '#171717',
      color: '#fff',
      confirmButtonColor: '#22c55e',
      preConfirm: () => {
        const fecha = Swal.getPopup().querySelector('#swal-fecha').value;
        const nombre = Swal.getPopup().querySelector('#swal-cerrado-por').value.trim();
        if (!nombre) {
          Swal.showValidationMessage('Debe indicar quién cierra el turno');
          return false;
        }
        return { fecha, nombre };
      },
    });
    if (!isConfirmed || !value) return;

    const { fecha, nombre } = value;

    if (fecha !== hoy) {
      const confirmado = await Swal.fire({
        icon: 'warning',
        title: `¿Cerrar el turno del ${new Date(`${fecha}T00:00:00`).toLocaleDateString('es-AR')}?`,
        text: 'Estás cerrando un turno de un día anterior. Verificá los montos antes de confirmar.',
        showCancelButton: true,
        confirmButtonText: 'Sí, cerrar',
        cancelButtonText: 'Cancelar',
        background: '#171717',
        color: '#fff',
        confirmButtonColor: '#f59e0b',
      });
      if (!confirmado.isConfirmed) return;
    }

    try {
      const params = { offset: new Date().getTimezoneOffset(), turno, cerradoPor: nombre };
      if (fecha !== hoy) params.fecha = fecha;
      const res = await getDailyClose(params);
      const d = res.data;
      const fechaLabel = new Date(d.fecha).toLocaleDateString('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });

      const metodos = [
        { key: 'efectivo', label: 'Efectivo', color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20' },
        { key: 'transferencia', label: 'Transferencia', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
        { key: 'tarjeta', label: 'Tarjeta', color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
      ];

      const rows = metodos.map((m) => {
        const info = d[m.key] || { total: 0, cantidad: 0 };
        return `
          <div class="flex items-center justify-between ${m.bg} ${m.border} border rounded-lg px-4 py-3">
            <div>
              <p class="text-sm font-medium text-white">${m.label}</p>
              <p class="text-xs text-white/40">${info.cantidad} unidades</p>
            </div>
            <p class="text-lg font-bold ${m.color}">$${Number(info.total).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</p>
          </div>
        `;
      }).join('');

      await Swal.fire({
        icon: 'success',
        title: `Cierre de ${label}`,
        html: `
          <div class="text-left space-y-3" style="max-width: 420px; margin: 0 auto;">
            <div class="text-center mb-4">
              <p class="text-xs text-white/40">${fechaLabel} · Cerrado por ${d.cerradoPor}</p>
              <p class="text-3xl font-bold text-white mt-2">$${Number(d.total).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</p>
              <p class="text-xs text-white/40">${d.cantidad} unidades vendidas</p>
            </div>
            <div class="h-px bg-white/10 my-4"></div>
            ${rows}
            <div class="text-center mt-2">
              <p class="text-xs text-white/30">Cierre registrado exitosamente</p>
            </div>
          </div>
        `,
        confirmButtonText: 'Ver en historial',
        background: '#171717',
        color: '#fff',
        confirmButtonColor: '#22c55e',
        width: 'min(480px, 94vw)',
      });

      setActiveTab('cierres');
      setCDesde(today());
      setCHasta(today());
      setCActivePeriodo('dia');
      fetchCloses();
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err.response?.data?.message || 'Error al obtener cierre de caja',
        background: '#171717',
        color: '#fff',
        confirmButtonColor: '#22c55e',
        confirmButtonText: 'OK',
      });
    }
  };

  const handleDelete = async (id) => {
    const confirmed = await Swal.fire({
      icon: 'question',
      title: '¿Eliminar esta venta?',
      text: 'El stock se restaurará automáticamente',
      showCancelButton: true,
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar',
      background: '#171717',
      color: '#fff',
      confirmButtonColor: '#ef4444',
    });
    if (!confirmed.isConfirmed) return;
    try {
      await deleteSale(id);
      Swal.fire({ icon: 'success', title: 'Venta eliminada', timer: 1500, showConfirmButton: false, background: '#171717', color: '#fff' });
      setExpandedId(null);
      fetchData();
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.message || 'Error al eliminar venta', background: '#171717', color: '#fff', confirmButtonColor: '#fff', confirmButtonText: 'OK' });
    }
  };

  const handleDeleteClose = async (id) => {
    const confirmed = await Swal.fire({
      icon: 'question',
      title: '¿Eliminar este cierre?',
      text: 'El cierre se eliminará permanentemente',
      showCancelButton: true,
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar',
      background: '#171717',
      color: '#fff',
      confirmButtonColor: '#ef4444',
    });
    if (!confirmed.isConfirmed) return;
    try {
      await deleteDailyClose(id);
      Swal.fire({ icon: 'success', title: 'Cierre eliminado', timer: 1500, showConfirmButton: false, background: '#171717', color: '#fff' });
      fetchCloses();
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.message || 'Error al eliminar cierre', background: '#171717', color: '#fff', confirmButtonColor: '#fff', confirmButtonText: 'OK' });
    }
  };

  const handleResendCloseMail = async (id) => {
    try {
      await resendCloseMail(id);
      Swal.fire({ icon: 'success', title: 'Mail reenviado', timer: 2000, showConfirmButton: false, background: '#171717', color: '#fff' });
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.message || 'Error al reenviar el mail', background: '#171717', color: '#fff', confirmButtonColor: '#fff', confirmButtonText: 'OK' });
    }
  };

  useEffect(() => {
    fetchData();
  }, [desde, hasta]);

  useEffect(() => {
    fetchCloses();
  }, [cDesde, cHasta, cView]);

  const selectPeriodo = (p) => {
    setActivePeriodo(p.key);
    setDesde(p.desde());
    setHasta(p.hasta());
  };

  const formatDateShort = (date) =>
    new Date(date).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

  if (loading && activeTab === 'ventas') return <LoadingSpinner />;

  return (
    <div>
      {fetchError && (
        <div className="mb-4 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
          {fetchError}
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div className="flex gap-1 bg-neutral-900/50 border border-white/5 rounded-lg p-1 w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('ventas')}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'ventas'
                ? 'bg-white/10 text-white'
                : 'text-white/40 hover:text-white/60'
            }`}
          >
            Ventas
          </button>
          <button
            onClick={() => setActiveTab('cierres')}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'cierres'
                ? 'bg-white/10 text-white'
                : 'text-white/40 hover:text-white/60'
            }`}
          >
            Cierres
          </button>
        </div>
        <div className="flex flex-col items-end gap-1 w-full sm:w-auto">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => handleDailyClose('manana')}
              className="flex-1 sm:flex-none text-sm text-sky-400 bg-sky-500/10 border border-sky-500/30 px-3 py-2 rounded-lg hover:bg-sky-500/20 transition-all"
            >
              Cierre Mañana
            </button>
            <button
              onClick={() => handleDailyClose('tarde')}
              className="flex-1 sm:flex-none text-sm text-orange-400 bg-orange-500/10 border border-orange-500/30 px-3 py-2 rounded-lg hover:bg-orange-500/20 transition-all"
            >
              Cierre Tarde
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'ventas' ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 [&>*]:min-w-0">
            <div className="bg-neutral-900/50 backdrop-blur-xl border border-white/5 rounded-xl p-5">
              <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Total Vendido</p>
              <p className="text-3xl font-bold text-green-400 break-words">
                {formatMoney(stats?.total || 0)}
              </p>
              <p className="text-xs text-white/30 mt-1">{stats?.cantidad || 0} unidades</p>
            </div>
            <div className="bg-neutral-900/50 backdrop-blur-xl border border-green-500/20 rounded-xl p-5">
              <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Efectivo</p>
              <p className="text-2xl font-bold text-white break-words">
                {formatMoney(stats?.efectivo?.total || 0)}
              </p>
              <p className="text-xs text-white/30 mt-1">{stats?.efectivo?.cantidad || 0} unidades</p>
            </div>
            <div className="bg-neutral-900/50 backdrop-blur-xl border border-blue-500/20 rounded-xl p-5">
              <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Transferencia</p>
              <p className="text-2xl font-bold text-white break-words">
                {formatMoney(stats?.transferencia?.total || 0)}
              </p>
              <p className="text-xs text-white/30 mt-1">{stats?.transferencia?.cantidad || 0} unidades</p>
            </div>
            <div className="bg-neutral-900/50 backdrop-blur-xl border border-purple-500/20 rounded-xl p-5">
              <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Tarjeta de Credito</p>
              <p className="text-2xl font-bold text-white break-words">
                {formatMoney(stats?.tarjeta?.total || 0)}
              </p>
              <p className="text-xs text-white/30 mt-1">{stats?.tarjeta?.cantidad || 0} unidades</p>
            </div>
          </div>

          <div className="bg-neutral-900/50 backdrop-blur-xl border border-white/5 rounded-xl p-5 mb-4 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <label className="text-xs text-white/40 uppercase tracking-wider shrink-0">Desde</label>
                <input
                  type="date"
                  value={desde}
                  onChange={(e) => setDesde(e.target.value)}
                  className="flex-1 sm:flex-none min-w-0 px-3 py-2 bg-white/[0.07] border border-white/10 rounded-lg text-white focus:outline-none focus:border-white/30 transition-all text-sm"
                />
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <label className="text-xs text-white/40 uppercase tracking-wider shrink-0">Hasta</label>
                <input
                  type="date"
                  value={hasta}
                  onChange={(e) => setHasta(e.target.value)}
                  className="flex-1 sm:flex-none min-w-0 px-3 py-2 bg-white/[0.07] border border-white/10 rounded-lg text-white focus:outline-none focus:border-white/30 transition-all text-sm"
                />
              </div>
            </div>
            <div className="flex gap-2">
              {periodos.map((p) => (
                <button
                  key={p.key}
                  onClick={() => selectPeriodo(p)}
                  className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    activePeriodo === p.key
                      ? 'bg-white/10 text-white border border-white/10'
                      : 'text-white/40 hover:text-white/60 hover:bg-white/5'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-neutral-900/50 backdrop-blur-xl border border-white/5 rounded-xl p-5 mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-white/50 text-sm">
              {!desde && !hasta
                ? 'Todas las ventas'
                : `Ventas del ${desde === hasta
                  ? new Date(desde).toLocaleDateString('es-AR')
                  : `${new Date(desde).toLocaleDateString('es-AR')} al ${new Date(hasta).toLocaleDateString('es-AR')}`}
              `}
            </p>
            <p className="text-2xl font-bold text-green-400 break-words min-w-0">{formatMoney(data.total)}</p>
          </div>

          {mostSold.length > 0 && (
            <div className="bg-neutral-900/50 backdrop-blur-xl border border-white/5 rounded-xl p-5 mb-4">
              <h2 className="text-xs text-white/40 font-semibold uppercase tracking-wider mb-3">Productos mas vendidos</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {mostSold.map((item) => (
                  <div key={item.productoId} className="border border-white/5 rounded-lg p-3 flex items-center justify-between bg-white/[0.02]">
                    <div className="min-w-0">
                      <p className="font-medium text-white text-sm truncate">{item.nombre}</p>
                      <p className="text-xs text-white/30 truncate">{item.categoria}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-green-400">{formatMoney(item.ingresos)}</p>
                      <p className="text-xs text-white/30">{item.totalVendido} unid.</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="hidden md:block bg-neutral-900/50 backdrop-blur-xl border border-white/5 rounded-xl overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-white/5">
                <tr>
                  <th className="text-left px-4 py-3 text-white/40 font-medium uppercase tracking-wider text-[11px]">Productos</th>
                  <th className="text-left px-4 py-3 text-white/40 font-medium uppercase tracking-wider text-[11px]">Desc.</th>
                  <th className="text-left px-4 py-3 text-white/40 font-medium uppercase tracking-wider text-[11px]">Total</th>
                  <th className="text-left px-4 py-3 text-white/40 font-medium uppercase tracking-wider text-[11px]">Empleado</th>
                  <th className="text-left px-4 py-3 text-white/40 font-medium uppercase tracking-wider text-[11px]">Pago</th>
                  <th className="text-left px-4 py-3 text-white/40 font-medium uppercase tracking-wider text-[11px]">Fecha</th>
                  <th className="text-right px-4 py-3 text-white/40 font-medium uppercase tracking-wider text-[11px]">Accion</th>
                </tr>
              </thead>
              <tbody>
                {data.sales.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-white/30">
                      No hay ventas en este periodo
                    </td>
                  </tr>
                ) : (
                  data.sales.map((s) => {
                    const items = getItems(s);
                    const isExpanded = expandedId === s._id;
                    return (
                      <Fragment key={s._id}>
                        <tr
                          className="border-t border-white/5 hover:bg-white/[0.02] transition-colors cursor-pointer"
                          onClick={() => setExpandedId(isExpanded ? null : s._id)}
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <svg
                                className={`w-4 h-4 text-white/30 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                                fill="currentColor" viewBox="0 0 20 20"
                              >
                                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                              </svg>
                              <span className="font-medium text-white">
                                {items[0]?.producto?.nombre || 'Producto'}
                                {items.length > 1 && <span className="text-white/40 font-normal"> +{items.length - 1} más</span>}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-white/50">{s.descuento ? `${s.descuento}%` : '—'}</td>
                          <td className="px-4 py-3 text-white font-medium">{formatMoney(s.total)}</td>
                          <td className="px-4 py-3 text-white/50">{s.empleado}</td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-1">
                              {getPagos(s).map((p, i) => (
                                <span
                                  key={i}
                                  className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                                    p.metodo === 'efectivo' ? 'bg-green-500/20 text-green-400' :
                                    p.metodo === 'transferencia' ? 'bg-blue-500/20 text-blue-400' :
                                    'bg-purple-500/20 text-purple-400'
                                  }`}
                                >
                                  {p.metodo === 'efectivo' ? 'Efectivo' : p.metodo === 'transferencia' ? 'Transferencia' : 'Tarjeta'}
                                  <span className="ml-1 opacity-60">${Number(p.monto).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-white/30 text-xs">{formatDate(s.createdAt)}</td>
                          <td className="px-4 py-3 text-right">
                            {user?.rol === 'admin' && (
                              <button
                                onClick={(e) => { e.stopPropagation(); handleDelete(s._id); }}
                                className="text-red-400 hover:text-red-300 text-xs border border-red-500/30 px-2 py-1 rounded-lg hover:bg-red-500/10 transition-all"
                              >
                                Eliminar
                              </button>
                            )}
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr key={`${s._id}-expanded`}>
                            <td colSpan={7} className="px-0 py-0">
                              <div className="bg-white/[0.02] border-t border-white/5">
                                <table className="w-full text-sm">
                                  <thead>
                                    <tr className="text-[11px] text-white/30 uppercase tracking-wider">
                                      <th className="text-left px-4 py-2 pl-12 font-medium">Producto</th>
                                      <th className="text-left px-4 py-2 font-medium">Categoria</th>
                                      <th className="text-left px-4 py-2 font-medium">Cantidad</th>
                                      <th className="text-left px-4 py-2 font-medium">Talle</th>
                                      <th className="text-left px-4 py-2 font-medium">Precio Unit.</th>
                                      <th className="text-left px-4 py-2 font-medium">Subtotal</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {items.map((item, idx) => (
                                      <tr key={idx} className="border-t border-white/5">
                                        <td className="px-4 py-2 pl-12 text-white font-medium">{item.producto?.nombre || 'Producto'}</td>
                                        <td className="px-4 py-2 text-white/50">{item.producto?.categoria || '—'}</td>
                                        <td className="px-4 py-2 text-white">{item.cantidad}</td>
                                        <td className="px-4 py-2 text-white/50">{item.talle || '—'}</td>
                                        <td className="px-4 py-2 text-white/50">{formatMoney(item.precio)}</td>
                                        <td className="px-4 py-2 text-white font-medium">{formatMoney(item.subtotal || item.precio * item.cantidad)}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="md:hidden space-y-3">
            {data.sales.length === 0 ? (
              <div className="text-center py-8 text-white/30 text-sm">
                No hay ventas en este periodo
              </div>
            ) : (
              data.sales.map((s) => {
                const items = getItems(s);
                const isExpanded = expandedId === s._id;
                const totalUnidades = items.reduce((acc, i) => acc + (Number(i.cantidad) || 0), 0);
                return (
                  <div key={s._id} className="bg-neutral-900/50 backdrop-blur-xl border border-white/5 rounded-xl p-4">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <p className="font-medium text-white truncate min-w-0">
                        {items[0]?.producto?.nombre || 'Producto'}
                        {items.length > 1 && <span className="text-white/40 font-normal"> +{items.length - 1} más</span>}
                      </p>
                      <div className="flex flex-wrap gap-1 justify-end shrink-0">
                        {getPagos(s).map((p, i) => (
                          <span
                            key={i}
                            className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                              p.metodo === 'efectivo' ? 'bg-green-500/20 text-green-400' :
                              p.metodo === 'transferencia' ? 'bg-blue-500/20 text-blue-400' :
                              'bg-purple-500/20 text-purple-400'
                            }`}
                          >
                            {p.metodo === 'efectivo' ? 'Efectivo' : p.metodo === 'transferencia' ? 'Transferencia' : 'Tarjeta'}
                            <span className="ml-1 opacity-60">${Number(p.monto).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-2xl font-bold text-green-400 break-words min-w-0">{formatMoney(s.total)}</p>
                      <p className="text-xs text-white/30 shrink-0">{totalUnidades} unidades</p>
                    </div>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
                      <p className="text-xs text-white/30 truncate min-w-0 flex-1">
                        {new Date(s.createdAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} · {s.empleado}
                        {s.descuento ? ` · ${s.descuento}% desc.` : ''}
                      </p>
                      <div className="flex gap-2 shrink-0">
                        {user?.rol === 'admin' && (
                          <button
                            onClick={() => handleDelete(s._id)}
                            className="text-red-400 text-xs border border-red-500/30 px-2 py-1 rounded-lg hover:bg-red-500/10 transition-all"
                          >
                            Eliminar
                          </button>
                        )}
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : s._id)}
                          className="text-blue-400 text-xs border border-blue-500/30 px-2 py-1 rounded-lg hover:bg-blue-500/10 transition-all"
                        >
                          {isExpanded ? 'Ocultar' : 'Ver detalle'}
                        </button>
                      </div>
                    </div>
                    {isExpanded && (
                      <div className="mt-3 pt-3 border-t border-white/5 space-y-2">
                        {items.map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between gap-2 text-sm">
                            <div className="min-w-0">
                              <p className="text-white font-medium truncate">{item.producto?.nombre || 'Producto'}</p>
                              <p className="text-xs text-white/30">
                                {item.producto?.categoria || '—'}
                                {item.talle ? ` · Talle ${item.talle}` : ''}
                              </p>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-white">{item.cantidad} × {formatMoney(item.precio)}</p>
                              <p className="text-xs text-green-400 font-medium">{formatMoney(item.subtotal || item.precio * item.cantidad)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </>
      ) : (
        <>
          {showCloseHint && (
            <div className="mb-4 flex items-start gap-3 bg-sky-500/10 border border-sky-500/30 rounded-xl px-4 py-3">
              <p className="text-sm text-sky-300 flex-1">
                <span className="font-medium">¿Te olvidaste de cerrar un turno?</span>{' '}
                Tocá <span className="font-medium">Cierre Mañana</span> o{' '}
                <span className="font-medium">Cierre Tarde</span> y cambiá la fecha para cerrar un día anterior.
              </p>
              <button
                onClick={() => setShowCloseHint(false)}
                className="text-sky-400/60 hover:text-sky-300 transition-colors shrink-0"
                aria-label="Ocultar aviso"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
          <div className="mb-4 flex items-start gap-3 bg-red-500/10 border border-amber-900/30 rounded-xl px-4 py-3">
            <p className="text-sm text-red-500 flex-1">
              <span className="font-medium">Envío de mail en mantenimiento:</span>{' '}
               Funcionalidad no disponible. Estamos trabajando en ella, próximamente estará disponible.
            </p>
          </div>
          <div className="bg-neutral-900/50 backdrop-blur-xl border border-white/5 rounded-xl p-5 mb-4 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <label className="text-xs text-white/40 uppercase tracking-wider shrink-0">Desde</label>
                  <input
                    type="date"
                    value={cDesde}
                    onChange={(e) => setCDesde(e.target.value)}
                    className="flex-1 sm:flex-none min-w-0 px-3 py-2 bg-white/[0.07] border border-white/10 rounded-lg text-white focus:outline-none focus:border-white/30 transition-all text-sm"
                  />
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <label className="text-xs text-white/40 uppercase tracking-wider shrink-0">Hasta</label>
                  <input
                    type="date"
                    value={cHasta}
                    onChange={(e) => setCHasta(e.target.value)}
                    className="flex-1 sm:flex-none min-w-0 px-3 py-2 bg-white/[0.07] border border-white/10 rounded-lg text-white focus:outline-none focus:border-white/30 transition-all text-sm"
                  />
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-xs text-white/40 uppercase tracking-wider">
                  Vista por día
                </span>
                <button
                  onClick={() => setCView(cView === 'turno' ? 'dia' : 'turno')}
                  role="switch"
                  aria-checked={cView === 'dia'}
                  className={`relative w-11 h-6 rounded-full transition-colors duration-200 shrink-0 ${
                    cView === 'dia' ? 'bg-green-500' : 'bg-white/10'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
                      cView === 'dia' ? 'translate-x-5' : ''
                    }`}
                  />
                </button>
              </div>
            </div>
            <div className="flex gap-2">
              {periodos.map((p) => (
                <button
                  key={p.key}
                  onClick={() => {
                    setCActivePeriodo(p.key);
                    setCDesde(p.desde());
                    setCHasta(p.hasta());
                  }}
                  className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    cActivePeriodo === p.key
                      ? 'bg-white/10 text-white border border-white/10'
                      : 'text-white/40 hover:text-white/60 hover:bg-white/5'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="hidden md:block bg-neutral-900/50 backdrop-blur-xl border border-white/5 rounded-xl overflow-x-auto">
            {closesLoading ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner />
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-white/5">
                  <tr>
                    <th className="text-left px-4 py-3 text-white/40 font-medium uppercase tracking-wider text-[11px]">Fecha</th>
                    <th className="text-left px-4 py-3 text-white/40 font-medium uppercase tracking-wider text-[11px]">Turno</th>
                    <th className="text-left px-4 py-3 text-white/40 font-medium uppercase tracking-wider text-[11px]">Total</th>
                    <th className="text-left px-4 py-3 text-white/40 font-medium uppercase tracking-wider text-[11px]">Cant.</th>
                    <th className="text-left px-4 py-3 text-white/40 font-medium uppercase tracking-wider text-[11px]">Efectivo</th>
                    <th className="text-left px-4 py-3 text-white/40 font-medium uppercase tracking-wider text-[11px]">Transferencia</th>
                    <th className="text-left px-4 py-3 text-white/40 font-medium uppercase tracking-wider text-[11px]">Tarjeta</th>
                    <th className="text-left px-4 py-3 text-white/40 font-medium uppercase tracking-wider text-[11px]">Cerrado</th>
                    <th className="text-left px-4 py-3 text-white/40 font-medium uppercase tracking-wider text-[11px]">Cerrado por</th>
                    <th className="text-right px-4 py-3 text-white/40 font-medium uppercase tracking-wider text-[11px]">Accion</th>
                  </tr>
                </thead>
                <tbody>
                  {closes.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="text-center py-8 text-white/30">
                        No hay cierres en este periodo
                      </td>
                    </tr>
                  ) : (
                    closes.map((c) => (
                      <tr key={c._id || c.fecha} className="border-t border-white/5 hover:bg-white/[0.02] transition-colors">
                        <td className="px-4 py-3 font-medium text-white">{formatDateShort(c.fecha)}</td>
                        <td className="px-4 py-3">
                          {c.turnos ? (
                            <div className="flex flex-wrap gap-1">
                              {c.turnos.map((t, i) => (
                                <span key={i} className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${turnoBadge(t.turno)}`}>
                                  {turnoTableLabel(t.turno)}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${turnoBadge(c.turno)}`}>
                              {turnoTableLabel(c.turno)}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-green-400 font-medium">{formatMoney(c.total)}</td>
                        <td className="px-4 py-3 text-white">{c.cantidad}</td>
                        <td className="px-4 py-3 text-white">
                          <span className="text-green-400 font-medium">{formatMoney(c.efectivo?.total || 0)}</span>
                          <span className="text-white/30 text-xs ml-1">({c.efectivo?.cantidad || 0})</span>
                        </td>
                        <td className="px-4 py-3 text-white">
                          <span className="text-blue-400 font-medium">{formatMoney(c.transferencia?.total || 0)}</span>
                          <span className="text-white/30 text-xs ml-1">({c.transferencia?.cantidad || 0})</span>
                        </td>
                        <td className="px-4 py-3 text-white">
                          <span className="text-purple-400 font-medium">{formatMoney(c.tarjeta?.total || 0)}</span>
                          <span className="text-white/30 text-xs ml-1">({c.tarjeta?.cantidad || 0})</span>
                        </td>
                        <td className="px-4 py-3 text-white/30 text-xs">{new Date(c.cerradoAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</td>
                        <td className="px-4 py-3 text-white/50">
                          {c.turnos
                            ? [...new Set(c.turnos.map((t) => t.cerradoPor).filter(Boolean))].join(' / ') || '—'
                            : c.cerradoPor || '—'}
                        </td>
                        <td className="px-4 py-3 text-right flex items-center justify-end gap-2">
                          <button
                            onClick={() => viewCloseDetail(c)}
                            className="text-blue-400 hover:text-blue-300 text-xs border border-blue-500/30 px-2 py-1 rounded-lg hover:bg-blue-500/10 transition-all"
                          >
                            Ver
                          </button>
                          {!c.turnos && (
                            <button
                            onClick={() => handleResendCloseMail(c._id)}
                            className="text-emerald-400 hover:text-emerald-300 text-xs border border-emerald-500/30 px-2 py-1 rounded-lg hover:bg-emerald-500/10 transition-all"
                          >
                            Reenviar
                          </button>
                          )}
                          {!c.turnos && user?.rol === 'admin' && (
                            <button
                              onClick={() => handleDeleteClose(c._id)}
                              className="text-red-400 hover:text-red-300 text-xs border border-red-500/30 px-2 py-1 rounded-lg hover:bg-red-500/10 transition-all"
                            >
                              Eliminar
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>

          <div className="md:hidden space-y-3">
            {closesLoading ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner />
              </div>
            ) : closes.length === 0 ? (
              <div className="text-center py-8 text-white/30 text-sm">
                No hay cierres en este periodo
              </div>
            ) : (
              closes.map((c) => (
                <div key={c._id || c.fecha} className="bg-neutral-900/50 backdrop-blur-xl border border-white/5 rounded-xl p-4">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <p className="font-medium text-white">{formatDateShort(c.fecha)}</p>
                    <div className="flex flex-wrap gap-1 justify-end">
                      {c.turnos ? (
                        c.turnos.map((t, i) => (
                          <span key={i} className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${turnoBadge(t.turno)}`}>
                            {turnoTableLabel(t.turno)}
                          </span>
                        ))
                      ) : (
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${turnoBadge(c.turno)}`}>
                          {turnoTableLabel(c.turno)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-2xl font-bold text-green-400">{formatMoney(c.total)}</p>
                    <p className="text-xs text-white/30">{c.cantidad} unidades</p>
                  </div>
                  <div className="space-y-2">
                    {[
                      { key: 'efectivo', label: 'Efectivo', color: 'text-green-400' },
                      { key: 'transferencia', label: 'Transferencia', color: 'text-blue-400' },
                      { key: 'tarjeta', label: 'Tarjeta', color: 'text-purple-400' },
                    ].map((m) => (
                      <div key={m.key} className="flex items-center justify-between text-sm">
                        <span className="text-white/40">{m.label} <span className="text-white/20 text-xs">({c[m.key]?.cantidad || 0} unid.)</span></span>
                        <span className={`font-medium ${m.color}`}>{formatMoney(c[m.key]?.total || 0)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
                    <p className="text-xs text-white/30">
                      {new Date(c.cerradoAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} ·{' '}
                      {c.turnos
                        ? [...new Set(c.turnos.map((t) => t.cerradoPor).filter(Boolean))].join(' / ') || '—'
                        : c.cerradoPor || '—'}
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => viewCloseDetail(c)}
                        className="text-blue-400 text-xs border border-blue-500/30 px-2 py-1 rounded-lg hover:bg-blue-500/10 transition-all"
                      >
                        Ver
                      </button>
                      {!c.turnos && (
                        <button
                          onClick={() => handleResendCloseMail(c._id)}
                          className="text-emerald-400 hover:text-emerald-300 text-xs border border-emerald-500/30 px-2 py-1 rounded-lg hover:bg-emerald-500/10 transition-all"
                        >
                          Reenviar
                        </button>
                      )}
                      {!c.turnos && user?.rol === 'admin' && (
                        <button
                          onClick={() => handleDeleteClose(c._id)}
                          className="text-red-400 text-xs border border-red-500/30 px-2 py-1 rounded-lg hover:bg-red-500/10 transition-all"
                        >
                          Eliminar
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Sales;
