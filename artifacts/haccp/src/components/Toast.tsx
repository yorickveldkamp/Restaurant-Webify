import { useEffect, useState } from "react";

interface ToastProps { message: string; onDone: () => void; }

export function Toast({ message, onDone }: ToastProps) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (message) {
      setVisible(true);
      const t = setTimeout(() => { setVisible(false); setTimeout(onDone, 300); }, 2200);
      return () => clearTimeout(t);
    }
  }, [message, onDone]);
  return (
    <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#1A1A1A] text-white px-5 py-2.5 text-sm font-['Jost'] tracking-wide shadow-lg transition-opacity duration-300 pointer-events-none ${visible ? "opacity-100" : "opacity-0"}`}>
      {message}
    </div>
  );
}
