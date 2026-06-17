import { type ReactNode } from 'react';

/**
 * ScrollSection — previously wrapped its children in a framer-motion
 * `motion.section` that faded + scaled + blurred the section in and out
 * based on scroll progress. That implementation caused the About section
 * (and Projects / Blog sections) to be invisible on mobile for two reasons:
 *
 *   1. SSR: framer-motion baked `opacity:0; filter:blur(6px);
 *      transform:translateY(60px) scale(0.92)` into the server-rendered
 *      HTML. While the 800KB Three.js bundle (HeroScene) was still
 *      downloading on a slow mobile network, the section was invisible.
 *
 *   2. Scroll math: on mobile, the About section is much taller than the
 *      viewport (photo + 2 paragraphs + buttons stacked). The fade-out
 *      phase (`opacity [0.75, 1] → [1, 0]`) kicked in while the user was
 *      still reading the bottom of the section, making it disappear
 *      mid-read.
 *
 * The fix is to drop the scroll-driven opacity entirely. The section is
 * always visible. A subtle one-shot fade-in is still provided via the
 * `reveal` CSS class so the section feels alive without ever disappearing.
 */
export default function ScrollSection({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`${className ?? ''} reveal reveal--visible`}>
      {children}
    </section>
  );
}
