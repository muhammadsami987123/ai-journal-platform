"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Info, X, XCircle } from "lucide-react";
import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { fadeUpSmall } from "@/animations/variants";

type ToastTone = "success" | "error" | "info";

interface ToastItem {
  id: string;
  title: string;
  description?: string;
  tone: ToastTone;
}

interface ToastContextValue {
  toast: (input: { title: string; description?: string; tone?: ToastTone }) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const icons = {
  success: CheckCircle2,
  error: XCircle,
  info: Info
} as const;

const tones: Record<ToastTone, string> = {
  success: "border-success/30",
  error: "border-danger/30",
  info: "border-border"
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setItems((current) => current.filter((item) => item.id !== id));
  }, []);

  const toast = useCallback<ToastContextValue["toast"]>(
    ({ title, description, tone = "info" }) => {
      const id = `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
      setItems((current) => [...current.slice(-2), { id, title, description, tone }]);
      window.setTimeout(() => dismiss(id), 5200);
    },
    [dismiss]
  );

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="pointer-events-none fixed inset-x-0 bottom-20 z-[60] flex flex-col items-center gap-2 px-4 sm:bottom-6 sm:right-6 sm:left-auto sm:items-end"
      >
        <AnimatePresence initial={false}>
          {items.map((item) => {
            const Icon = icons[item.tone];
            return (
              <motion.div
                key={item.id}
                variants={fadeUpSmall}
                initial="hidden"
                animate="visible"
                exit="exit"
                role="status"
                className={cn(
                  "pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-md border bg-surface p-3.5 shadow-overlay",
                  tones[item.tone]
                )}
              >
                <Icon
                  aria-hidden="true"
                  className={cn(
                    "mt-0.5 size-4 shrink-0",
                    item.tone === "success" && "text-success",
                    item.tone === "error" && "text-danger",
                    item.tone === "info" && "text-info"
                  )}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-ink">{item.title}</p>
                  {item.description ? (
                    <p className="mt-0.5 text-xs leading-relaxed text-ink-soft">{item.description}</p>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() => dismiss(item.id)}
                  className="rounded-sm p-1 text-ink-muted hover:bg-subtle hover:text-ink"
                  aria-label="Dismiss notification"
                >
                  <X aria-hidden="true" className="size-3.5" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used inside <ToastProvider>");
  return context;
}
