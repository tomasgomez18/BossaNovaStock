import { useState, useEffect, Fragment } from 'react';
import Swal from 'sweetalert2';
import { getSales, getSalesStats, getMostSold, salesLogin, deleteSale, getDailyClose, getDailyCloses } from '../../api/sales';
import LoadingSpinner from '../../components/common/LoadingSpinner';

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

const Sales = () => {
  const [authed, setAuthed] = useState(!!localStorage.getItem('salesToken'));
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

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
  const [closes, setCloses] = useState([]);
  const [closesLoading, setClosesLoading] = useState(false);

  const [expandedId, setExpandedId] = useState(null);

  const handleSalesLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);
    try {
      const res = await salesLogin({ email: loginEmail, password: loginPassword });
      localStorage.setItem('salesToken', res.data.token);
      setAuthed(true);
    } catch (err) {
      setLoginError(err.response?.data?.message || 'Error al iniciar sesion');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('salesToken');
    setAuthed(false);
  };

  const fetchData = () => {
    if (!localStorage.getItem('salesToken')) {
      setAuthed(false);
      return;
    }
    setLoading(true);
    setFetchError('');
    Promise.all([
      getSales({ desde, hasta }),
      getSalesStats({ desde, hasta }),
      getMostSold({ desde, hasta }),
    ])
      .then(([salesRes, statsRes, mostSoldRes]) => {
        setData(salesRes.data);
        setStats(statsRes.data);
        setMostSold(mostSoldRes.data);
      })
      .catch((err) => {
        if (!localStorage.getItem('salesToken')) {
          setAuthed(false);
        } else {
          setFetchError(err.response?.data?.message || 'Error al cargar ventas');
        }
      })
      .finally(() => setLoading(false));
  };

  const fetchCloses = () => {
    if (!localStorage.getItem('salesToken')) {
      setAuthed(false);
      return;
    }
    setClosesLoading(true);
    getDailyCloses({ desde: cDesde, hasta: cHasta })
      .then((res) => setCloses(res.data))
      .catch((err) => {
        if (!localStorage.getItem('salesToken')) setAuthed(false);
      })
      .finally(() => setClosesLoading(false));
  };

  const viewCloseDetail = (d) => {
    const metodos = [
      { key: 'efectivo', label: 'Efectivo', color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20' },
      { key: 'transferencia', label: 'Transferencia', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
      { key: 'tarjeta', label: 'Tarjeta', color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
    ];

    const fechaStr = new Date(d.fecha).toLocaleDateString('es-AR');

    const rowsHtml = metodos.map((m) => {
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

    Swal.fire({
      icon: 'info',
      title: `Cierre del ${fechaStr}`,
      html: `
        <div class="text-left space-y-3" style="max-width: 420px; margin: 0 auto;">
          <div class="text-center mb-4">
            <p class="text-3xl font-bold text-white mt-2">$${Number(d.total).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</p>
            <p class="text-xs text-white/40">${d.cantidad} unidades vendidas</p>
            <p class="text-xs text-white/20 mt-1">Cerrado: ${new Date(d.cerradoAt).toLocaleString('es-AR')}</p>
          </div>
          <div class="h-px bg-white/10 my-4"></div>
          ${rowsHtml}
        </div>
      `,
      confirmButtonText: 'Cerrar',
      background: '#171717',
      color: '#fff',
      confirmButtonColor: '#22c55e',
      width: 480,
    });
  };

  const handleDailyClose = async () => {
    try {
      const res = await getDailyClose();
      const d = res.data;

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
        title: `Cierre de Caja`,
        html: `
          <div class="text-left space-y-3" style="max-width: 420px; margin: 0 auto;">
            <div class="text-center mb-4">
              <p class="text-xs text-white/40">${d.fecha}</p>
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
        width: 480,
      });

      setActiveTab('cierres');
      setCDesde(today());
      setCHasta(today());
      setCActivePeriodo('dia');
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

  useEffect(() => {
    if (!authed) return;
    fetchData();
  }, [desde, hasta, authed]);

  useEffect(() => {
    if (!authed) return;
    fetchCloses();
  }, [cDesde, cHasta, authed]);

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

  if (!authed) {
    return (
      <div className="max-w-sm mx-auto mt-20">
        <div className="bg-neutral-900/50 backdrop-blur-xl border border-white/10 rounded-xl p-6">
          <h1 className="text-xl font-bold text-white mb-2">Acceso a Ventas</h1>
          <p className="text-sm text-white/50 mb-6">Ingrese las credenciales de ventas</p>
          <form onSubmit={handleSalesLogin} className="space-y-4">
            <div>
              <label className="block text-xs text-white/40 font-medium uppercase tracking-wider mb-1.5">Email</label>
              <input
                type="email"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                className="w-full px-3 py-2.5 bg-white/[0.07] border border-white/10 rounded-lg text-white placeholder-white/20 focus:outline-none focus:border-white/30 transition-all text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-white/40 font-medium uppercase tracking-wider mb-1.5">Contrasena</label>
              <input
                type="password"
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="w-full px-3 py-2.5 bg-white/[0.07] border border-white/10 rounded-lg text-white placeholder-white/20 focus:outline-none focus:border-white/30 transition-all text-sm"
              />
            </div>
            {loginError && (
              <p className="text-sm text-red-400">{loginError}</p>
            )}
            <button
              type="submit"
              disabled={loginLoading}
              className="w-full py-2.5 bg-green-500/20 text-green-400 border border-green-500/30 rounded-lg text-sm hover:bg-green-500/30 disabled:opacity-50 transition-all"
            >
              {loginLoading ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (loading && activeTab === 'ventas') return <LoadingSpinner />;

  return (
    <div>
      {fetchError && (
        <div className="mb-4 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
          {fetchError}
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div className="flex gap-1 bg-neutral-900/50 border border-white/5 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('ventas')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'ventas'
                ? 'bg-white/10 text-white'
                : 'text-white/40 hover:text-white/60'
            }`}
          >
            Ventas
          </button>
          <button
            onClick={() => setActiveTab('cierres')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'cierres'
                ? 'bg-white/10 text-white'
                : 'text-white/40 hover:text-white/60'
            }`}
          >
            Cierres
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleDailyClose}
            className="text-sm text-green-400 bg-green-500/10 border border-green-500/30 px-3 py-1.5 rounded-lg hover:bg-green-500/20 transition-all"
          >
            Cierre de Caja
          </button>
          <button
            onClick={handleLogout}
            className="text-sm text-red-400 border border-red-500/30 px-3 py-1.5 rounded-lg hover:bg-red-500/10 transition-all"
          >
            Cerrar sesion
          </button>
        </div>
      </div>

      {activeTab === 'ventas' ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-neutral-900/50 backdrop-blur-xl border border-white/5 rounded-xl p-5">
              <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Total Vendido</p>
              <p className="text-3xl font-bold text-green-400">
                {formatMoney(stats?.total || 0)}
              </p>
              <p className="text-xs text-white/30 mt-1">{stats?.cantidad || 0} unidades</p>
            </div>
            <div className="bg-neutral-900/50 backdrop-blur-xl border border-green-500/20 rounded-xl p-5">
              <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Efectivo</p>
              <p className="text-2xl font-bold text-white">
                {formatMoney(stats?.efectivo?.total || 0)}
              </p>
              <p className="text-xs text-white/30 mt-1">{stats?.efectivo?.cantidad || 0} unidades</p>
            </div>
            <div className="bg-neutral-900/50 backdrop-blur-xl border border-blue-500/20 rounded-xl p-5">
              <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Transferencia</p>
              <p className="text-2xl font-bold text-white">
                {formatMoney(stats?.transferencia?.total || 0)}
              </p>
              <p className="text-xs text-white/30 mt-1">{stats?.transferencia?.cantidad || 0} unidades</p>
            </div>
            <div className="bg-neutral-900/50 backdrop-blur-xl border border-purple-500/20 rounded-xl p-5">
              <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Tarjeta de Credito</p>
              <p className="text-2xl font-bold text-white">
                {formatMoney(stats?.tarjeta?.total || 0)}
              </p>
              <p className="text-xs text-white/30 mt-1">{stats?.tarjeta?.cantidad || 0} unidades</p>
            </div>
          </div>

          <div className="bg-neutral-900/50 backdrop-blur-xl border border-white/5 rounded-xl p-5 mb-4 flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-xs text-white/40 uppercase tracking-wider">Desde</label>
              <input
                type="date"
                value={desde}
                onChange={(e) => setDesde(e.target.value)}
                className="px-3 py-2 bg-white/[0.07] border border-white/10 rounded-lg text-white focus:outline-none focus:border-white/30 transition-all text-sm"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-white/40 uppercase tracking-wider">Hasta</label>
              <input
                type="date"
                value={hasta}
                onChange={(e) => setHasta(e.target.value)}
                className="px-3 py-2 bg-white/[0.07] border border-white/10 rounded-lg text-white focus:outline-none focus:border-white/30 transition-all text-sm"
              />
            </div>
            <div className="flex gap-2 ml-auto">
              {periodos.map((p) => (
                <button
                  key={p.key}
                  onClick={() => selectPeriodo(p)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
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

          <div className="bg-neutral-900/50 backdrop-blur-xl border border-white/5 rounded-xl p-5 mb-4 flex items-center justify-between">
            <p className="text-white/50 text-sm">
              {!desde && !hasta
                ? 'Todas las ventas'
                : `Ventas del ${desde === hasta
                  ? new Date(desde).toLocaleDateString('es-AR')
                  : `${new Date(desde).toLocaleDateString('es-AR')} al ${new Date(hasta).toLocaleDateString('es-AR')}`}
              `}
            </p>
            <p className="text-2xl font-bold text-green-400">{formatMoney(data.total)}</p>
          </div>

          {mostSold.length > 0 && (
            <div className="bg-neutral-900/50 backdrop-blur-xl border border-white/5 rounded-xl p-5 mb-4">
              <h2 className="text-xs text-white/40 font-semibold uppercase tracking-wider mb-3">Productos mas vendidos</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {mostSold.map((item) => (
                  <div key={item.productoId} className="border border-white/5 rounded-lg p-3 flex items-center justify-between bg-white/[0.02]">
                    <div>
                      <p className="font-medium text-white text-sm">{item.nombre}</p>
                      <p className="text-xs text-white/30">{item.categoria}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-green-400">{formatMoney(item.ingresos)}</p>
                      <p className="text-xs text-white/30">{item.totalVendido} unid.</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-neutral-900/50 backdrop-blur-xl border border-white/5 rounded-xl overflow-x-auto">
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
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDelete(s._id); }}
                              className="text-red-400 hover:text-red-300 text-xs border border-red-500/30 px-2 py-1 rounded-lg hover:bg-red-500/10 transition-all"
                            >
                              Eliminar
                            </button>
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
        </>
      ) : (
        <>
          <div className="bg-neutral-900/50 backdrop-blur-xl border border-white/5 rounded-xl p-5 mb-4 flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-xs text-white/40 uppercase tracking-wider">Desde</label>
              <input
                type="date"
                value={cDesde}
                onChange={(e) => setCDesde(e.target.value)}
                className="px-3 py-2 bg-white/[0.07] border border-white/10 rounded-lg text-white focus:outline-none focus:border-white/30 transition-all text-sm"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-white/40 uppercase tracking-wider">Hasta</label>
              <input
                type="date"
                value={cHasta}
                onChange={(e) => setCHasta(e.target.value)}
                className="px-3 py-2 bg-white/[0.07] border border-white/10 rounded-lg text-white focus:outline-none focus:border-white/30 transition-all text-sm"
              />
            </div>
            <div className="flex gap-2 ml-auto">
              {periodos.map((p) => (
                <button
                  key={p.key}
                  onClick={() => {
                    setCActivePeriodo(p.key);
                    setCDesde(p.desde());
                    setCHasta(p.hasta());
                  }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
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

          <div className="bg-neutral-900/50 backdrop-blur-xl border border-white/5 rounded-xl overflow-x-auto">
            {closesLoading ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner />
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-white/5">
                  <tr>
                    <th className="text-left px-4 py-3 text-white/40 font-medium uppercase tracking-wider text-[11px]">Fecha</th>
                    <th className="text-left px-4 py-3 text-white/40 font-medium uppercase tracking-wider text-[11px]">Total</th>
                    <th className="text-left px-4 py-3 text-white/40 font-medium uppercase tracking-wider text-[11px]">Cant.</th>
                    <th className="text-left px-4 py-3 text-white/40 font-medium uppercase tracking-wider text-[11px]">Efectivo</th>
                    <th className="text-left px-4 py-3 text-white/40 font-medium uppercase tracking-wider text-[11px]">Transferencia</th>
                    <th className="text-left px-4 py-3 text-white/40 font-medium uppercase tracking-wider text-[11px]">Tarjeta</th>
                    <th className="text-left px-4 py-3 text-white/40 font-medium uppercase tracking-wider text-[11px]">Cerrado</th>
                    <th className="text-right px-4 py-3 text-white/40 font-medium uppercase tracking-wider text-[11px]">Accion</th>
                  </tr>
                </thead>
                <tbody>
                  {closes.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-8 text-white/30">
                        No hay cierres en este periodo
                      </td>
                    </tr>
                  ) : (
                    closes.map((c) => (
                      <tr key={c._id} className="border-t border-white/5 hover:bg-white/[0.02] transition-colors">
                        <td className="px-4 py-3 font-medium text-white">{formatDateShort(c.fecha)}</td>
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
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => viewCloseDetail(c)}
                            className="text-blue-400 hover:text-blue-300 text-xs border border-blue-500/30 px-2 py-1 rounded-lg hover:bg-blue-500/10 transition-all"
                          >
                            Ver
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Sales;
