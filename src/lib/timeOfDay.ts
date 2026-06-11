export type Phase = 'morning' | 'afternoon' | 'evening' | 'night';

export type Palette = {
  /** Galaxy core color (inner particles). */
  inside: string;
  /** Galaxy edge color (outer particles). */
  outside: string;
  /** Nebula tint A. */
  nebulaA: string;
  /** Nebula tint B. */
  nebulaB: string;
  /** Scene background color. */
  bg: string;
  /** Star tint multiplier for the dot trails — kept white most phases. */
  trail: string;
};

/** Bucket the local hour into a phase. */
export function phaseForHour(hour: number): Phase {
  if (hour >= 5 && hour < 11) return 'morning';
  if (hour >= 11 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}

export function greetingFor(phase: Phase): string {
  switch (phase) {
    case 'morning':
      return 'Good morning.';
    case 'afternoon':
      return 'Good afternoon.';
    case 'evening':
      return 'Good evening.';
    case 'night':
      return 'Good night.';
  }
}

const palettes: Record<Phase, Palette> = {
  morning: {
    inside: '#fde68a',     // warm gold core
    outside: '#fb7185',    // rose
    nebulaA: '#f59e0b',
    nebulaB: '#ec4899',
    bg: '#1a0a14',
    trail: '#fff5d6',
  },
  afternoon: {
    inside: '#a5f3fc',     // bright cyan core
    outside: '#818cf8',    // indigo
    nebulaA: '#06b6d4',
    nebulaB: '#6366f1',
    bg: '#06121f',
    trail: '#ffffff',
  },
  evening: {
    inside: '#fbcfe8',     // pink core
    outside: '#a855f7',    // violet
    nebulaA: '#ec4899',
    nebulaB: '#f59e0b',
    bg: '#15081a',
    trail: '#ffd8a8',
  },
  night: {
    inside: '#c4b5fd',     // soft violet core
    outside: '#67e8f9',    // bright cyan edge
    nebulaA: '#8b5cf6',
    nebulaB: '#06b6d4',
    bg: '#04040a',
    trail: '#ffffff',
  },
};

export function paletteFor(phase: Phase): Palette {
  return palettes[phase];
}

/** Convenience: read the current phase from the visitor's local time. */
export function currentPhase(date = new Date()): Phase {
  return phaseForHour(date.getHours());
}
