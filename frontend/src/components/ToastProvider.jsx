import { useCallback, useEffect, useRef, useState } from "react";
import { ToastContext } from "./toast";
let idCounter = 0;
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef({});
  const host = useRef(null);
  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
    clearTimeout(timers.current[id]);
    delete timers.current[id];
  }, []);
  const notify = useCallback(
    (message, { variant = "info", duration = 4200 } = {}) => {
      const id = idCounter++;
      setToasts((current) => [...current.slice(-3), { id, message, variant }]);
      timers.current[id] = setTimeout(() => dismiss(id), duration);
      return id;
    },
    [dismiss],
  );
  useEffect(() => {
    // Native popovers keep feedback visible above open modal dialogs.
    if (toasts.length) {
      host.current?.hidePopover?.();
      host.current?.showPopover?.();
    } else host.current?.hidePopover?.();
  }, [toasts]);
  useEffect(() => {
    const pending = timers.current;
    return () => Object.values(pending).forEach(clearTimeout);
  }, []);
  return (
    <ToastContext.Provider value={notify}>
      {children}
      <div
        ref={host}
        className="toast-stack"
        popover="manual"
        role="status"
        aria-live="polite"
      >
        {toasts.map((toast) => (
          <div key={toast.id} className={"toast toast--" + toast.variant}>
            <span>{toast.message}</span>
            <button
              className="toast__close"
              onClick={() => dismiss(toast.id)}
              aria-label="Dismiss"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
