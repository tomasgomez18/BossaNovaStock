import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  exchangeProduct,
  addStock,
  getLowStock,
} from '../../api/products';
import { createReturn } from '../../api/returns';
import { createSale } from '../../api/sales';
import ProductForm from '../../components/ProductForm/ProductForm';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useAuth } from '../../context/AuthContext';

const variantLabel = (v) => {
  const parts = [];
  if (v.talle) parts.push(v.talle);
  if (v.color) parts.push(v.color);
  const label = parts.join(' / ') || 'Sin variante';
  return `${label} (${v.cantidad})`;
};

const variantShortLabel = (v) => {
  const parts = [];
  if (v.talle) parts.push(v.talle);
  if (v.color) parts.push(v.color);
  return parts.join(' / ') || '—';
};

const getDropdownPosition = (el) => {
  const rect = el.getBoundingClientRect();
  const W = 160;
  const H = 220;
  const GAP = 28;
  let x = rect.left;
  let y = rect.bottom + GAP;
  if (y + H > window.innerHeight) {
    y = rect.top - GAP - H;
  }
  if (y < 0) y = GAP;
  if (x + W > window.innerWidth) {
    x = rect.right - W;
  }
  if (x < 0) x = GAP;
  return { x, y };
};

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [dropdown, setDropdown] = useState({ product: null, x: 0, y: 0 });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [returnModal, setReturnModal] = useState(null);
  const [returnCantidad, setReturnCantidad] = useState('1');
  const [returnVariantIdx, setReturnVariantIdx] = useState('');
  const [returnMotivo, setReturnMotivo] = useState('');
  const [returnOtroMotivo, setReturnOtroMotivo] = useState('');
  const [exchangeActivo, setExchangeActivo] = useState(false);
  const [exchangeSearch, setExchangeSearch] = useState('');
  const [exchangeTarget, setExchangeTarget] = useState(null);
  const [exchangeCantidad, setExchangeCantidad] = useState('1');
  const [exchangeVariantIdx, setExchangeVariantIdx] = useState('');

  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [quickAdd, setQuickAdd] = useState(null);
  const [qaCantidad, setQaCantidad] = useState('1');
  const [qaVariantIdx, setQaVariantIdx] = useState('');
  const [qaPrecio, setQaPrecio] = useState('');

  const [sellEmpleado, setSellEmpleado] = useState('');
  const [sellDescuento, setSellDescuento] = useState('');
  const [sellMetodoPago, setSellMetodoPago] = useState('efectivo');
  const [sellSplit, setSellSplit] = useState(false);
  const [sellMetodo2, setSellMetodo2] = useState('transferencia');
  const [sellMonto2, setSellMonto2] = useState('');

  const [addStockModal, setAddStockModal] = useState(null);
  const [addStockCantidad, setAddStockCantidad] = useState('1');
  const [addStockVariantIdx, setAddStockVariantIdx] = useState('');

  const { user } = useAuth();

  const [lowStock, setLowStock] = useState([]);
  const [lowStockOpen, setLowStockOpen] = useState(false);

  const [expandedId, setExpandedId] = useState(null);

  const agotados = lowStock.filter((i) => i.cantidad === 0);
  const bajos = lowStock.filter((i) => i.cantidad > 0);

  const cartTotal = cart.reduce((s, i) => s + i.precio * i.cantidad, 0);
  const descuentoNum = sellDescuento === '' ? 0 : Number(sellDescuento);
  const finalTotal = cartTotal * (1 - descuentoNum / 100);
  const sellMonto2Num = sellMonto2 === '' ? 0 : Number(sellMonto2);
  const sellMonto1 = sellSplit ? finalTotal - sellMonto2Num : finalTotal;

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const prodRes = await getProducts({ search });
      setProducts(prodRes.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al cargar productos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [search]);

  useEffect(() => {
    getLowStock()
      .then((res) => setLowStock(res.data))
      .catch(() => {});
  }, []);

  const handleSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      if (editing) {
        await updateProduct(editing._id, data);
      } else {
        await createProduct(data);
      }
      setShowForm(false);
      setEditing(null);
      fetchData();
      Swal.fire({ icon: 'success', title: 'Producto guardado', timer: 1500, showConfirmButton: false, background: '#171717', color: '#fff' });
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.message || 'Error al guardar producto', background: '#171717', color: '#fff', confirmButtonColor: '#fff', confirmButtonText: 'OK' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (product) => {
    setEditing(product);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    const confirmed = await Swal.fire({ icon: 'question', title: '¿Eliminar este producto?', text: 'Esta acción no se puede deshacer', showCancelButton: true, confirmButtonText: 'Eliminar', cancelButtonText: 'Cancelar', background: '#171717', color: '#fff', confirmButtonColor: '#ef4444' });
    if (!confirmed.isConfirmed) return;
    try {
      await deleteProduct(id);
      fetchData();
      Swal.fire({ icon: 'success', title: 'Producto eliminado', timer: 1500, showConfirmButton: false, background: '#171717', color: '#fff' });
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'Error al eliminar producto', background: '#171717', color: '#fff', confirmButtonColor: '#fff', confirmButtonText: 'OK' });
    }
  };

  const openQuickAdd = (product) => {
    setQuickAdd(product);
    setQaCantidad('1');
    setQaVariantIdx('');
    setQaPrecio(String(product.precio));
  };

  const confirmQuickAdd = () => {
    const cantidad = Number(qaCantidad);
    if (cantidad < 1) {
      Swal.fire({ icon: 'warning', title: 'Cantidad inválida', background: '#171717', color: '#fff', confirmButtonColor: '#fff', confirmButtonText: 'OK' });
      return;
    }
    if (quickAdd.variants?.length > 0 && qaVariantIdx === '') {
      Swal.fire({ icon: 'warning', title: 'Campo requerido', text: 'Debe seleccionar una variante', background: '#171717', color: '#fff', confirmButtonColor: '#fff', confirmButtonText: 'OK' });
      return;
    }
    const precio = Number(qaPrecio);
    if (precio < 0) {
      Swal.fire({ icon: 'warning', title: 'Precio inválido', background: '#171717', color: '#fff', confirmButtonColor: '#fff', confirmButtonText: 'OK' });
      return;
    }
    const variant = quickAdd.variants[Number(qaVariantIdx)];
    setCart(prev => [...prev, {
      producto: quickAdd._id,
      nombre: quickAdd.nombre,
      precio,
      cantidad,
      talle: variant?.talle || '',
      color: variant?.color || '',
    }]);
    setQuickAdd(null);
    Swal.fire({ icon: 'success', title: 'Agregado al carrito', timer: 1000, showConfirmButton: false, background: '#171717', color: '#fff' });
  };

  const removeFromCart = (idx) => {
    setCart(prev => prev.filter((_, i) => i !== idx));
  };

  const updateCartItem = (idx, field, value) => {
    setCart(prev => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  };

  const openCart = () => {
    if (cart.length === 0) {
      Swal.fire({ icon: 'info', title: 'Carrito vacío', text: 'Agregue productos desde el menú de cada producto', background: '#171717', color: '#fff', confirmButtonColor: '#22c55e', confirmButtonText: 'OK' });
      return;
    }
    setSellEmpleado('');
    setSellDescuento('');
    setSellMetodoPago('efectivo');
    setSellSplit(false);
    setSellMetodo2('transferencia');
    setSellMonto2('');
    setShowCart(true);
  };

  const confirmSale = async () => {
    if (!sellEmpleado.trim()) {
      Swal.fire({ icon: 'warning', title: 'Campo requerido', text: 'Debe ingresar el nombre del empleado', background: '#171717', color: '#fff', confirmButtonColor: '#fff', confirmButtonText: 'OK' });
      return;
    }
    if (sellSplit && Math.abs(sellMonto1 + sellMonto2Num - finalTotal) > 0.01) {
      Swal.fire({ icon: 'warning', title: 'Montos incorrectos', text: 'La suma de los montos debe coincidir con el total', background: '#171717', color: '#fff', confirmButtonColor: '#fff', confirmButtonText: 'OK' });
      return;
    }
    try {
      const pagos = sellSplit
        ? [{ metodo: sellMetodoPago, monto: Math.round(sellMonto1 * 100) / 100 }, { metodo: sellMetodo2, monto: Math.round(sellMonto2Num * 100) / 100 }]
        : [{ metodo: sellMetodoPago, monto: Math.round(finalTotal * 100) / 100 }];
      await createSale({
        items: cart.map(i => ({ producto: i.producto, cantidad: i.cantidad, precio: i.precio, talle: i.talle, color: i.color || '' })),
        empleado: sellEmpleado.trim(),
        pagos,
        descuento: descuentoNum,
      });
      setCart([]);
      setShowCart(false);
      fetchData();
      Swal.fire({ icon: 'success', title: 'Venta registrada', timer: 1500, showConfirmButton: false, background: '#171717', color: '#fff' });
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.message || 'Error al vender', background: '#171717', color: '#fff', confirmButtonColor: '#fff', confirmButtonText: 'OK' });
    }
  };

  const openAddStock = (product) => {
    setAddStockModal(product);
    setAddStockCantidad('1');
    setAddStockVariantIdx('');
  };

  const confirmAddStock = async () => {
    if (addStockModal.variants?.length > 0 && addStockVariantIdx === '') {
      Swal.fire({ icon: 'warning', title: 'Campo requerido', text: 'Debe seleccionar una variante', background: '#171717', color: '#fff', confirmButtonColor: '#fff', confirmButtonText: 'OK' });
      return;
    }
    const variant = addStockModal.variants[Number(addStockVariantIdx)];
    try {
      await addStock(addStockModal._id, { cantidad: Number(addStockCantidad), talle: variant?.talle || '', color: variant?.color || '' });
      setAddStockModal(null);
      fetchData();
      Swal.fire({ icon: 'success', title: 'Stock actualizado', timer: 1500, showConfirmButton: false, background: '#171717', color: '#fff' });
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.message || 'Error al agregar stock', background: '#171717', color: '#fff', confirmButtonColor: '#fff', confirmButtonText: 'OK' });
    }
  };

  const openReturn = (product) => {
    setReturnModal(product);
    setReturnCantidad('1');
    setReturnVariantIdx('');
    setReturnMotivo('');
    setReturnOtroMotivo('');
    setExchangeActivo(false);
    setExchangeSearch('');
    setExchangeTarget(null);
    setExchangeCantidad(1);
    setExchangeVariantIdx('');
  };

  const getReturnMotivo = () => returnMotivo === 'Otro' ? returnOtroMotivo.trim() : returnMotivo.trim();

  const confirmReturn = async () => {
    const motivoFinal = getReturnMotivo();
    if (!motivoFinal) {
      Swal.fire({ icon: 'warning', title: 'Campo requerido', text: 'Debe ingresar un motivo', background: '#171717', color: '#fff', confirmButtonColor: '#fff', confirmButtonText: 'OK' });
      return;
    }
    if (returnModal.variants?.length > 0 && returnVariantIdx === '') {
      Swal.fire({ icon: 'warning', title: 'Campo requerido', text: 'Debe seleccionar la variante a devolver', background: '#171717', color: '#fff', confirmButtonColor: '#fff', confirmButtonText: 'OK' });
      return;
    }
    if (exchangeTarget?.variants?.length > 0 && exchangeVariantIdx === '') {
      Swal.fire({ icon: 'warning', title: 'Campo requerido', text: 'Debe seleccionar la variante del producto nuevo', background: '#171717', color: '#fff', confirmButtonColor: '#fff', confirmButtonText: 'OK' });
      return;
    }
    const retVariant = returnModal.variants?.[Number(returnVariantIdx)];
    const excVariant = exchangeTarget?.variants?.[Number(exchangeVariantIdx)];
    try {
      if (exchangeTarget) {
        await exchangeProduct({
          productoDevolver: returnModal._id,
          cantidadDevolver: Number(returnCantidad),
          talleDevolver: retVariant?.talle || '',
          colorDevolver: retVariant?.color || '',
          productoCargar: exchangeTarget._id,
          cantidadCargar: Number(exchangeCantidad),
          talleCargar: excVariant?.talle || '',
          colorCargar: excVariant?.color || '',
          motivo: motivoFinal,
        });
      } else {
        await createReturn({
          producto: returnModal._id,
          cantidad: Number(returnCantidad),
          talle: retVariant?.talle || '',
          color: retVariant?.color || '',
          motivo: motivoFinal,
        });
      }
      setReturnModal(null);
      fetchData();
      Swal.fire({ icon: 'success', title: exchangeTarget ? 'Cambio registrado' : 'Devolución registrada', timer: 1500, showConfirmButton: false, background: '#171717', color: '#fff' });
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.message || 'Error al registrar', background: '#171717', color: '#fff', confirmButtonColor: '#fff', confirmButtonText: 'OK' });
    }
  };

  const filteredExchange = products.filter(
    (p) =>
      p._id !== returnModal?._id &&
      p.nombre.toLowerCase().includes(exchangeSearch.toLowerCase())
  );

  const openCreate = () => {
    setEditing(null);
    setShowForm(true);
  };

  const renderVariantSelect = (variants, value, onChange, label = 'Variante') => {
    if (!variants?.length) return null;
    return (
      <div className="mb-4">
        <label className="block text-xs text-white/40 font-medium uppercase tracking-wider mb-1.5">{label} <span className="text-red-400">*</span></label>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-2.5 bg-white/[0.07] border border-white/10 rounded-lg text-white focus:outline-none focus:border-white/30 transition-all text-sm"
        >
          <option value="" className="bg-neutral-900">Seleccionar...</option>
          {variants.map((v, i) => (
            <option key={i} value={String(i)} className="bg-neutral-900">{variantLabel(v)}</option>
          ))}
        </select>
      </div>
    );
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Productos</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={openCart}
            className="relative bg-amber-500/20 text-amber-400 border border-amber-500/30 px-4 py-2 rounded-lg transition-all text-sm hover:bg-amber-500/30"
          >
            Carrito
            {cart.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-amber-500 text-black text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                {cart.length}
              </span>
            )}
          </button>
          {user?.rol === 'admin' && (
            <button
              onClick={openCreate}
              className="bg-white/10 hover:bg-white/20 text-white border border-white/10 px-4 py-2 rounded-lg transition-all text-sm"
            >
              + Nuevo Producto
            </button>
          )}
        </div>
      </div>

      <div className="mb-4 flex items-center gap-3 flex-wrap">
        <input
          type="text"
          placeholder="Buscar por nombre o categoria..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full md:w-96 px-4 py-2.5 bg-white/[0.07] border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-white/30 focus:bg-white/[0.10] transition-all text-sm"
        />
        {lowStock.length > 0 && (
          <div className="relative shrink-0">
            <button
              onClick={() => setLowStockOpen(!lowStockOpen)}
              className="flex items-center gap-2 px-3 py-2.5 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400 hover:bg-red-500/20 transition-all"
            >
              <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="text-xs font-medium whitespace-nowrap">
                {bajos.length > 0 && `${bajos.length} bajo`}
                {bajos.length > 0 && agotados.length > 0 && ' · '}
                {agotados.length > 0 && `${agotados.length} agotado${agotados.length > 1 ? 's' : ''}`}
              </span>
            </button>
            {lowStockOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setLowStockOpen(false)} />
                <div className="absolute right-0 top-full mt-2 z-40 w-72 bg-neutral-900 border border-white/10 rounded-xl shadow-2xl shadow-black/40 py-2 animate-fadeIn max-h-64 overflow-y-auto">
                  {bajos.map((item, i) => (
                    <div key={i} className="flex items-center gap-2 px-4 py-1.5 text-xs text-red-300/80">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-400/50 shrink-0" />
                      <span className="font-medium truncate">{item.productoNombre}</span>
                      {item.talle && <span className="shrink-0">· {item.talle}</span>}
                      {item.color && <span className="shrink-0">· {item.color}</span>}
                      <span className="ml-auto shrink-0 text-red-400/60">{item.cantidad} uds.</span>
                    </div>
                  ))}
                  {bajos.length > 0 && agotados.length > 0 && (
                    <div className="h-px bg-red-500/10 my-1 mx-3" />
                  )}
                  {agotados.map((item, i) => (
                    <div key={i} className="flex items-center gap-2 px-4 py-1.5 text-xs text-red-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                      <span className="font-medium truncate">{item.productoNombre}</span>
                      {item.talle && <span className="shrink-0">· {item.talle}</span>}
                      {item.color && <span className="shrink-0">· {item.color}</span>}
                      <span className="ml-auto shrink-0 font-semibold">AGOTADO</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-backdropIn">
          <div className="bg-neutral-900 border border-white/10 rounded-xl shadow-2xl shadow-black/40 p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto animate-modalIn">
            <h2 className="text-xl font-bold text-white mb-4">
              {editing ? 'Editar Producto' : 'Nuevo Producto'}
            </h2>
            <ProductForm
              initial={editing}
              onSubmit={handleSubmit}
              onCancel={() => {
                setShowForm(false);
                setEditing(null);
              }}
              isSubmitting={isSubmitting}
            />
          </div>
        </div>
      )}

      {quickAdd && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-backdropIn">
          <div className="bg-neutral-900 border border-white/10 rounded-xl shadow-2xl shadow-black/40 p-6 w-full max-w-sm mx-4 animate-modalIn">
            <h2 className="text-lg font-bold text-white mb-1">Agregar al Carrito</h2>
            <p className="text-white/50 text-sm mb-4">{quickAdd.nombre}</p>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-white/40 font-medium uppercase tracking-wider mb-1.5">Cantidad</label>
                <input
                  type="text" inputMode="numeric"
                  value={qaCantidad}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v === '' || /^\d+$/.test(v)) setQaCantidad(v);
                  }}
                  className="w-full px-3 py-2 bg-white/[0.07] border border-white/10 rounded-lg text-white focus:outline-none focus:border-white/30 transition-all text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>
              <div>
                <label className="block text-xs text-white/40 font-medium uppercase tracking-wider mb-1.5">Precio unitario</label>
                <input
                  type="text" inputMode="decimal"
                  value={qaPrecio}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v === '' || /^\d*\.?\d{0,2}$/.test(v)) setQaPrecio(v);
                  }}
                  className="w-full px-3 py-2 bg-white/[0.07] border border-white/10 rounded-lg text-white focus:outline-none focus:border-white/30 transition-all text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>
              {renderVariantSelect(quickAdd.variants, qaVariantIdx, setQaVariantIdx)}
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setQuickAdd(null)}
                className="px-4 py-2 text-white/50 border border-white/10 rounded-lg text-sm hover:bg-white/5 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={confirmQuickAdd}
                className="px-4 py-2 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-lg text-sm hover:bg-amber-500/30 transition-all"
              >
                Agregar
              </button>
            </div>
          </div>
        </div>
      )}

      {showCart && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-backdropIn">
          <div className="bg-neutral-900 border border-white/10 rounded-xl shadow-2xl shadow-black/40 p-6 w-full max-w-2xl mx-4 max-h-[95vh] overflow-y-auto animate-modalIn">
            <h2 className="text-xl font-bold text-white mb-4">Carrito ({cart.length} productos)</h2>

            <div className="space-y-2 mb-4">
              {cart.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 bg-white/[0.03] border border-white/5 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{item.nombre}</p>
                    {(item.talle || item.color) && (
                      <p className="text-xs text-white/40 mt-0.5">
                        {item.talle && <span>Talle: {item.talle}</span>}
                        {item.talle && item.color && <span> | </span>}
                        {item.color && <span>Color: {item.color}</span>}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <input
                      type="text" inputMode="numeric"
                      value={item.cantidad}
                      onChange={(e) => {
                        const v = e.target.value;
                        if (v === '' || /^\d+$/.test(v)) updateCartItem(idx, 'cantidad', v === '' ? 1 : Number(v));
                      }}
                      className="w-16 px-2 py-1.5 text-center bg-white/[0.07] border border-white/10 rounded-lg text-white text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <span className="text-white/20">×</span>
                    <input
                      type="text" inputMode="decimal"
                      value={item.precio}
                      onChange={(e) => {
                        const v = e.target.value;
                        if (v === '' || /^\d*\.?\d{0,2}$/.test(v)) updateCartItem(idx, 'precio', v === '' ? 0 : Number(v));
                      }}
                      className="w-24 px-2 py-1.5 text-right bg-white/[0.07] border border-white/10 rounded-lg text-white text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <span className="text-white/30 text-xs font-mono w-20 text-right">
                      ${(item.precio * item.cantidad).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </span>
                    <button
                      onClick={() => removeFromCart(idx)}
                      className="text-red-400 hover:text-red-300 p-1"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-white/10 pt-4 space-y-3 mb-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-white/40 font-medium uppercase tracking-wider mb-1.5">Empleado</label>
                  <input
                    type="text" value={sellEmpleado}
                    onChange={(e) => setSellEmpleado(e.target.value)}
                    placeholder="Nombre"
                    className="w-full px-3 py-2 bg-white/[0.07] border border-white/10 rounded-lg text-white placeholder-white/20 focus:outline-none focus:border-white/30 transition-all text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-white/40 font-medium uppercase tracking-wider mb-1.5">Descuento</label>
                  <input
                    type="text" inputMode="numeric"
                    value={sellDescuento}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (v === '' || /^\d{0,3}$/.test(v)) setSellDescuento(v);
                    }}
                    className="w-full px-3 py-2 bg-white/[0.07] border border-white/10 rounded-lg text-white placeholder-white/20 focus:outline-none focus:border-white/30 transition-all text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    placeholder="%"
                  />
                </div>
              </div>

              <div className="bg-white/[0.03] border border-white/5 rounded-lg p-4 space-y-3">
                <label className="block text-xs text-white/40 font-medium uppercase tracking-wider">Pago</label>
                <div className="flex gap-2">
                  {['efectivo', 'transferencia', 'tarjeta'].map((m) => (
                    <button
                      key={m} type="button"
                      onClick={() => setSellMetodoPago(m)}
                      className={`flex-1 px-3 py-2 text-sm rounded-lg border transition-all ${
                        sellMetodoPago === m
                          ? 'bg-green-500/20 text-green-400 border-green-500/30'
                          : 'bg-white/[0.07] text-white/50 border-white/10 hover:bg-white/[0.10]'
                      }`}
                    >
                      {m === 'efectivo' ? 'Efectivo' : m === 'transferencia' ? 'Transferencia' : 'Tarjeta'}
                    </button>
                  ))}
                </div>
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox" checked={sellSplit}
                      onChange={(e) => { setSellSplit(e.target.checked); setSellMonto2(''); }}
                      className="w-4 h-4 rounded bg-white/[0.07] border-white/10 text-green-400 focus:ring-green-500/30"
                    />
                    <span className="text-sm text-white/50">Dividir pago</span>
                  </label>
                  <span className="text-sm text-white/30">
                    Monto: <span className="text-white font-mono font-medium">${sellMonto1.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                  </span>
                </div>
                {sellSplit && (
                  <div className="space-y-2 pt-3 border-t border-white/5">
                    <div className="flex items-center justify-between px-3 py-2 bg-white/[0.04] rounded-lg">
                      <span className="text-sm font-medium text-green-400">{sellMetodoPago === 'efectivo' ? 'Efectivo' : sellMetodoPago === 'transferencia' ? 'Transferencia' : 'Tarjeta'}</span>
                      <span className="text-sm text-white font-mono">${sellMonto1.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex gap-3 items-center">
                      <select
                        value={sellMetodo2}
                        onChange={(e) => setSellMetodo2(e.target.value)}
                        className="flex-1 px-3 py-2 bg-white/[0.07] border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-white/30"
                      >
                        {['efectivo', 'transferencia', 'tarjeta'].filter((m) => m !== sellMetodoPago).map((m) => (
                          <option key={m} value={m} className="bg-neutral-900">
                            {m === 'efectivo' ? 'Efectivo' : m === 'transferencia' ? 'Transferencia' : 'Tarjeta'}
                          </option>
                        ))}
                      </select>
                      <span className="text-sm text-white/30 font-mono">$</span>
                      <input
                        type="text" inputMode="numeric"
                        value={sellMonto2}
                        onChange={(e) => {
                          const v = e.target.value;
                          if (v === '' || /^\d*\.?\d*$/.test(v)) setSellMonto2(v);
                        }}
                        className="w-28 px-3 py-2 bg-white/[0.07] border border-white/10 rounded-lg text-white text-sm text-right focus:outline-none focus:border-white/30 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-white/10 pt-4">
              <div className="text-sm">
                {descuentoNum > 0 && (
                  <span className="text-green-400/80 mr-3">Desc. {descuentoNum}%</span>
                )}
                <span className="text-white/70 font-semibold">Total: <span className="text-white font-mono text-lg">${finalTotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span></span>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowCart(false)}
                  className="px-4 py-2 text-white/50 border border-white/10 rounded-lg text-sm hover:bg-white/5 transition-all"
                >
                  Seguir comprando
                </button>
                <button
                  onClick={confirmSale}
                  className="px-4 py-2 bg-green-500/20 text-green-400 border border-green-500/30 rounded-lg text-sm hover:bg-green-500/30 transition-all"
                >
                  Confirmar Venta
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {addStockModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-backdropIn">
          <div className="bg-neutral-900 border border-white/10 rounded-xl shadow-2xl shadow-black/40 p-6 w-full max-w-sm mx-4 animate-modalIn">
            <h2 className="text-xl font-bold text-white mb-2">Agregar Stock</h2>
            <p className="text-white/50 text-sm mb-4">
              <span className="text-white font-semibold">{addStockModal.nombre}</span> — Stock actual: {addStockModal.cantidad}
            </p>
            {renderVariantSelect(addStockModal.variants, addStockVariantIdx, setAddStockVariantIdx)}
            <label className="block text-xs text-white/40 font-medium uppercase tracking-wider mb-1.5">
              ¿Cuántas unidades entraron?
            </label>
            <input
              type="text" inputMode="numeric"
              value={addStockCantidad}
              onChange={(e) => {
                const v = e.target.value;
                if (v === '' || /^\d+$/.test(v)) setAddStockCantidad(v);
              }}
              className="w-full px-3 py-2.5 bg-white/[0.07] border border-white/10 rounded-lg text-white placeholder-white/20 focus:outline-none focus:border-white/30 transition-all text-sm mb-6 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setAddStockModal(null)}
                className="px-4 py-2 text-white/50 border border-white/10 rounded-lg text-sm hover:bg-white/5 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={confirmAddStock}
                className="px-4 py-2 bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded-lg text-sm hover:bg-cyan-500/30 transition-all"
              >
                Confirmar Ingreso
              </button>
            </div>
          </div>
        </div>
      )}

      {returnModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-backdropIn">
          <div className="bg-neutral-900 border border-white/10 rounded-xl shadow-2xl shadow-black/40 p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto animate-modalIn">
            <h2 className="text-xl font-bold text-white mb-4">
              Devolución / Cambio
            </h2>
            <p className="text-white/50 text-sm mb-4">
              <span className="text-white font-semibold">{returnModal.nombre}</span> — Stock actual: {returnModal.cantidad}
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs text-white/40 font-medium uppercase tracking-wider mb-1.5">
                  Cantidad a devolver
                </label>
                <input
                  type="text" inputMode="numeric"
                  value={returnCantidad}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v === '' || /^\d+$/.test(v)) setReturnCantidad(v);
                  }}
                  className="w-full px-3 py-2.5 bg-white/[0.07] border border-white/10 rounded-lg text-white placeholder-white/20 focus:outline-none focus:border-white/30 transition-all text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>

              {renderVariantSelect(returnModal.variants, returnVariantIdx, setReturnVariantIdx, 'Variante a devolver')}

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={exchangeActivo}
                  onChange={(e) => {
                    setExchangeActivo(e.target.checked);
                    setExchangeTarget(null);
                    setExchangeSearch('');
                  }}
                  className="w-4 h-4 rounded bg-white/[0.07] border-white/10 text-purple-400 focus:ring-purple-500/30"
                />
                <span className="text-sm text-white/70">Quiero cambiarlo por otro producto</span>
              </label>

              {exchangeActivo && (
                <>
                  <div>
                    <label className="block text-xs text-white/40 font-medium uppercase tracking-wider mb-1.5">
                      Buscar producto nuevo
                    </label>
                    <input
                      type="text"
                      value={exchangeSearch}
                      onChange={(e) => setExchangeSearch(e.target.value)}
                      placeholder="Escribí el nombre..."
                      className="w-full px-3 py-2.5 bg-white/[0.07] border border-white/10 rounded-lg text-white placeholder-white/20 focus:outline-none focus:border-white/30 transition-all text-sm"
                    />
                  </div>

                  {exchangeSearch && filteredExchange.length > 0 && (
                    <div className="border border-white/10 rounded-lg max-h-36 overflow-y-auto bg-neutral-800/50">
                      {filteredExchange.map((p) => (
                        <button
                          key={p._id}
                          onClick={() => {
                            setExchangeTarget(p);
                            setExchangeSearch('');
                            setExchangeCantidad('1');
                            setExchangeVariantIdx('');
                          }}
                          className={`w-full text-left px-3 py-2 text-sm border-b border-white/5 last:border-0 transition-colors ${
                            exchangeTarget?._id === p._id ? 'bg-purple-500/10 text-purple-300 font-semibold' : 'text-white/60 hover:bg-white/5'
                          }`}
                        >
                          {p.nombre} <span className="text-white/30">(stock: {p.cantidad})</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {exchangeTarget && (
                    <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-3">
                      <p className="text-sm text-purple-300 mb-2">
                        <span className="font-semibold">Producto nuevo:</span> {exchangeTarget.nombre}
                        <br />
                        <span className="font-semibold">Stock disponible:</span> {exchangeTarget.cantidad}
                      </p>
                      {renderVariantSelect(exchangeTarget.variants, exchangeVariantIdx, setExchangeVariantIdx, 'Variante a cargar')}
                      <label className="block text-xs text-white/40 font-medium uppercase tracking-wider mb-1.5">
                        Cantidad a cargar
                      </label>
                      <input
                        type="text" inputMode="numeric"
                        value={exchangeCantidad}
                        onChange={(e) => {
                          const v = e.target.value;
                          if (v === '' || /^\d+$/.test(v)) setExchangeCantidad(v);
                        }}
                        className="w-full px-3 py-2.5 bg-white/[0.07] border border-purple-500/20 rounded-lg text-white focus:outline-none focus:border-purple-500/40 transition-all text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    </div>
                  )}
                </>
              )}

              <div>
                <label className="block text-xs text-white/40 font-medium uppercase tracking-wider mb-1.5">
                  Motivo
                </label>
                <select
                  value={returnMotivo}
                  onChange={(e) => setReturnMotivo(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white/[0.07] border border-white/10 rounded-lg text-white focus:outline-none focus:border-white/30 transition-all text-sm"
                >
                  <option value="" className="bg-neutral-900">Seleccionar motivo</option>
                  <option value="Defectuoso" className="bg-neutral-900">Defectuoso</option>
                  <option value="Cambio de talla" className="bg-neutral-900">Cambio de talla</option>
                  <option value="Cambio de modelo" className="bg-neutral-900">Cambio de modelo</option>
                  <option value="Devolución de venta" className="bg-neutral-900">Devolución de venta</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setReturnModal(null)}
                className="px-4 py-2 text-white/50 border border-white/10 rounded-lg text-sm hover:bg-white/5 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={confirmReturn}
                className="px-4 py-2 bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded-lg text-sm hover:bg-orange-500/30 transition-all"
              >
                {exchangeTarget ? 'Confirmar Cambio' : 'Confirmar Devolución'}
              </button>
            </div>
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
        <div className="bg-neutral-900/50 backdrop-blur-xl border border-white/5 rounded-xl overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-white/5">
              <tr>
                <th className="text-left px-4 py-3 text-white/40 font-medium uppercase tracking-wider text-[11px]">Nombre</th>
                <th className="text-left px-4 py-3 text-white/40 font-medium uppercase tracking-wider text-[11px]">Detalle</th>
                <th className="text-left px-4 py-3 text-white/40 font-medium uppercase tracking-wider text-[11px]">Precio</th>
                <th className="text-left px-4 py-3 text-white/40 font-medium uppercase tracking-wider text-[11px]">Total</th>
                <th className="text-left px-4 py-3 text-white/40 font-medium uppercase tracking-wider text-[11px]">Categoría</th>
                <th className="text-left px-4 py-3 text-white/40 font-medium uppercase tracking-wider text-[11px]">Proveedor</th>
                <th className="text-left px-4 py-3 text-white/40 font-medium uppercase tracking-wider text-[11px]">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-white/30">
                    {error || 'No hay productos'}
                  </td>
                </tr>
              ) : (
                products.map((p, i) => (
                  <tr key={p._id} className="border-t border-white/5 even:bg-white/[0.03] hover:bg-white/[0.05] transition-colors animate-rowIn" style={{ animationDelay: `${i * 25}ms` }}>
                    <td className="px-4 py-3 font-medium text-white">{p.nombre}</td>
                    <td
                      className="px-4 py-3 cursor-pointer"
                      onClick={() => setExpandedId(expandedId === p._id ? null : p._id)}
                    >
                      {expandedId === p._id ? (
                        <div className="text-xs leading-relaxed space-y-0.5 animate-slideDown">
                          {p.colores?.length > 0
                            ? p.colores.map((color) => {
                                const vars = p.variants.filter((v) => v.color === color);
                                return (
                                  <div key={color}>
                                    <span className="font-semibold text-white/80">{color}: </span>
                                    {vars.length > 0
                                      ? vars.map((v, i) => (
                                          <span key={i} className="text-white/50">
                                            {v.talle}({v.cantidad}){i < vars.length - 1 ? ' · ' : ''}
                                          </span>
                                        ))
                                      : <span className="text-white/30">—</span>}
                                  </div>
                                );
                              })
                            : p.variants?.length > 0
                              ? p.variants.map((v, i) => (
                                  <span key={i} className="text-white/50">
                                    {variantShortLabel(v)}:{v.cantidad}{i < p.variants.length - 1 ? ', ' : ''}
                                  </span>
                                ))
                              : <span className="text-white/30">—</span>}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-xs">
                          <svg className={`w-3 h-3 text-white/30 transition-transform ${expandedId === p._id ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                          {p.colores?.length > 0 ? (
                            <span className="text-white/50">
                              {p.colores.slice(0, 3).map((c, i) => {
                                const count = p.variants.filter((v) => v.color === c).length;
                                return (
                                  <span key={c}>
                                    {i > 0 && <span className="text-white/20"> · </span>}
                                    <span className="text-white/60">{c}</span>
                                    <span className="text-white/30">(+{count})</span>
                                  </span>
                                );
                              })}
                              {p.colores.length > 3 && <span className="text-white/20 ml-1">· +{p.colores.length - 3} más</span>}
                            </span>
                          ) : p.variants?.length > 0 ? (
                            <span className="text-white/50">{p.variants.length} variantes</span>
                          ) : (
                            <span className="text-white/30">—</span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-white/70">
                      {p.precio != null ? `$${Number(p.precio).toLocaleString('es-AR', { minimumFractionDigits: 2 })}` : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 ${(p.stockMinimo != null && p.cantidad <= p.stockMinimo) ? 'text-red-400 font-semibold' : 'text-white/60'}`}>
                        {(p.stockMinimo != null && p.cantidad <= p.stockMinimo) && (
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        )}
                        {p.cantidad}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-white/50">{p.categoria}</td>
                    <td className="px-4 py-3 text-white/50">{p.proveedor || '—'}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={(e) => {
                          if (dropdown.product?._id === p._id) {
                            setDropdown({ product: null, x: 0, y: 0 });
                          } else {
                            setDropdown({ product: p, ...getDropdownPosition(e.currentTarget) });
                          }
                        }}
                        className="p-2 rounded-lg hover:bg-white/10 text-white/40 transition-colors"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {dropdown.product && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setDropdown({ product: null, x: 0, y: 0 })} />
          <div
            className="fixed z-40 w-40 bg-neutral-900 border border-white/10 rounded-xl shadow-2xl shadow-black/40 py-1.5 animate-fadeIn"
            style={{ left: dropdown.x, top: dropdown.y }}
          >
            <button
              onClick={() => { openQuickAdd(dropdown.product); setDropdown({ product: null, x: 0, y: 0 }); }}
              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-amber-400 hover:bg-white/5 transition-colors"
            >
              Agregar al carrito
            </button>
            {user?.rol === 'admin' && (
              <button
                onClick={() => { openAddStock(dropdown.product); setDropdown({ product: null, x: 0, y: 0 }); }}
                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-cyan-400 hover:bg-white/5 transition-colors"
              >
                 Agregar Stock
              </button>
            )}
            <button
              onClick={() => { openReturn(dropdown.product); setDropdown({ product: null, x: 0, y: 0 }); }}
              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-orange-400 hover:bg-white/5 transition-colors"
            >
              Cambio
            </button>
            {user?.rol === 'admin' && (
              <button
                onClick={() => { handleEdit(dropdown.product); setDropdown({ product: null, x: 0, y: 0 }); }}
                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-blue-400 hover:bg-white/5 transition-colors"
              >
                 Editar
              </button>
            )}
            {user?.rol === 'admin' && (
              <button
                onClick={() => { handleDelete(dropdown.product._id); setDropdown({ product: null, x: 0, y: 0 }); }}
                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-400 hover:bg-white/5 transition-colors"
              >
                 Eliminar
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Products;