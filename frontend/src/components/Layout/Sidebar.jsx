import { NavLink } from 'react-router-dom';
import { IconBox, IconChart, IconUsers, IconReturn, IconBell, IconTile } from '../ui/icons';

const links = [
  { to: '/products', label: 'Productos', icon: IconBox, gradient: 'from-sky-500 to-blue-600' },
  { to: '/sales', label: 'Ventas', icon: IconChart, gradient: 'from-emerald-500 to-teal-600' },
  { to: '/suppliers', label: 'Proveedores', icon: IconUsers, gradient: 'from-indigo-500 to-purple-600' },
  { to: '/returns', label: 'Devoluciones', icon: IconReturn, gradient: 'from-orange-500 to-rose-600' },
  { to: '/notifications', label: 'Notificaciones', icon: IconBell, gradient: 'from-cyan-500 to-sky-600' },
];

const Sidebar = () => {
  return (
    <aside className="hidden md:flex w-[260px] bg-ios-surface/70 backdrop-blur-2xl border-r border-ios-separator/40 flex-col shrink-0">
      <div className="px-5 pt-7 pb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-[11px] bg-gradient-to-br from-ios-tint to-blue-600 flex items-center justify-center shadow-[0_4px_14px_rgba(10,132,255,0.4)]">
            <span className="text-white font-bold text-[15px] tracking-tight">BN</span>
          </div>
          <div>
            <h1 className="text-[17px] font-bold text-ios-label tracking-tight">Bossa Nova</h1>
            <p className="text-[11px] text-ios-tertiary font-medium">Stock Manager</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 space-y-0.5">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === '/'}
            className={({ isActive }) =>
              `group flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-all duration-200 ${
                isActive
                  ? 'bg-white/[0.07]'
                  : 'hover:bg-white/[0.04] active:bg-white/[0.08]'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <IconTile
                  gradient={link.gradient}
                  className={`w-8 h-8 transition-all duration-200 ${
                    isActive ? 'opacity-100' : 'opacity-60 group-hover:opacity-90'
                  }`}
                >
                  <link.icon className="w-4 h-4 text-white" strokeWidth={2.1} />
                </IconTile>
                <span
                  className={`text-[15px] transition-colors duration-200 ${
                    isActive
                      ? 'text-ios-label font-semibold'
                      : 'text-ios-secondary group-hover:text-ios-label'
                  }`}
                >
                  {link.label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="p-5">
        <div className="bg-ios-surface2/40 border border-ios-separator/30 rounded-2xl px-4 py-3 text-center">
          <p className="text-[14px] text-ios-tertiary font-medium">Desarrollo By NexusCode</p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;