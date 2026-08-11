import { useState, useEffect, useRef, useCallback } from 'react';
import { getNotifications } from '../../api/notifications';
import { useAuth } from '../../context/AuthContext';
import { useIosAlert } from '../ui/AlertProvider';
import { IconBell, IconCheck } from '../ui/icons';

const POLL_MS = 30000;
const MAX_AVISOS_EN_MENSAJE = 3;
const MAX_TITULO_LEN = 48;

const recortarTitulo = (titulo) =>
  titulo.length > MAX_TITULO_LEN ? titulo.slice(0, MAX_TITULO_LEN).trimEnd() + '…' : titulo;

const NewNotificationAlert = () => {
  const { user } = useAuth();
  const { show } = useIosAlert();
  const [pendientes, setPendientes] = useState([]);
  const alertadosRef = useRef(new Set());

  const check = useCallback(async () => {
    if (!user) return;
    try {
      const res = await getNotifications();
      const pendientesActuales = res.data.filter((n) => n.estado === 'pendiente');
      setPendientes(pendientesActuales);

      const nuevos = pendientesActuales.filter((n) => !alertadosRef.current.has(n._id));
      if (nuevos.length === 0) return;

      nuevos.forEach((n) => alertadosRef.current.add(n._id));

      const visibles = nuevos.slice(0, MAX_AVISOS_EN_MENSAJE);
      const extras = nuevos.length - visibles.length;
      const listaTitulos = visibles.map((n) => `• ${recortarTitulo(n.titulo)}`).join('\n');

      show({
        icon: 'warning',
        title:
          nuevos.length === 1
            ? 'Nuevo aviso del dueño'
            : `${nuevos.length} avisos nuevos del dueño`,
        message:
          nuevos.length === 1
            ? recortarTitulo(visibles[0].titulo)
            : extras > 0
              ? `Tenés avisos pendientes:\n${listaTitulos}\n• y ${extras} más`
              : `Tenés avisos pendientes:\n${listaTitulos}`,
        buttons: [{ text: 'Cerrar', style: 'cancel' }],
      });
    } catch {
      /* silencioso: si falla la consulta, no interrumpimos */
    }
  }, [user, show]);

  useEffect(() => {
    check();
    const interval = setInterval(check, POLL_MS);
    return () => clearInterval(interval);
  }, [check]);

  if (pendientes.length === 0) return null;

  return (
    <div className="fixed bottom-24 right-4 md:bottom-6 md:right-6 z-[70] max-w-[320px] bg-ios-surface border border-ios-separator/40 rounded-ios-alert shadow-ios-alert p-3.5 flex items-start gap-3 animate-ios-toast pointer-events-none">
      <span className="w-9 h-9 rounded-full bg-ios-orange/15 text-ios-orange flex items-center justify-center shrink-0">
        <IconBell className="w-4 h-4" strokeWidth={2} />
      </span>
      <div className="min-w-0 pt-0.5">
        <p className="text-[13px] font-semibold text-ios-label leading-snug">
          {pendientes.length === 1
            ? '1 aviso pendiente'
            : `${pendientes.length} avisos pendientes`}
        </p>
        <p className="text-[12px] text-ios-secondary mt-0.5 leading-snug">
          Revisá la sección Notificaciones
        </p>
      </div>
      <span className="ml-auto shrink-0 mt-0.5 text-ios-green">
        <IconCheck className="w-4 h-4" strokeWidth={2.5} />
      </span>
    </div>
  );
};

export default NewNotificationAlert;