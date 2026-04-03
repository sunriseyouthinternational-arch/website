import React, { useEffect } from 'react';

function Modal({ isOpen, onClose, children, size = 'default' }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeClasses = {
    default: 'max-w-4xl',
    large: 'max-w-6xl',
    full: 'max-w-full',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className={`relative bg-surface-container-lowest rounded-xl shadow-ambient-lg max-h-[85vh] overflow-y-auto w-full ${sizeClasses[size]} mb-20`}>
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 bg-surface-container-low hover:bg-surface-container rounded-full p-2 transition-colors"
        >
          <span className="material-symbols-outlined text-on-surface">close</span>
        </button>

        {/* Content */}
        <div className="p-6 md:p-8">
          {children}
        </div>
      </div>
    </div>
  );
}

export default Modal;
