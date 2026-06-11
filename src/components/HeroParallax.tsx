import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion';
import type { ReactNode } from 'react';

export default function HeroParallax({ children }: { children: ReactNode }) {
  const reduce = useReducedMotion();
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 800], [0, 180]);
  const scale = useTransform(scrollY, [0, 800], [1, 1.18]);
  const opacity = useTransform(scrollY, [0, 600], [1, 0.15]);

  if (reduce) {
    return <div className="absolute inset-0 -z-0">{children}</div>;
  }

  return (
    <motion.div className="absolute inset-0 -z-0" style={{ y, scale, opacity }}>
      {children}
    </motion.div>
  );
}
