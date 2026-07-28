import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);

  return (
    <header className="bg-neutral-900/30 backdrop-blur-xl border-b border-white/5 px-6 py-3 flex items-center justify-between z-10">
      <div className="flex items-center gap-3">
        <div className="w-2 h-2 rounded-full " />
      </div>
      {user && (
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/[0.04] transition-all"
          >
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-sm font-medium text-white">
              {user.nombre?.charAt(0).toUpperCase()}
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-sm font-medium text-white">{user.nombre}</p>
              <p className="text-[11px] text-white/40">{user.email}</p>
            </div>
            <svg className={`w-4 h-4 text-white/40 transition-transform ${showDropdown ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showDropdown && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowDropdown(false)} />
              <div className="absolute right-0 top-full mt-2 z-50 w-56 bg-neutral-900 border border-white/10 rounded-xl shadow-2xl shadow-black/40 py-1.5">
                <div className="px-4 py-2 border-b border-white/5">
                  <p className="text-xs text-white/40">Conectado como</p>
                  <p className="text-sm font-medium text-white">{user.email}</p>
                </div>
                <button
                  onClick={logout}
                  className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-400 hover:bg-white/5 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Cerrar Sesión
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </header>
  );
};

export default Navbar;
