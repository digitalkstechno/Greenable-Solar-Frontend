'use client';

import { useEffect, useRef } from 'react';
import { FiX } from 'react-icons/fi';

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export default function Dialog({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'lg',
}: DialogProps) {
  const sizeClasses = {
    sm: 'md:w-1/4 md:max-w-[25vw]',
    md: 'md:w-1/3 md:max-w-[40vw]',
    lg: 'md:w-1/2 md:max-w-[50vw]',
    xl: 'md:w-2/3 md:max-w-[75vw]',
  };
  
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && dialogRef.current) {
      const timer = setTimeout(() => {
        const inputs = Array.from(dialogRef.current?.querySelectorAll(
          'input:not([disabled]):not([type="hidden"]):not([readonly]), textarea:not([disabled]):not([readonly]), select:not([disabled])'
        ) || []) as HTMLElement[];
        
        const firstVisibleInput = inputs.find(
          el => el.offsetWidth > 0 || el.offsetHeight > 0 || el.getClientRects().length > 0
        );

        if (firstVisibleInput) {
          firstVisibleInput.focus();
          if (firstVisibleInput instanceof HTMLInputElement && (firstVisibleInput.type === 'text' || firstVisibleInput.type === 'search')) {
            firstVisibleInput.select();
          }
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  return (
    <div
      className={`fixed inset-0 z-50 flex justify-end ${
        isOpen ? 'pointer-events-auto' : 'pointer-events-none'
      }`}
    >
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
      />

      {/* Sliding Dialog */}
      <div
        ref={dialogRef}
        className={`
          relative h-full w-full ${sizeClasses[size]} bg-white flex flex-col
          transform transition-transform duration-300
          ${isOpen ? 'translate-x-0 shadow-2xl' : 'translate-x-full shadow-none'}
        `}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between bg-secondary px-6 py-4">
          <h2 className="text-lg font-bold text-white">{title}</h2>

          <button
            onClick={onClose}
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-white transition-colors hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/50"
            aria-label="Close"
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}



interface CenterDialogProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export function CenterDialog({
  isOpen,
  onClose,
  children,
}: CenterDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && dialogRef.current) {
      const timer = setTimeout(() => {
        const inputs = Array.from(dialogRef.current?.querySelectorAll(
          'input:not([disabled]):not([type="hidden"]):not([readonly]), textarea:not([disabled]):not([readonly]), select:not([disabled])'
        ) || []) as HTMLElement[];
        
        const firstVisibleInput = inputs.find(
          el => el.offsetWidth > 0 || el.offsetHeight > 0 || el.getClientRects().length > 0
        );

        if (firstVisibleInput) {
          firstVisibleInput.focus();
          if (firstVisibleInput instanceof HTMLInputElement && (firstVisibleInput.type === 'text' || firstVisibleInput.type === 'search')) {
            firstVisibleInput.select();
          }
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center ${
        isOpen ? 'pointer-events-auto' : 'pointer-events-none'
      }`}
    >
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
      />

      {/* Center Modal */}
      <div
        ref={dialogRef}
        className={`relative bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 transform transition-all duration-300
          ${isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}
        `}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Content Only */}
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
}