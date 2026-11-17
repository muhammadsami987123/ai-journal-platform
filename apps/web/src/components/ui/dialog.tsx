"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useCallback, useEffect, useId, useRef } from "react";
import { cn } from "@/lib/utils";
import { scaleIn } from "@/animations/variants";

/**
 * Minimal modal: Escape closes, backdrop closes, focus is restored, and the
 * first focusable child receives focus on open. Focus is kept inside while
 * open because the page behind it is inert to pointer events and Tab is
 * intercepted at both ends.
 */
export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  className
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const restoreRef = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const descriptionId = useId();

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose();
        return;
      }
      if (event.key !== "Tab" || !panelRef.current) return;
      const focusable = panelRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (!open) return;
    restoreRef.current = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const timer = window.setTimeout(() => {
      const first = panelRef.current?.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      first?.focus();
    }, 30);

    return () => {
      window.clearTimeout(timer);
      document.body.style.overflow = previousOverflow;
      restoreRef.current?.focus?.();
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-6">
          <motion.div
            className="absolute inset-0 bg-ink/35 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
          />
          <motion.div
            ref={panelRef}
            variants={scaleIn}
            initial="hidden"
            animate="visible"
            exit="exit"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={description ? descriptionId : undefined}
            onKeyDown={handleKeyDown}
            className={cn(
              "relative z-10 w-full max-w-lg rounded-t-lg border border-border bg-surface shadow-overlay sm:rounded-lg",
              className
            )}
          >
            <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
              <div>
                <h2 id={titleId} className="text-base font-semibold text-ink">
                  {title}
                </h2>
                {description ? (
                  <p id={descriptionId} className="mt-1 text-sm leading-relaxed text-ink-soft">
                    {description}
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-sm p-1.5 text-ink-muted hover:bg-subtle hover:text-ink"
                aria-label="Close dialog"
              >
                <X aria-hidden="true" className="size-4" />
              </button>
            </div>
            {children ? <div className="px-5 py-5">{children}</div> : null}
            {footer ? (
              <div className="flex flex-wrap justify-end gap-2 border-t border-border bg-subtle/50 px-5 py-3.5">
                {footer}
              </div>
            ) : null}
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
