"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer, MeshTransmissionMaterial, Sparkles } from "@react-three/drei";
import type { MotionValue } from "motion/react";

type Pose = { pos: [number, number, number]; scale: number; cam: number; ring: number; ringTilt: number; halo: number };

// One pose per story section (hero, craft, materials, bridal).
const POSES: Pose[] = [
  { pos: [1.35, 0, 0], scale: 1, cam: 6.2, ring: 1, ringTilt: 1.15, halo: 0 },
  { pos: [-1.45, 0.05, 0.6], scale: 1.25, cam: 4.6, ring: 0.85, ringTilt: 0.5, halo: 0 },
  { pos: [1.45, -0.05, 0], scale: 1.05, cam: 5.6, ring: 1.35, ringTilt: 1.5, halo: 0.4 },
  { pos: [0, 0.15, 0], scale: 1.1, cam: 7.4, ring: 1.75, ringTilt: 0.9, halo: 1 },
];

const smooth = (t: number) => t * t * (3 - 2 * t);

function sample(p: number): Pose {
  const n = POSES.length - 1;
  const f = Math.min(Math.max(p, 0), 1) * n;
  const i = Math.min(Math.floor(f), n - 1);
  const t = smooth(f - i);
  const a = POSES[i];
  const b = POSES[i + 1];
  const l = (x: number, y: number) => x + (y - x) * t;
  return {
    pos: [l(a.pos[0], b.pos[0]), l(a.pos[1], b.pos[1]), l(a.pos[2], b.pos[2])],
    scale: l(a.scale, b.scale),
    cam: l(a.cam, b.cam),
    ring: l(a.ring, b.ring),
    ringTilt: l(a.ringTilt, b.ringTilt),
    halo: l(a.halo, b.halo),
  };
}

function useGemGeometry() {
  return useMemo(() => {
    // Brilliant-cut profile revolved into 12 facets, flat shaded.
    const pts = [
      [0, -1.15],
      [0.98, -0.02],
      [1, 0.06],
      [0.6, 0.55],
      [0, 0.55],
    ].map(([x, y]) => new THREE.Vector2(x, y));
    const g = new THREE.LatheGeometry(pts, 12).toNonIndexed();
    g.computeVertexNormals();
    return g;
  }, []);
}

function Scene({ progress, lowPower }: { progress: MotionValue<number>; lowPower: boolean }) {
  const gem = useRef<THREE.Group>(null);
  const rig = useRef<THREE.Group>(null);
  const ring = useRef<THREE.Group>(null);
  const halo = useRef<THREE.Group>(null);
  const geometry = useGemGeometry();
  const { size } = useThree();
  const mobile = size.width < 768;

  useFrame((state, dt) => {
    const p = sample(progress.get());
    const px = mobile ? 0 : p.pos[0];
    const py = mobile ? p.pos[1] + 0.95 : p.pos[1];
    const cam = mobile ? p.cam + 1.6 : p.cam;
    const d = THREE.MathUtils.damp;
    const t = state.clock.elapsedTime;

    if (rig.current) {
      rig.current.position.x = d(rig.current.position.x, px, 4, dt);
      rig.current.position.y = d(rig.current.position.y, py + Math.sin(t * 0.8) * 0.05, 4, dt);
      rig.current.position.z = d(rig.current.position.z, p.pos[2], 4, dt);
      const s = d(rig.current.scale.x, p.scale, 4, dt);
      rig.current.scale.setScalar(s);
      // Damped mouse parallax and tilt
      rig.current.rotation.x = d(rig.current.rotation.x, -state.pointer.y * 0.35, 3, dt);
      rig.current.rotation.z = d(rig.current.rotation.z, -state.pointer.x * 0.12, 3, dt);
    }
    if (gem.current) {
      // Slow idle spin, nudged by the pointer
      gem.current.rotation.y += dt * 0.35;
      gem.current.rotation.y += (state.pointer.x * 0.6 - 0) * dt * 0.2;
    }
    if (ring.current) {
      const target = p.ring;
      ring.current.scale.setScalar(d(ring.current.scale.x, target, 4, dt));
      ring.current.rotation.x = d(ring.current.rotation.x, p.ringTilt, 3, dt);
      ring.current.rotation.y += dt * 0.2;
    }
    if (halo.current) {
      halo.current.scale.setScalar(d(halo.current.scale.x, 0.001 + p.halo * 1.25, 3, dt));
      halo.current.rotation.z += dt * 0.12;
      halo.current.rotation.x = d(halo.current.rotation.x, 1.2 - p.halo * 0.5, 2, dt);
    }
    state.camera.position.z = d(state.camera.position.z, cam, 3, dt);
  });

  return (
    <>
      <ambientLight intensity={0.2} />
      <pointLight position={[4, 5, 5]} intensity={60} color="#ffe2a8" />
      <pointLight position={[-5, -2, 3]} intensity={25} color="#ff5c7c" />
      <Environment resolution={256} frames={1}>
        <Lightformer form="rect" intensity={7} position={[0, 5, -4]} scale={[12, 3, 1]} color="#fff2d0" />
        <Lightformer form="ring" intensity={4} position={[-5, 1, -2]} scale={4} color="#ffd9a0" />
        <Lightformer form="rect" intensity={3} position={[5, -1, -3]} scale={[3, 8, 1]} color="#ff6b8a" />
        <Lightformer form="rect" intensity={2} position={[0, -4, 2]} scale={[10, 1, 1]} color="#ffffff" />
      </Environment>

      <group ref={rig}>
        <group ref={gem}>
          <mesh geometry={geometry} scale={0.95}>
            {lowPower ? (
              <meshPhysicalMaterial color="#a8203f" roughness={0.04} metalness={0.15} clearcoat={1} clearcoatRoughness={0.05} envMapIntensity={2.2} flatShading />
            ) : (
              <MeshTransmissionMaterial
                samples={6}
                resolution={512}
                transmission={1}
                thickness={0.9}
                roughness={0.02}
                ior={1.75}
                chromaticAberration={0.07}
                anisotropicBlur={0.1}
                distortion={0.12}
                distortionScale={0.3}
                temporalDistortion={0.05}
                color="#ffc2cd"
                attenuationColor="#d42550"
                attenuationDistance={1.6}
                flatShading
              />
            )}
          </mesh>
        </group>

        <group ref={ring} rotation={[1.15, 0, 0]}>
          <mesh>
            <torusGeometry args={[1.85, 0.07, 24, 160]} />
            <meshStandardMaterial color="#c9a24b" metalness={1} roughness={0.2} envMapIntensity={1.5} />
          </mesh>
          <mesh rotation={[0, 0, 0]} scale={1.08}>
            <torusGeometry args={[1.85, 0.012, 12, 160]} />
            <meshStandardMaterial color="#f0dba0" metalness={1} roughness={0.1} envMapIntensity={2} />
          </mesh>
        </group>

        <group ref={halo} scale={0.001}>
          {[2.6, 3.1, 3.6].map((r, i) => (
            <mesh key={r} rotation={[i * 0.5, i * 0.7, 0]}>
              <torusGeometry args={[r, 0.028, 16, 140]} />
              <meshStandardMaterial color="#c9a24b" metalness={1} roughness={0.25} envMapIntensity={1.3} />
            </mesh>
          ))}
        </group>
      </group>

      <Sparkles count={lowPower ? 28 : 90} scale={[9, 6, 5]} size={lowPower ? 2.5 : 3.2} speed={0.35} opacity={0.9} color="#e6cf93" />
    </>
  );
}

export default function GemCanvas({
  progress,
  lowPower,
  visible,
}: {
  progress: MotionValue<number>;
  lowPower: boolean;
  visible: boolean;
}) {
  return (
    <Canvas
      dpr={[1, lowPower ? 1 : 2]}
      frameloop={visible ? "always" : "never"}
      camera={{ position: [0, 0, 6.2], fov: 35 }}
      gl={{ antialias: !lowPower, alpha: true, powerPreference: lowPower ? "default" : "high-performance" }}
      aria-hidden
    >
      <Scene progress={progress} lowPower={lowPower} />
    </Canvas>
  );
}
