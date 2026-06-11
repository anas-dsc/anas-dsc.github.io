import { Canvas, useFrame } from '@react-three/fiber';
import { Stars } from '@react-three/drei';
import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';

// Decide whether the scene should run. Reduced-motion always wins. On mobile /
// coarse-pointer / low-memory devices we still allow the galaxy on the home
// page (where it's the visual centerpiece), but skip it on inner pages so
// navigation stays snappy. Desktop runs everywhere.
type Profile = { run: boolean };
function detectProfile(pathname: string): Profile {
  if (typeof window === 'undefined') return { run: false };
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) return { run: false };
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  const small = window.matchMedia('(max-width: 767px)').matches;
  const lowMem =
    typeof (navigator as unknown as { deviceMemory?: number }).deviceMemory === 'number' &&
    (navigator as unknown as { deviceMemory: number }).deviceMemory <= 4;
  const constrained = coarse || small || lowMem;
  if (constrained) {
    const isHome = pathname === '/' || pathname === '';
    return { run: isHome };
  }
  return { run: true };
}

// Hash a pathname into a stable angle (radians) so every route lands on a
// different "side" of the galaxy automatically — no per-page config needed.
function pathnameAngle(p: string): number {
  let h = 2166136261;
  for (let i = 0; i < p.length; i++) {
    h ^= p.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 36000) / 36000 * Math.PI * 2;
}

// Reactive pathname hook — updates after every Astro view transition so the
// persistent galaxy island can re-orient when the visitor navigates.
function usePathname(): string {
  const [path, setPath] = useState(() =>
    typeof window === 'undefined' ? '/' : window.location.pathname,
  );
  useEffect(() => {
    const update = () => setPath(window.location.pathname);
    document.addEventListener('astro:after-swap', update);
    window.addEventListener('popstate', update);
    return () => {
      document.removeEventListener('astro:after-swap', update);
      window.removeEventListener('popstate', update);
    };
  }, []);
  return path;
}

// Andromeda-inspired palette (locked, independent of time-of-day).
const CORE_GOLD = '#f5d58a';
const ARM_BLUE = '#6aa6ff';
const ARM_VIOLET = '#9b7bff';
const DUST = '#3a1e10';
const BG = '#02020a';

function Galaxy({ count = 8000 }: { count?: number }) {
  const ref = useRef<THREE.Group>(null);

  const { positions, colors } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    const arms = 2;
    const radius = 7.5;
    const spin = 1.6;
    const randomness = 0.45;
    const randomnessPower = 3;

    const inside = new THREE.Color(CORE_GOLD);
    const mid = new THREE.Color('#e8b878');
    const outside = new THREE.Color(ARM_BLUE);
    const tip = new THREE.Color(ARM_VIOLET);
    const dust = new THREE.Color(DUST);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const r = Math.pow(Math.random(), 1.7) * radius;
      const armAngle = ((i % arms) / arms) * Math.PI * 2;
      const spinAngle = r * spin;

      const rx =
        Math.pow(Math.random(), randomnessPower) *
        (Math.random() < 0.5 ? 1 : -1) *
        randomness *
        r;
      const ry =
        Math.pow(Math.random(), randomnessPower) *
        (Math.random() < 0.5 ? 1 : -1) *
        randomness *
        r *
        0.12; // very flat disk
      const rz =
        Math.pow(Math.random(), randomnessPower) *
        (Math.random() < 0.5 ? 1 : -1) *
        randomness *
        r;

      positions[i3] = Math.cos(armAngle + spinAngle) * r + rx;
      positions[i3 + 1] = ry;
      positions[i3 + 2] = Math.sin(armAngle + spinAngle) * r + rz;

      const t = r / radius;
      // gold core -> warm mid -> cool blue -> faint violet at the tips
      let c: THREE.Color;
      if (t < 0.25) c = inside.clone().lerp(mid, t / 0.25);
      else if (t < 0.7) c = mid.clone().lerp(outside, (t - 0.25) / 0.45);
      else c = outside.clone().lerp(tip, (t - 0.7) / 0.3);

      // sprinkle a few dust-lane darker particles in the mid-disk
      if (t > 0.2 && t < 0.65 && Math.random() < 0.08) {
        c = c.clone().lerp(dust, 0.7);
      }

      colors[i3] = c.r;
      colors[i3 + 1] = c.g;
      colors[i3 + 2] = c.b;
    }
    return { positions, colors };
  }, [count]);

  // Per-route base angle so each page views the galaxy from a different side.
  const path = usePathname();
  const targetAngle = useMemo(() => pathnameAngle(path), [path]);

  useEffect(() => {
    if (ref.current) ref.current.rotation.y = targetAngle;
  }, [targetAngle]);

  // Slow majestic rotation (~one revolution per ~4 minutes — perceived as drift).
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.025;
  });

  return (
    <group ref={ref} rotation={[1.05, targetAngle, 0.05]}>
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
          <bufferAttribute attach="attributes-color" args={[colors, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.03}
          sizeAttenuation
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          vertexColors
          transparent
          opacity={1}
        />
      </points>
    </group>
  );
}

// Pulsing additive core glow — a soft sprite at the galactic center.
function CoreGlow() {
  const ref = useRef<THREE.Mesh>(null);
  const tex = useMemo(() => {
    const size = 256;
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const ctx = c.getContext('2d')!;
    const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    g.addColorStop(0, 'rgba(255,235,180,1)');
    g.addColorStop(0.25, 'rgba(245,210,140,0.7)');
    g.addColorStop(0.6, 'rgba(220,160,90,0.15)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, []);

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.getElapsedTime();
    // ~6s gentle breath cycle, 95%–105% scale.
    const s = 1 + Math.sin((t * Math.PI * 2) / 6) * 0.05;
    ref.current.scale.set(s, s, s);
  });

  return (
    <mesh ref={ref} position={[0, 0, 0]}>
      <planeGeometry args={[3.2, 3.2]} />
      <meshBasicMaterial
        map={tex}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

// M32-like satellite: small soft elliptical glow below the main disk.
function Companion() {
  const tex = useMemo(() => {
    const size = 128;
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const ctx = c.getContext('2d')!;
    const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    g.addColorStop(0, 'rgba(255,225,170,0.9)');
    g.addColorStop(0.5, 'rgba(220,170,110,0.25)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, []);

  return (
    <mesh position={[1.3, -2.4, 0.3]} scale={[0.9, 0.7, 1]}>
      <planeGeometry args={[1.4, 1.4]} />
      <meshBasicMaterial
        map={tex}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

// Figure-8 stream: many particles flowing along a 3D lemniscate path.
// Color gradient along the loop: gold near the crossing, blue out on the lobes.
function InfinityStream({ count = 700 }: { count?: number }) {
  const ref = useRef<THREE.Points>(null);

  // Positions and base colors are static — the lemniscate doesn't deform.
  // We rotate the whole group instead of rebuilding XYZ every frame.
  const { positions, colors, baseColors, phases } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const baseColors = new Float32Array(count * 3);
    const phases = new Float32Array(count);
    const gold = new THREE.Color(CORE_GOLD);
    const blue = new THREE.Color(ARM_BLUE);
    const violet = new THREE.Color(ARM_VIOLET);
    const a = 3.6;

    for (let i = 0; i < count; i++) {
      const t = i / count;
      phases[i] = t;
      const phi = t * Math.PI * 2;
      const sinPhi = Math.sin(phi);
      const cosPhi = Math.cos(phi);
      const denom = 1 + sinPhi * sinPhi;
      positions[i * 3] = (a * cosPhi) / denom;
      positions[i * 3 + 1] = sinPhi * 0.35;
      positions[i * 3 + 2] = (a * sinPhi * cosPhi) / denom;

      const nearCross = Math.abs(sinPhi);
      const c = gold.clone().lerp(blue, nearCross);
      c.lerp(violet, nearCross * 0.25);
      baseColors[i * 3] = c.r;
      baseColors[i * 3 + 1] = c.g;
      baseColors[i * 3 + 2] = c.b;
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }
    return { positions, colors, baseColors, phases };
  }, [count]);

  useFrame((state) => {
    if (!ref.current) return;
    const time = state.clock.getElapsedTime();
    const PULSES = 3;
    const flow = (time / 8) % 1;
    const colAttr = ref.current.geometry.getAttribute('color') as THREE.BufferAttribute;
    const colArr = colAttr.array as Float32Array;
    for (let i = 0; i < count; i++) {
      const p = phases[i];
      let minD = 1;
      for (let k = 0; k < PULSES; k++) {
        const head = (flow + k / PULSES) % 1;
        const d = Math.min(Math.abs(p - head), 1 - Math.abs(p - head));
        if (d < minD) minD = d;
      }
      const pulse = Math.exp(-minD * 60) * 2.5 + Math.exp(-minD * 14) * 0.6;
      const k = Math.min(1, 0.25 + pulse);
      const i3 = i * 3;
      colArr[i3] = baseColors[i3] * k;
      colArr[i3 + 1] = baseColors[i3 + 1] * k;
      colArr[i3 + 2] = baseColors[i3 + 2] * k;
    }
    colAttr.needsUpdate = true;

    ref.current.rotation.y = 0.2 + Math.sin(time * 0.15) * 0.5;
    ref.current.rotation.x = 0.45 + Math.sin(time * 0.1) * 0.15;
    ref.current.rotation.z = 0.15;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.045}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        vertexColors
        transparent
        opacity={0.75}
      />
    </points>
  );
}

function CameraDrift() {
  const scrollY = useRef(0);
  const path = usePathname();
  const home = path === '/' || path === '';

  useEffect(() => {
    const onScroll = () => {
      scrollY.current = window.scrollY;
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (home) {
      // Scroll-driven flythrough: dolly toward the core and arc sideways as the
      // visitor scrolls down the homepage. Maxes out around 2200px scrolled.
      const max = 2200;
      const k = Math.min(1, scrollY.current / max);
      const dolly = 8.5 - k * 4.5; // 8.5 → 4.0
      const arc = k * Math.PI * 0.35;
      state.camera.position.x = Math.sin(arc) * (8.5 - dolly + 0.5) + Math.sin(t * 0.05) * 0.18;
      state.camera.position.y = 0.6 + Math.cos(t * 0.04) * 0.08 - k * 0.4;
      state.camera.position.z = Math.cos(arc) * dolly;
    } else {
      // Idle parallax drift on inner pages.
      state.camera.position.x = Math.sin(t * 0.05) * 0.18;
      state.camera.position.y = 0.6 + Math.cos(t * 0.04) * 0.08;
      state.camera.position.z = 8.5;
    }
    state.camera.lookAt(0, 0, 0);
  });
  return null;
}

// Pause the WebGL render loop when the tab is hidden so the canvas doesn't
// burn battery in a background tab. `frameloop` is reactive in r3f.
function useFrameloop(): 'always' | 'never' {
  const [hidden, setHidden] = useState(
    typeof document === 'undefined' ? false : document.hidden,
  );
  useEffect(() => {
    const onVis = () => setHidden(document.hidden);
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);
  return hidden ? 'never' : 'always';
}

export default function HeroScene() {
  const path = usePathname();
  const profile = useMemo(() => detectProfile(path), [path]);
  const frameloop = useFrameloop();
  // Bail out before any Three.js code touches the GPU. On mobile this means
  // the canvas only mounts on the home page; inner pages get the static
  // gradient fallback that Base.astro paints under it.
  if (!profile.run) return null;

  return (
    <Canvas
      camera={{ position: [0, 0.6, 8.5], fov: 50 }}
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      frameloop={frameloop}
    >
      <Suspense fallback={null}>
        <color attach="background" args={[BG]} />
        <fog attach="fog" args={[BG, 10, 22]} />
        <Stars radius={90} depth={60} count={2000} factor={3} fade speed={0.4} />
        <Galaxy count={8000} />
        <CoreGlow />
        <Companion />
        <InfinityStream count={700} />
        <CameraDrift />
      </Suspense>
    </Canvas>
  );
}
