import { motion, useScroll, useSpring } from 'framer-motion';

export default function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 30,
    restDelta: 0.001,
  });

  return (
    <motion.div
      style={{ scaleX }}
      className="fixed top-0 left-0 right-0 h-[2px] origin-left z-[60]"
    >
      <div
        className="w-full h-full"
        style={{
          background: 'linear-gradient(90deg, #7c5cff, #22d3ee)',
          boxShadow: '0 0 12px rgba(124,92,255,0.6)',
        }}
      />
    </motion.div>
  );
}
