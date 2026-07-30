import { useState, useEffect } from 'react';

const getGreeting = () => {
  const h = new Date().getHours();
  if (h >= 6 && h < 13) return 'Buen d\u00eda';
  if (h >= 13 && h < 19) return 'Buenas tardes';
  return 'Buenas noches';
};

const Spinner = () => (
  <svg className="w-6 h-6 text-amber-400 animate-spin" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
  </svg>
);

const WelcomeOverlay = () => {
  const [visible, setVisible] = useState(true);
  const [closing, setClosing] = useState(false);
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    const doneTimer = setTimeout(() => setStatus('done'), 2000);
    const closeTimer = setTimeout(() => {
      setClosing(true);
      setTimeout(() => setVisible(false), 200);
    }, 3500);

    return () => {
      clearTimeout(doneTimer);
      clearTimeout(closeTimer);
    };
  }, []);

  const dismiss = () => {
    if (closing || !visible) return;
    setClosing(true);
    setTimeout(() => setVisible(false), 200);
  };

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[100] cursor-pointer"
      style={{ opacity: closing ? 0 : 1, transition: 'opacity 0.2s ease-out' }}
      onClick={dismiss}
    >
      <div
        className="bg-neutral-900 border border-white/10 rounded-xl shadow-2xl shadow-black/40 p-8 w-full max-w-sm mx-4 text-center animate-modalIn"
        style={{ opacity: closing ? 0 : 1, transform: closing ? 'scale(0.95)' : 'scale(1)', transition: 'opacity 0.2s ease-out, transform 0.2s ease-out' }}
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-2xl text-white font-semibold mb-8">
          {getGreeting()}
        </p>

        <div className="flex flex-col items-center gap-3 min-h-[60px]">
          {status === 'loading' ? <Spinner /> : <span className="text-xl text-green-400">&#10003;</span>}
          <p className="text-white/50 text-sm">
            {status === 'loading' ? 'Cargando stock de Bossa Nova\u2026' : 'Listo'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default WelcomeOverlay;
