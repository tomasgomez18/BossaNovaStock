import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { getLowStock } from '../../api/products';

const Layout = () => {
  const [lowStock, setLowStock] = useState([]);
  const [expanded, setExpanded] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    getLowStock()
      .then((res) => setLowStock(res.data))
      .catch(() => {});
  }, []);

  const agotados = lowStock.filter((i) => i.cantidad === 0);
  const bajos = lowStock.filter((i) => i.cantidad > 0);

  return (
    <div className="flex h-screen bg-neutral-950">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Navbar />
        {lowStock.length > 0 && (
          <div className="bg-neutral-900 border-b border-red-500/20 px-6 py-0">
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-2 w-full py-2 text-sm text-red-400 hover:text-red-300 transition-colors"
            >
              <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">Stock bajo</span>
              <span className="text-red-400/60 text-xs">
                {bajos.length > 0 && `${bajos.length} con poco stock`}
                {bajos.length > 0 && agotados.length > 0 && ' | '}
                {agotados.length > 0 && `${agotados.length} agotados`}
              </span>
              <svg
                className={`w-3 h-3 ml-auto text-red-400/60 transition-transform ${expanded ? 'rotate-180' : ''}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {expanded && (
              <div className="pb-3 space-y-1">
                {bajos.map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-red-300/80 pl-7">
                    <span className="w-1 h-1 rounded-full bg-red-400/50 shrink-0" />
                    <span className="font-medium">{item.productoNombre}</span>
                    {item.talle && <span>· {item.talle}</span>}
                    {item.color && <span>· {item.color}</span>}
                    <span className="text-red-400/60">→ {item.cantidad} uds. (mín: {item.stockMinimo})</span>
                  </div>
                ))}
                {bajos.length > 0 && agotados.length > 0 && (
                  <div className="h-px bg-red-500/10 my-1.5 mx-2" />
                )}
                {agotados.map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-red-400 pl-7">
                    <span className="w-1 h-1 rounded-full bg-red-500 shrink-0" />
                    <span className="font-medium">{item.productoNombre}</span>
                    {item.talle && <span>· {item.talle}</span>}
                    {item.color && <span>· {item.color}</span>}
                    <span className="text-red-400 font-semibold">→ AGOTADO</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
