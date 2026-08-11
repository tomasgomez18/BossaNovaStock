import { useState, useEffect } from 'react';
import IosButton from '../ui/IosButton';
import { IconTile, IconBox, IconChart, IconReturn, IconBell, IconUsers, IconList } from '../ui/icons';
import { useAuth } from '../../context/AuthContext';

const DAYS_3 = 3 * 24 * 60 * 60 * 1000;
const KEY_PREFIX = 'bn_guide_';

const contenido = {
  admin: [
    {
      key: 'inicio',
      icon: IconList,
      gradient: 'from-sky-500 to-blue-600',
      title: 'Tu rol: Administrador',
      desc: 'Sos el dueño de la tienda. Tenés acceso total al sistema para administrar todo.',
    },
    {
      key: 'productos',
      icon: IconBox,
      gradient: 'from-sky-500 to-blue-600',
      title: 'Productos',
      desc: 'Crear, editar y eliminar productos, controlar el stock y ver los que están bajos.',
    },
    {
      key: 'ventas',
      icon: IconChart,
      gradient: 'from-emerald-500 to-teal-600',
      title: 'Ventas',
      desc: 'Ver estadísticas, historial de ventas y cierres de caja.',
    },
    {
      key: 'proveedores',
      icon: IconUsers,
      gradient: 'from-indigo-500 to-purple-600',
      title: 'Proveedores',
      desc: 'Gestionar la lista de proveedores de la tienda.',
    },
    {
      key: 'devoluciones',
      icon: IconReturn,
      gradient: 'from-orange-500 to-rose-600',
      title: 'Devoluciones',
      desc: 'Ver el historial de devoluciones y cambios realizados.',
    },
    {
      key: 'notificaciones',
      icon: IconBell,
      gradient: 'from-cyan-500 to-sky-600',
      title: 'Notificaciones',
      desc: 'Crear avisos para tus empleados (tareas, pagos, limpieza…). Podés editarlos, reabrirlos o eliminarlos. Ellos los leen y los marcan como realizados con un comentario.',
    },
  ],
  empleado: [
    {
      key: 'inicio',
      icon: IconList,
      gradient: 'from-sky-500 to-blue-600',
      title: 'Tu rol: Empleado',
      desc: 'Este sistema es para que la tienda funcione en equipo con el dueño. Esto es lo que vas a poder hacer:',
    },
    {
      key: 'productos',
      icon: IconBox,
      gradient: 'from-sky-500 to-blue-600',
      title: 'Productos',
      desc: 'Ves todo el stock de la tienda. Tocá un producto para venderlo o hacer un cambio.',
    },
    {
      key: 'ventas',
      icon: IconChart,
      gradient: 'from-emerald-500 to-teal-600',
      title: 'Ventas',
      desc: 'Historial de las ventas del día y cierres de caja.',
    },
    {
      key: 'devoluciones',
      icon: IconReturn,
      gradient: 'from-orange-500 to-rose-600',
      title: 'Devoluciones',
      desc: 'Historial de las devoluciones o cambios que se registran.',
    },
    {
      key: 'notificaciones',
      icon: IconBell,
      gradient: 'from-cyan-500 to-sky-600',
      title: 'Notificaciones',
      desc: 'Acá aparecen los avisos del dueño: tareas como limpiar la tienda, pagos pendientes, etc. Leelos, marcá cada aviso como realizado y dejá un comentario cuando lo hagas.',
    },
  ],
};

const RoleGuideOverlay = () => {
  const { user } = useAuth();
  const [visible, setVisible] = useState(false);

  const rol = user?.rol === 'admin' ? 'admin' : 'empleado';
  const items = contenido[rol];

  useEffect(() => {
    if (!user) return;
    const key = KEY_PREFIX + rol;
    const stored = localStorage.getItem(key);
    if (stored) {
      const date = Number(stored);
      if (!isNaN(date) && Date.now() - date < DAYS_3) {
        setVisible(true);
      } else {
        localStorage.removeItem(key);
      }
    } else {
      localStorage.setItem(key, String(Date.now()));
      setVisible(true);
    }
  }, [user, rol]);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-2xl flex items-center justify-center z-[100] px-4 py-6"
      onClick={() => setVisible(false)}
    >
      <div
        className="bg-ios-surface/95 border border-white/[0.07] rounded-[28px] shadow-ios-alert w-full max-w-md flex flex-col max-h-[86dvh] animate-ios-centered overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="pt-6 px-6 pb-2 shrink-0">
          <div className="flex items-center gap-3 mb-3">
            <IconTile gradient="from-cyan-500 to-sky-600" className="w-11 h-11">
              <IconBell className="w-5 h-5 text-white" strokeWidth={2} />
            </IconTile>
            <div>
              <h2 className="text-[19px] font-bold text-ios-label tracking-tight leading-tight">
                Bienvenido a Bossa Nova
              </h2>
              <p className="text-[13px] text-ios-tertiary font-medium">
                {rol === 'admin'
                  ? 'Guía rápida de tu panel de administrador'
                  : 'Guía rápida de tu panel de empleado'}
              </p>
            </div>
          </div>
        </div>

        <div className="px-4 pb-4 overflow-y-auto flex-1 space-y-1">
          {items.map((item) => (
            <div
              key={item.key}
              className="flex gap-3 p-3 rounded-2xl bg-ios-surface2/40 border border-transparent active:bg-white/5 transition-colors"
            >
              <IconTile gradient={item.gradient} className="w-9 h-9 shrink-0 mt-0.5">
                <item.icon className="w-4 h-4 text-white" strokeWidth={2} />
              </IconTile>
              <div className="min-w-0">
                <p className="text-[14px] font-semibold text-ios-label">{item.title}</p>
                <p className="text-[13px] leading-relaxed text-ios-secondary mt-0.5">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="px-6 pb-6 pt-2 shrink-0">
          <IosButton
            variant="primary"
            size="lg"
            className="w-full"
            onClick={() => setVisible(false)}
          >
            Entendido
          </IosButton>
          <p className="text-center text-[11px] text-ios-tertiary mt-3">
            Esta guía estará disponible por 3 días desde tu primer ingreso y luego desaparecerá.
          </p>
        </div>
      </div>
    </div>
  );
};

export default RoleGuideOverlay;