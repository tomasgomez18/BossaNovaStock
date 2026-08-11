import { useState, useEffect } from 'react';
import {
  getNotifications,
  createNotification,
  updateNotification,
  deleteNotification,
  completeNotification,
  reopenNotification,
} from '../../api/notifications';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ExpandableText from '../../components/common/ExpandableText';
import IosButton from '../../components/ui/IosButton';
import IosModal from '../../components/ui/IosModal';
import { IosField, IosInput, IosTextArea } from '../../components/ui/IosForm';
import { useAuth } from '../../context/AuthContext';
import { useIosAlert } from '../../components/ui/AlertProvider';
import { IconBell, IconPlus, IconPencil, IconTrash, IconCheck, IconRefresh } from '../../components/ui/icons';

const EstadoBadge = ({ estado }) =>
  estado === 'realizado' ? (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-ios-pill bg-ios-green/15 text-ios-green text-[11px] font-semibold">
      <IconCheck className="w-3 h-3" strokeWidth={2.5} />
      Realizado
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-ios-pill bg-ios-orange/15 text-ios-orange text-[11px] font-semibold">
      Pendiente
    </span>
  );

const formatDate = (date) =>
  date
    ? new Date(date).toLocaleDateString('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

const Notifications = () => {
  const { user } = useAuth();
  const { confirm, toast, show: alert } = useIosAlert();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ titulo: '', descripcion: '' });

  const [completeTarget, setCompleteTarget] = useState(null);
  const [comment, setComment] = useState('');

  const isAdmin = user?.rol === 'admin';

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    setError('');
    try {
      const res = await getNotifications();
      setNotifications(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al cargar avisos');
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ titulo: '', descripcion: '' });
    setFormOpen(true);
  };

  const openEdit = (n) => {
    setEditing(n);
    setForm({ titulo: n.titulo, descripcion: n.descripcion });
    setFormOpen(true);
  };

  const handleSave = async () => {
    if (!form.titulo.trim() || !form.descripcion.trim()) return;
    try {
      if (editing) {
        await updateNotification(editing._id, form);
        toast({ message: 'Aviso actualizado' });
      } else {
        await createNotification(form);
        toast({ message: 'Aviso creado' });
      }
      setFormOpen(false);
      fetchNotifications();
    } catch (err) {
      alert({
        icon: 'error',
        title: 'Error',
        message: err.response?.data?.message || 'Error al guardar el aviso',
      });
    }
  };

  const handleDelete = async (n) => {
    const confirmed = await confirm({
      icon: 'warning',
      title: '¿Eliminar este aviso?',
      message: 'Se eliminará para todos los empleados',
      confirmText: 'Eliminar',
      destructive: true,
    });
    if (!confirmed) return;
    try {
      await deleteNotification(n._id);
      fetchNotifications();
      toast({ message: 'Aviso eliminado' });
    } catch (err) {
      alert({
        icon: 'error',
        title: 'Error',
        message: err.response?.data?.message || 'Error al eliminar el aviso',
      });
    }
  };

  const handleComplete = async () => {
    if (!completeTarget) return;
    try {
      await completeNotification(completeTarget._id, { comentario: comment.trim() });
      toast({ message: 'Aviso marcado como realizado' });
      setCompleteTarget(null);
      setComment('');
      fetchNotifications();
    } catch (err) {
      alert({
        icon: 'error',
        title: 'Error',
        message: err.response?.data?.message || 'Error al marcar el aviso',
      });
    }
  };

  const handleReopen = async (n) => {
    const confirmed = await confirm({
      icon: 'warning',
      title: '¿Reabrir este aviso?',
      message: 'Volverá a estado pendiente y se borrará el comentario',
      confirmText: 'Reabrir',
    });
    if (!confirmed) return;
    try {
      await reopenNotification(n._id);
      fetchNotifications();
      toast({ message: 'Aviso reabierto' });
    } catch (err) {
      alert({
        icon: 'error',
        title: 'Error',
        message: err.response?.data?.message || 'Error al reabrir el aviso',
      });
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6 gap-3">
        <h1 className="text-[28px] font-bold text-ios-label tracking-tight">Notificaciones</h1>
        {isAdmin && (
          <IosButton variant="tinted" size="sm" className="shadow-none" onClick={openCreate}>
            <IconPlus className="w-4 h-4" strokeWidth={2.2} />
            Nuevo Aviso
          </IosButton>
        )}
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 bg-ios-red/10 border border-ios-red/25 rounded-ios-control text-ios-red text-sm font-medium">
          {error}
        </div>
      )}

      {notifications.length === 0 ? (
        <div className="bg-ios-surface border border-ios-separator/30 rounded-3xl py-14 flex flex-col items-center shadow-ios-card">
          <div className="w-16 h-16 bg-ios-surface2 rounded-full flex items-center justify-center mb-4 border border-ios-separator/40">
            <IconBell className="w-7 h-7 text-ios-tertiary" strokeWidth={1.5} />
          </div>
          <p className="text-ios-tertiary text-sm">No hay avisos para mostrar</p>
        </div>
      ) : (
        <>
          <div className="hidden md:block bg-ios-surface border border-ios-separator/30 rounded-3xl overflow-hidden shadow-ios-card">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left px-5 py-3.5 text-ios-tertiary font-semibold uppercase tracking-wider text-[11px]">Aviso</th>
                  <th className="text-left px-4 py-3.5 text-ios-tertiary font-semibold uppercase tracking-wider text-[11px]">Estado</th>
                  <th className="text-left px-4 py-3.5 text-ios-tertiary font-semibold uppercase tracking-wider text-[11px]">Creado</th>
                  <th className="text-left px-4 py-3.5 text-ios-tertiary font-semibold uppercase tracking-wider text-[11px]">Realizado</th>
                  <th className="text-right px-5 py-3.5 text-ios-tertiary font-semibold uppercase tracking-wider text-[11px]">Acción</th>
                </tr>
              </thead>
              <tbody>
                {notifications.map((n) => (
                  <tr key={n._id} className="border-t border-ios-separator/30 hover:bg-white/[0.03] transition-colors align-top">
                    <td className="px-5 py-3.5 min-w-[240px]">
                      <p className="font-semibold text-ios-label">{n.titulo}</p>
                      <ExpandableText text={n.descripcion} />
                    </td>
                    <td className="px-4 py-3.5">
                      <EstadoBadge estado={n.estado} />
                    </td>
                    <td className="px-4 py-3.5 text-ios-secondary text-xs">
                      <p className="font-medium text-ios-label text-[13px]">{n.creadoPor?.nombre || '—'}</p>
                      <p className="text-ios-tertiary mt-0.5">{formatDate(n.createdAt)}</p>
                    </td>
                    <td className="px-4 py-3.5 text-ios-secondary text-xs">
                      {n.estado === 'realizado' ? (
                        <>
                          <p className="font-medium text-ios-green text-[13px]">{n.realizadoPor?.nombre || '—'}</p>
                          <p className="text-ios-tertiary mt-0.5">{formatDate(n.realizadoEn)}</p>
                          {n.comentario && <p className="text-ios-secondary mt-1.5 italic">"{n.comentario}"</p>}
                        </>
                      ) : (
                        <span className="text-ios-tertiary">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      {isAdmin ? (
                        <div className="flex items-center justify-end gap-2">
                          {n.estado === 'realizado' && (
                            <button
                              onClick={() => handleReopen(n)}
                              className="text-ios-orange hover:text-ios-orange/80 font-medium text-sm"
                            >
                              Reabrir
                            </button>
                          )}
                          <button
                            onClick={() => openEdit(n)}
                            className="text-ios-tint hover:text-ios-tint/80 font-medium text-sm"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleDelete(n)}
                            className="text-ios-red hover:text-ios-red/80 font-medium text-sm"
                          >
                            Eliminar
                          </button>
                        </div>
                      ) : n.estado === 'pendiente' ? (
                        <button
                          onClick={() => {
                            setComment('');
                            setCompleteTarget(n);
                          }}
                          className="inline-flex items-center gap-1.5 text-ios-green hover:text-ios-green/80 font-semibold text-sm"
                        >
                          <IconCheck className="w-4 h-4" strokeWidth={2.4} />
                          Marcar como realizado
                        </button>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="md:hidden space-y-2.5">
            {notifications.map((n) => (
              <div key={n._id} className="bg-ios-surface border border-ios-separator/30 rounded-3xl p-4 shadow-ios-card">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-ios-label">{n.titulo}</p>
                    <ExpandableText text={n.descripcion} limit={100} />
                  </div>
                  <EstadoBadge estado={n.estado} />
                </div>
                <div className="mt-3 pt-3 border-t border-ios-separator/40 space-y-1.5 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-ios-tertiary text-xs">Creado</span>
                    <span className="text-ios-secondary text-xs">
                      {n.creadoPor?.nombre || '—'} · {formatDate(n.createdAt)}
                    </span>
                  </div>
                  {n.estado === 'realizado' ? (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-ios-tertiary text-xs">Realizado</span>
                        <span className="text-ios-secondary text-xs">
                          {n.realizadoPor?.nombre || '—'} · {formatDate(n.realizadoEn)}
                        </span>
                      </div>
                      {n.comentario && (
                        <p className="text-ios-secondary text-[13px] italic bg-ios-surface2/60 rounded-ios-control px-3 py-2 mt-1">
                          "{n.comentario}"
                        </p>
                      )}
                    </>
                  ) : null}
                </div>
                <div className="mt-3 flex gap-2">
                  {isAdmin ? (
                    <>
                      {n.estado === 'realizado' && (
                        <IosButton variant="gray" size="xs" className="flex-1" onClick={() => handleReopen(n)}>
                          <IconRefresh className="w-3.5 h-3.5" />
                          Reabrir
                        </IosButton>
                      )}
                      <IosButton variant="tinted" size="xs" className="flex-1" onClick={() => openEdit(n)}>
                        <IconPencil className="w-3.5 h-3.5" />
                        Editar
                      </IosButton>
                      <IosButton variant="destructiveTinted" size="xs" className="flex-1" onClick={() => handleDelete(n)}>
                        <IconTrash className="w-3.5 h-3.5" />
                        Eliminar
                      </IosButton>
                    </>
                  ) : n.estado === 'pendiente' ? (
                    <IosButton
                      variant="primary"
                      size="xs"
                      className="flex-1 bg-ios-green/15 text-ios-green shadow-none"
                      onClick={() => {
                        setComment('');
                        setCompleteTarget(n);
                      }}
                    >
                      <IconCheck className="w-3.5 h-3.5" strokeWidth={2.4} />
                      Marcar como realizado
                    </IosButton>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <IosModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? 'Editar Aviso' : 'Nuevo Aviso'}
        confirmText={editing ? 'Guardar' : 'Crear'}
        onConfirm={handleSave}
      >
        <div className="space-y-4">
          <IosField label="Título" required>
            <IosInput
              value={form.titulo}
              onChange={(e) => setForm({ ...form, titulo: e.target.value })}
              placeholder="Ej: Limpiar la tienda"
            />
          </IosField>
          <IosField label="Descripción" required>
            <IosTextArea
              rows={4}
              value={form.descripcion}
              onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
              placeholder="Detalle de la tarea para el empleado…"
            />
          </IosField>
        </div>
      </IosModal>

      <IosModal
        open={!!completeTarget}
        onClose={() => setCompleteTarget(null)}
        title={completeTarget ? `Marcar "${completeTarget.titulo}" como realizado` : ''}
        confirmText="Confirmar"
        onConfirm={handleComplete}
      >
        <IosField label="Comentario (opcional)" hint="Contanos cómo quedó el trabajo">
          <IosTextArea
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Ej: Limpie la tienda y dejé todo en orden…"
          />
        </IosField>
      </IosModal>
    </div>
  );
};

export default Notifications;