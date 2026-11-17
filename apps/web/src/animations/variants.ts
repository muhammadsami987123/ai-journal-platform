import type { Transition, Variants } from "framer-motion";

/**
 * One place for motion. Components import these variants; they never write
 * ad-hoc animation objects (UI_UX_GUIDELINES §7). All transforms are removed
 * by the global prefers-reduced-motion rule, opacity changes survive.
 */

export const EASE_OUT = [0.22, 1, 0.36, 1] as const;
export const EASE_IN_OUT = [0.65, 0, 0.35, 1] as const;

export const enterTransition: Transition = { duration: 0.24, ease: EASE_OUT };
export const exitTransition: Transition = { duration: 0.17, ease: EASE_IN_OUT };

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: enterTransition }
};

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: enterTransition }
};

export const fadeUpSmall: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: enterTransition }
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.97 },
  visible: { opacity: 1, scale: 1, transition: enterTransition },
  exit: { opacity: 0, scale: 0.98, transition: exitTransition }
};

export const slideInRight: Variants = {
  hidden: { opacity: 0, x: 24 },
  visible: { opacity: 1, x: 0, transition: enterTransition }
};

export const staggerContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.04 } }
};

export const staggerFast: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.035 } }
};

export const VIEWPORT_ONCE = { once: true, margin: "-80px" } as const;

/** Sticky save indicator: a quiet opacity cross-fade, never a spinner. */
export const saveStateVariants: Variants = {
  initial: { opacity: 0, y: -4 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.18, ease: EASE_OUT } },
  exit: { opacity: 0, y: -4, transition: exitTransition }
};
