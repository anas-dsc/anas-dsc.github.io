import { type ReactNode } from 'react';

/**
 * Reveal — previously wrapped its children in a framer-motion `motion.div`
 * that started at opacity:0 and animated to opacity:1 on first viewport
 * entry. That caused the hero greeting, name, and tagline to be invisible
 * on mobile until the JS bundle finished downloading (the SSR HTML had
 * `style="opacity:0; transform:translateY(24px)"` baked in).
 *
 * The fix mirrors ScrollSection: render plain markup, apply the `reveal`
 * CSS class which is visible by default. The fade-in animation is now
 * driven entirely by CSS (see global.css), with no JS dependency.
 *
 * The `delay` prop is preserved for backwards compatibility (used by
 * index.astro's hero) and translates to a CSS `transition-delay`.
 */
export default function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <div
      className={`${className ?? ''} reveal reveal--visible`}
      style={delay ? { transitionDelay: `${delay}s` } : undefined}
    >
      {children}
    </div>
  );
}
