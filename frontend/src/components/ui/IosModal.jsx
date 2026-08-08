import { useEffect } from 'react';
import IosButton from './IosButton';

const IosModal = ({
  open,
  onClose,
  title,
  children,
  footer,
  confirmText = 'Confirmar',
  onConfirm,
  confirmVariant = 'primary',
  cancelText = 'Cancelar',
  showCancel = true,
  maxWidth = 'max-w-lg',
}) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80]">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-[3px] animate-ios-fade" onClick={onClose} />

      {/* Mobile: bottom sheet */}
      <div className="md:hidden absolute inset-x-0 bottom-0 flex justify-center">
        <div className="w-full bg-ios-surface/95 backdrop-blur-2xl shadow-ios-sheet rounded-t-[28px] overflow-hidden max-h-[92dvh] flex flex-col animate-ios-sheet-up">
          <div className="flex justify-center pt-2.5 pb-1 shrink-0">
            <div className="w-9 h-[5px] rounded-full bg-ios-surface3" />
          </div>
          {title && (
            <div className="px-5 pt-3 pb-1 shrink-0">
              <h2 className="text-[17px] font-semibold text-ios-label text-center leading-snug">{title}</h2>
            </div>
          )}
          <div className="px-5 pt-3 pb-4 overflow-y-auto flex-1">{children}</div>
          {(footer || onConfirm) && (
            <div className="px-5 pb-6 pt-2 border-t border-ios-separator/50 shrink-0 safe-bottom">
              {(footer || (
                <div className="flex gap-3">
                  {showCancel && (
                    <IosButton variant="gray" onClick={onClose} className="flex-1 py-3">
                      {cancelText}
                    </IosButton>
                  )}
                  <IosButton variant={confirmVariant} onClick={onConfirm} className="flex-1 py-3">
                    {confirmText}
                  </IosButton>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Desktop centered modal */}
      <div className="hidden md:flex absolute inset-0 items-center justify-center p-6">
        <div className={`w-full ${maxWidth} bg-ios-surface rounded-ios-alert shadow-ios-alert overflow-hidden animate-ios-centered max-h-[90vh] flex flex-col border border-white/[0.07]`}>
          {title && (
            <div className="px-6 pt-5 pb-1 shrink-0">
              <h2 className="text-[17px] font-semibold text-ios-label leading-snug">{title}</h2>
            </div>
          )}
          <div className="px-6 pt-3 pb-4 overflow-y-auto flex-1">{children}</div>
          {(footer || onConfirm) && (
            <div className="px-6 py-4 border-t border-ios-separator/50 shrink-0">
              {(footer || (
                <div className="flex gap-3">
                  {showCancel && (
                    <IosButton variant="gray" onClick={onClose} className="flex-1 py-3">
                      {cancelText}
                    </IosButton>
                  )}
                  <IosButton variant={confirmVariant} onClick={onConfirm} className="flex-1 py-3">
                    {confirmText}
                  </IosButton>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default IosModal;