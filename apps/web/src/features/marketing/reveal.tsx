"use client";

import { motion } from "framer-motion";
import { fadeUp, VIEWPORT_ONCE } from "@/animations/variants";
import { cn } from "@/lib/utils";

/**
 * Below-the-fold reveal. The hero never waits on JavaScript, so LCP stays on
 * the text block; only these sections animate in as they enter the viewport.
 */
export function Reveal({
  children,
  className,
  delay = 0
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      whileInView="visible"
      viewport={VIEWPORT_ONCE}
      transition={{ delay }}
      className={cn(className)}
    >
      {children}
    </motion.div>
  );
}
