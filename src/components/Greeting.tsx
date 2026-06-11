import { useEffect, useState } from 'react';
import { currentPhase, greetingFor } from '~/lib/timeOfDay';

/**
 * Greeting eyebrow that adapts to the visitor's local time of day.
 * Renders a stable fallback during SSR so the markup matches on hydration.
 */
export default function Greeting({ fallback = 'Hello.' }: { fallback?: string }) {
  const [text, setText] = useState(fallback);

  useEffect(() => {
    const update = () => setText(greetingFor(currentPhase()));
    update();
    const id = window.setInterval(update, 5 * 60 * 1000);
    return () => window.clearInterval(id);
  }, []);

  return <>{text}</>;
}
