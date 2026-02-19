import React, { useEffect } from 'react';

export default function Modal({ isOpen, onClose, title, subtitle, children, actions }) {
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal>
        <div className="modal-header">
          <h2 className="modal-title">{title}</h2>
          {subtitle && <p className="modal-subtitle">{subtitle}</p>}
        </div>
        {children}
        {actions && <div className="modal-actions">{actions}</div>}
      </div>
    </div>
  );
}
