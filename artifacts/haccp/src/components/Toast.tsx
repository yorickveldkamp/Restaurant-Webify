import { useEffect, useState } from "react";

interface ToastProps {
  message: string;
  onDone: () => void;
}

export function Toast({ message, onDone }: ToastProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (message) {
      setVisible(true);
      const t = setTimeout(() => {
        setVisible(false);
        setTimeout(onDone, 300);
      }, 2200);
      return () => clearTimeout(t);
    }
  }, [message, onDone]);

  return (
    <div
      className={`fixed bottom-5 right-5 z-50 bg-gray-900 text-white px-4 py-2.5 rounded-lg text-sm shadow-lg transition-opacity duration-300 pointer-events-none ${
        visible ? "opacity-100" : "opacity-0"
      }`}
    >
      {message}
    </div>
  );
}
