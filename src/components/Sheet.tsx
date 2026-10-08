import { AnimatePresence, PresenceContext, motion, useDragControls, type PanInfo } from 'framer-motion';
import { X } from 'lucide-react';
import { useEffect, type ReactNode } from 'react';
import { IconButton } from './ui';

/**
 * Bottom sheet on phones (drag down to dismiss), centred dialog on larger screens.
 */
export function Sheet({ open, onClose, title, children, wide = false }: { open: boolean; onClose: () => void; title?: ReactNode; children: ReactNode; wide?: boolean }) {
  const controls = useDragControls();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.y > 120 || info.velocity.y > 600) onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="sheet"
          className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6"
          initial={{ pointerEvents: 'auto' }}
          animate={{ pointerEvents: 'auto' }}
          // Stop catching taps the instant closing starts, even before the animation ends.
          exit={{ pointerEvents: 'none' }}
        >
          <motion.div
            className="absolute inset-0 bg-black/55 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
          />
          {/* Outer layer owns the slide in/out; inner layer owns drag-to-dismiss, so they never fight. */}
          <motion.div
            className={`relative z-10 w-full ${wide ? 'sm:max-w-2xl' : 'sm:max-w-lg'}`}
            initial={{ y: '100%', opacity: 0.5 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 34, restDelta: 0.5 }}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              className="glass flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-[2rem] shadow-2xl sm:rounded-[2rem]"
              style={{ background: 'rgb(var(--surface) / 0.96)' }}
              drag="y"
              dragListener={false}
              dragControls={controls}
              dragSnapToOrigin
              dragElastic={{ top: 0, bottom: 0.6 }}
              dragMomentum={false}
              onDragEnd={onDragEnd}
            >
              <div className="cursor-grab touch-none px-5 pb-2 pt-3 active:cursor-grabbing" onPointerDown={(e) => controls.start(e)}>
                <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-fg/20 sm:hidden" />
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-xl font-semibold tracking-tight">{title}</h3>
                  <IconButton label="Close" onClick={onClose} className="h-9 w-9">
                    <X size={18} />
                  </IconButton>
                </div>
              </div>
              <div className="scrollbar-none flex-1 overflow-y-auto px-5 pb-6 safe-bottom">
                {/* Detach the content from this sheet's exit bookkeeping: busy content (staggered,
                    layout-animated lists) can otherwise stall AnimatePresence and leave the closed
                    sheet mounted. The content still slides away with the panel. */}
                <PresenceContext.Provider value={null}>{children}</PresenceContext.Provider>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
