import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion';
import { useRef, type ReactNode } from 'react';

/**
 * Wraps a section so it fades + scales in as it enters the viewport,
 * and fades + scales out as it leaves (scrolls past the top).
 *
 * Progress: 0 = section bottom hits viewport bottom (just entering)
 *           0.5 = section centered
 *           1 = section top has left the viewport top (gone)
 */
export default function ScrollSection({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  const opacity = useTransform(scrollYProgress, [0, 0.25, 0.75, 1], [0, 1, 1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.25, 0.75, 1], [0.92, 1, 1, 0.94]);
  const y = useTransform(scrollYProgress, [0, 0.25, 0.75, 1], [60, 0, 0, -40]);
  const blur = useTransform(scrollYProgress, [0, 0.25, 0.75, 1], [6, 0, 0, 4]);
  const filter = useTransform(blur, (b) => `blur(${b}px)`);

  if (reduce) {
    return <section ref={ref} className={className}>{children}</section>;
  }

  return (
    <motion.section
      ref={ref}
      className={className}
      style={{ opacity, scale, y, filter, willChange: 'transform, opacity, filter' }}
    >
      {children}
    </motion.section>
  );
}
