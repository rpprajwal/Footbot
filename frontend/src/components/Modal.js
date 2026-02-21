import React, { useEffect, useState } from "react";

export default function Modal({ open, title, children, onClose }) {
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    if (open) {
      setAnimate(true);
    } else {
      setAnimate(false);
    }
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      {/* Background click to close */}
      <div className="absolute inset-0" onClick={onClose}></div>

      {/* Modal Content */}
      <div
        className={`relative w-full max-w-sm glass-panel p-6 shadow-[0_10px_40px_rgba(0,0,0,0.8)] border border-neon-green/30 transform transition-all duration-500 ${animate ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}
      >
        {/* Animated Football Header Icon */}
        <div className="absolute -top-10 left-1/2 transform -translate-x-1/2">
          <div className="w-20 h-20 bg-pitch-dark rounded-full border-4 border-neon-green flex items-center justify-center shadow-[0_0_20px_rgba(0,255,102,0.4)] animate-bounce">
            <span className="text-4xl">⚽</span>
          </div>
        </div>

        <div className="mt-8 flex items-center justify-between mb-6 pb-4 border-b border-white/10">
          <h3 className="text-3xl font-display text-white tracking-widest uppercase drop-shadow-md">{title}</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-red-500/20 text-slate-400 hover:text-red-500 transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="relative z-10">{children}</div>
      </div>
    </div>
  );
}
