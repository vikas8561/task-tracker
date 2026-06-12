import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

export default function Modal({ isOpen, onClose, title, children, footer, size = 'md' }) {
  const backdropRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidths = { sm: '420px', md: '600px', lg: '760px', xl: '960px' };

  return (
    <div
      ref={backdropRef}
      className="modal-backdrop"
      onClick={(e) => { if (e.target === backdropRef.current) onClose(); }}
    >
      <div className="modal" style={{ maxWidth: maxWidths[size] }} role="dialog" aria-modal="true">
        <div className="modal-header">
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, letterSpacing: '-0.01em' }}>{title}</h3>
          <button className="btn btn-ghost btn-icon" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}
