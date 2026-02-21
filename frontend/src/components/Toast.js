import React, { useEffect } from "react";

export default function Toast({ message, type = "info", onClose }) {
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => onClose && onClose(), 3000);
    return () => clearTimeout(t);
  }, [message, onClose]);

  if (!message) return null;

  const bg = type === "error" ? "bg-red-500" : type === "success" ? "bg-green-500" : "bg-blue-500";

  return (
    <div className={`fixed right-6 bottom-6 z-50 ${bg} text-white px-4 py-2 rounded shadow-lg transform transition-all`}> 
      {message}
    </div>
  );
}
