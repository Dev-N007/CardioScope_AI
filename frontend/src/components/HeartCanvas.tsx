import React, { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF, Html } from '@react-three/drei';
import * as THREE from 'three';
import { SelectedVesselId, TargetPredictions } from '../types';
import { RotateCcw, Sparkles, Gem, Heart as HeartIcon, Cpu } from 'lucide-react';

import { getRiskColor, getRiskBadgeStyle } from '../utils/riskUtils';

export type HeartShaderMode = 'glass' | 'bio' | 'cyber';

// Anatomical coordinates aligned with heart.glb bounding box
const VESSEL_DATA = {
  LAD: {
    id: 'LAD' as const,
    name: 'Left Anterior Descending Artery',
    short: 'LAD',
    mainPoints: [
      new THREE.Vector3(0.04, 0.22, 0.20),
      new THREE.Vector3(0.07, 0.15, 0.23),
      new THREE.Vector3(0.08, 0.05, 0.24),
      new THREE.Vector3(0.06, -0.07, 0.23),
      new THREE.Vector3(0.04, -0.20, 0.19),
      new THREE.Vector3(0.02, -0.32, 0.15)
    ],
    branchPoints: [
      new THREE.Vector3(0.08, 0.05, 0.24),
      new THREE.Vector3(0.13, -0.03, 0.20),
      new THREE.Vector3(0.16, -0.12, 0.14)
    ],
    pinPos: new THREE.Vector3(0.08, 0.08, 0.27),
  },
  LCX: {
    id: 'LCX' as const,
    name: 'Left Circumflex Artery',
    short: 'LCX',
    mainPoints: [
      new THREE.Vector3(0.05, 0.21, 0.17),
      new THREE.Vector3(0.12, 0.16, 0.11),
      new THREE.Vector3(0.18, 0.10, 0.02),
      new THREE.Vector3(0.19, 0.02, -0.10),
      new THREE.Vector3(0.14, -0.08, -0.18),
      new THREE.Vector3(0.06, -0.16, -0.21)
    ],
    branchPoints: [
      new THREE.Vector3(0.18, 0.10, 0.02),
      new THREE.Vector3(0.21, -0.02, 0.00),
      new THREE.Vector3(0.19, -0.14, -0.02)
    ],
    pinPos: new THREE.Vector3(0.20, 0.08, 0.05),
  },
  RCA: {
    id: 'RCA' as const,
    name: 'Right Coronary Artery',
    short: 'RCA',
    mainPoints: [
      new THREE.Vector3(-0.04, 0.23, 0.19),
      new THREE.Vector3(-0.11, 0.17, 0.17),
      new THREE.Vector3(-0.16, 0.07, 0.14),
      new THREE.Vector3(-0.18, -0.05, 0.09),
      new THREE.Vector3(-0.16, -0.17, 0.00),
      new THREE.Vector3(-0.09, -0.25, -0.11),
      new THREE.Vector3(-0.02, -0.31, -0.14)
    ],
    branchPoints: [
      new THREE.Vector3(-0.18, -0.05, 0.09),
      new THREE.Vector3(-0.13, -0.13, 0.13),
      new THREE.Vector3(-0.07, -0.21, 0.14)
    ],
    pinPos: new THREE.Vector3(-0.18, 0.06, 0.16),
  }
};

interface VesselMeshProps {
  vesselId: 'LAD' | 'LCX' | 'RCA';
  isSelected: boolean;
  isHovered: boolean;
  anySelected: boolean;
  probability: number;
  onSelect: (id: 'LAD' | 'LCX' | 'RCA') => void;
  onHover: (id: 'LAD' | 'LCX' | 'RCA' | null) => void;
}

function VesselTubeOverlay({
  vesselId,
  isSelected,
  isHovered,
  anySelected,
  probability,
  onSelect,
  onHover,
}: VesselMeshProps) {
  const data = VESSEL_DATA[vesselId];
  const tubeRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const pulseRingRef = useRef<THREE.Mesh>(null);

  const mainCurve = useMemo(() => new THREE.CatmullRomCurve3(data.mainPoints), [data]);
  const branchCurve = useMemo(() => new THREE.CatmullRomCurve3(data.branchPoints), [data]);

  // Radius dimensions:
  // When SELECTED: 0.024 (bold highlight with white core & HUD)
  // When Hovered: 0.015
  // Standard / Unselected: 0.012 (fully solid, colorful, and clearly visible!)
  const mainRadius = isSelected ? 0.024 : (isHovered ? 0.015 : 0.012);
  const branchRadius = isSelected ? 0.016 : (isHovered ? 0.010 : 0.008);
  const glowRadius = isSelected ? 0.046 : (isHovered ? 0.026 : 0.022);

  const mainGeo = useMemo(() => new THREE.TubeGeometry(mainCurve, 45, mainRadius, 16, false), [mainCurve, mainRadius]);
  const innerCoreGeo = useMemo(() => new THREE.TubeGeometry(mainCurve, 45, mainRadius * 0.45, 12, false), [mainCurve, mainRadius]);
  const branchGeo = useMemo(() => new THREE.TubeGeometry(branchCurve, 30, branchRadius, 12, false), [branchCurve, branchRadius]);
  const glowMainGeo = useMemo(() => new THREE.TubeGeometry(mainCurve, 45, glowRadius, 16, false), [mainCurve, glowRadius]);

  const baseColor = useMemo(() => getRiskColor(probability), [probability]);
  const colorObj = useMemo(() => new THREE.Color(baseColor), [baseColor]);
  const whiteObj = useMemo(() => new THREE.Color('#ffffff'), []);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (glowRef.current) {
      const mat = glowRef.current.material as THREE.MeshBasicMaterial;
      if (isSelected) {
        // High-intensity rapid energetic pulse when selected
        mat.opacity = 0.60 + Math.sin(t * 6.0) * 0.30;
      } else {
        const pulseSpeed = probability >= 0.7 ? 4.5 : (probability >= 0.4 ? 3.0 : 2.0);
        mat.opacity = 0.35 + Math.sin(t * pulseSpeed) * 0.15;
      }
    }
    if (pulseRingRef.current && isSelected) {
      const scale = 1.0 + (Math.sin(t * 4.5) + 1.0) * 0.35;
      pulseRingRef.current.scale.set(scale, scale, scale);
      const ringMat = pulseRingRef.current.material as THREE.MeshBasicMaterial;
      ringMat.opacity = Math.max(0.2, 0.9 - (scale - 1.0) * 0.8);
    }
  });

  return (
    <group
      renderOrder={isSelected ? 10 : 6}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(vesselId);
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        onHover(vesselId);
      }}
      onPointerOut={() => onHover(null)}
    >
      {/* Outer luminous radiant halo */}
      <mesh ref={glowRef} geometry={glowMainGeo} renderOrder={isSelected ? 11 : 6}>
        <meshBasicMaterial
          color={colorObj}
          transparent
          opacity={isSelected ? 0.75 : 0.35}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Main coronary artery body (always 100% solid, opaque & colorful) */}
      <mesh ref={tubeRef} geometry={mainGeo} renderOrder={isSelected ? 12 : 7}>
        <meshStandardMaterial
          color={colorObj}
          emissive={colorObj}
          emissiveIntensity={isSelected ? 2.6 : (isHovered ? 0.85 : 0.55)}
          roughness={isSelected ? 0.10 : 0.20}
          metalness={0.7}
          transparent={false}
          opacity={1.0}
        />
      </mesh>

      {/* Inner White-Hot Luminous Core (super visible on any background: glass, bio, or cyber) */}
      {isSelected && (
        <mesh geometry={innerCoreGeo} renderOrder={13}>
          <meshBasicMaterial
            color={whiteObj}
            transparent
            opacity={0.92}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      )}

      {/* Anatomical side branch (always solid & visible) */}
      <mesh geometry={branchGeo} renderOrder={isSelected ? 12 : 7}>
        <meshStandardMaterial
          color={colorObj}
          emissive={colorObj}
          emissiveIntensity={isSelected ? 2.0 : (isHovered ? 0.70 : 0.45)}
          roughness={0.2}
          metalness={0.6}
          transparent={false}
          opacity={1.0}
        />
      </mesh>

      {/* Glowing 3D Origin Indicator Sphere */}
      <mesh position={[data.pinPos.x, data.pinPos.y, data.pinPos.z]} renderOrder={isSelected ? 14 : 8}>
        <sphereGeometry args={[isSelected ? 0.024 : 0.013, 16, 16]} />
        <meshStandardMaterial
          color={isSelected ? whiteObj : colorObj}
          emissive={colorObj}
          emissiveIntensity={isSelected ? 3.0 : 1.0}
          roughness={0.1}
          metalness={0.8}
        />
      </mesh>

      {/* When SELECTED: Animated Target Radar Ring & Floating 3D HUD Callout Badge */}
      {isSelected && (
        <group position={[data.pinPos.x, data.pinPos.y, data.pinPos.z]} renderOrder={15}>
          {/* Target Radar Pulse Ring */}
          <mesh ref={pulseRingRef} rotation={[-Math.PI / 4, 0, 0]}>
            <ringGeometry args={[0.022, 0.038, 32]} />
            <meshBasicMaterial
              color={baseColor}
              side={THREE.DoubleSide}
              transparent
              opacity={0.8}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </mesh>

          {/* Floating 3D Callout Card */}
          <Html position={[0, 0.11, 0]} center distanceFactor={2.2}>
            <div className="pointer-events-none select-none flex flex-col items-center animate-bounce">
              <div
                className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-slate-950/95 border-2 shadow-2xl text-xs text-white backdrop-blur-xl whitespace-nowrap"
                style={{
                  borderColor: baseColor,
                  boxShadow: `0 0 25px ${baseColor}bb, 0 10px 25px rgba(0,0,0,0.9)`,
                }}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full animate-ping"
                  style={{ backgroundColor: baseColor }}
                />
                <span className="font-extrabold tracking-wider">{data.short}</span>
                <span className="text-slate-400 font-bold">|</span>
                <span className="font-black text-white">{(probability * 100).toFixed(0)}%</span>
                <span
                  className="text-[10px] px-1.5 py-0.5 rounded-lg font-black uppercase tracking-wider"
                  style={{ backgroundColor: `${baseColor}33`, color: baseColor }}
                >
                  {probability >= 0.7 ? 'High Stenosis' : (probability >= 0.4 ? 'Moderate' : 'Low Risk')}
                </span>
              </div>
              {/* Pointer stem and glowing focal pin */}
              <div
                className="w-0.5 h-3.5"
                style={{ backgroundColor: baseColor, boxShadow: `0 0 8px ${baseColor}` }}
              />
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: baseColor, boxShadow: `0 0 10px ${baseColor}` }}
              />
            </div>
          </Html>
        </group>
      )}
    </group>
  );
}

// 3D Heart Mesh with Material Modes (Holographic Glass, Bio-Realistic, Cyber X-Ray)
function HeartMeshModel({ shaderMode }: { shaderMode: HeartShaderMode }) {
  const { scene, materials } = useGLTF('/models/heart.glb') as any;

  // 1. Bio-Heart: Authentic anatomical textures (myocardial red, venous blue, lipid sulci) from GLTF
  const bioMaterial = useMemo(() => {
    const rawMat = (materials && Object.values(materials)[0]) as THREE.MeshStandardMaterial | undefined;
    if (rawMat) {
      const cloned = rawMat.clone();
      cloned.roughness = 0.42;
      cloned.metalness = 0.08;
      cloned.wireframe = false;
      // Slight subsurface tissue translucency so the glowing coronary tree stays visible through the heart
      cloned.transparent = true;
      cloned.opacity = 0.88;
      cloned.emissive = new THREE.Color('#1f0808');
      cloned.emissiveIntensity = 0.12;
      return cloned;
    }
    // High-fidelity anatomical fallback if no raw texture is attached
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color('#991b1b'),
      emissive: new THREE.Color('#3b0707'),
      emissiveIntensity: 0.25,
      roughness: 0.40,
      metalness: 0.10,
      transparent: true,
      opacity: 0.88,
    });
  }, [materials]);

  // 2. Glass Hologram: Diagnostic translucent crystal scanner
  const glassMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color('#00f0ff'),
      emissive: new THREE.Color('#0284c7'),
      emissiveIntensity: 0.35,
      roughness: 0.20,
      metalness: 0.80,
      transparent: true,
      opacity: 0.40,
      wireframe: false,
    });
  }, []);

  // 3. Cyber X-Ray: Fluoroscopy & digital angiography wireframe
  const cyberMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color('#818cf8'),
      emissive: new THREE.Color('#6366f1'),
      emissiveIntensity: 0.65,
      roughness: 0.15,
      metalness: 0.85,
      wireframe: true,
      transparent: true,
      opacity: 0.50,
    });
  }, []);

  useEffect(() => {
    scene.traverse((child: THREE.Object3D) => {
      if ((child as THREE.Mesh).isMesh) {
        const m = child as THREE.Mesh;
        m.castShadow = true;
        m.receiveShadow = true;
        m.renderOrder = 0;

        if (shaderMode === 'glass') {
          m.material = glassMaterial;
        } else if (shaderMode === 'cyber') {
          m.material = cyberMaterial;
        } else {
          m.material = bioMaterial;
        }
      }
    });
  }, [scene, shaderMode, glassMaterial, cyberMaterial, bioMaterial]);

  return <primitive object={scene} scale={2.4} position={[0, -0.05, 0]} />;
}

// Smooth Camera Transit Controller for Vessel Auto-Focus
function CameraController({
  targetAngles,
  onFinish,
  controlsRef,
}: {
  targetAngles: { azimuth: number; polar: number } | null;
  onFinish: () => void;
  controlsRef: any;
}) {
  useFrame(() => {
    if (!targetAngles || !controlsRef.current) return;
    const curAzimuth = controlsRef.current.getAzimuthalAngle();
    const curPolar = controlsRef.current.getPolarAngle();

    const newAzimuth = THREE.MathUtils.lerp(curAzimuth, targetAngles.azimuth, 0.12);
    const newPolar = THREE.MathUtils.lerp(curPolar, targetAngles.polar, 0.12);

    controlsRef.current.setAzimuthalAngle(newAzimuth);
    controlsRef.current.setPolarAngle(newPolar);
    controlsRef.current.update();

    if (
      Math.abs(newAzimuth - targetAngles.azimuth) < 0.015 &&
      Math.abs(newPolar - targetAngles.polar) < 0.015
    ) {
      controlsRef.current.setAzimuthalAngle(targetAngles.azimuth);
      controlsRef.current.setPolarAngle(targetAngles.polar);
      controlsRef.current.update();
      onFinish();
    }
  });
  return null;
}

interface HeartCanvasProps {
  predictions?: TargetPredictions;
  selectedVessel: SelectedVesselId;
  onSelectVessel: (id: SelectedVesselId) => void;
}

export const HeartCanvas: React.FC<HeartCanvasProps> = ({
  predictions,
  selectedVessel,
  onSelectVessel,
}) => {
  const [hoveredVessel, setHoveredVessel] = useState<SelectedVesselId>(null);
  const controlsRef = useRef<any>(null);
  const [autoRotate, setAutoRotate] = useState(false);
  const [shaderMode, setShaderMode] = useState<HeartShaderMode>('glass'); // Holographic Glass by default!
  const [targetAngles, setTargetAngles] = useState<{ azimuth: number; polar: number } | null>(null);

  // Sync camera angle whenever selectedVessel changes (via 3D mesh, bottom pills, or sidebar cards)
  useEffect(() => {
    if (selectedVessel === 'LAD') {
      setTargetAngles({ azimuth: 0.10, polar: Math.PI / 2.2 });
    } else if (selectedVessel === 'LCX') {
      setTargetAngles({ azimuth: -1.40, polar: Math.PI / 2.3 });
    } else if (selectedVessel === 'RCA') {
      setTargetAngles({ azimuth: 1.35, polar: Math.PI / 2.2 });
    }
  }, [selectedVessel]);

  const resetCamera = () => {
    setTargetAngles(null);
    if (controlsRef.current) {
      controlsRef.current.reset();
      controlsRef.current.setAzimuthalAngle(0);
      controlsRef.current.setPolarAngle(Math.PI / 2);
      controlsRef.current.update();
    }
    onSelectVessel(null);
  };

  const focusVessel = (vId: 'LAD' | 'LCX' | 'RCA') => {
    onSelectVessel(vId);
    if (vId === 'LAD') {
      setTargetAngles({ azimuth: 0.10, polar: Math.PI / 2.2 });
    } else if (vId === 'LCX') {
      setTargetAngles({ azimuth: -1.40, polar: Math.PI / 2.3 });
    } else if (vId === 'RCA') {
      setTargetAngles({ azimuth: 1.35, polar: Math.PI / 2.2 });
    }
  };

  const ladProb = predictions?.LAD?.probability ?? 0.25;
  const lcxProb = predictions?.LCX?.probability ?? 0.20;
  const rcaProb = predictions?.RCA?.probability ?? 0.22;

  return (
    <div className="relative w-full h-full min-h-[520px] flex flex-col rounded-3xl overflow-hidden glass-panel border border-cyan-500/20 shadow-[0_12px_40px_rgba(0,240,255,0.12)]">
      {/* Top Futuristic Action Bar */}
      <div className="absolute top-4 left-4 right-4 z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Heart Render Mode Switcher */}
        <div className="pointer-events-auto flex items-center p-1 rounded-2xl bg-slate-950/80 backdrop-blur-xl border border-white/10 shadow-lg text-xs">
          <button
            onClick={() => setShaderMode('glass')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
              shaderMode === 'glass'
                ? 'bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 shadow-glow-cyan'
                : 'text-slate-300 hover:text-white'
            }`}
            title="Transparent Holographic Glass Scanner"
          >
            <Gem className="w-3.5 h-3.5" />
            <span>Glass Hologram</span>
          </button>
          <button
            onClick={() => setShaderMode('bio')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
              shaderMode === 'bio'
                ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-[0_0_15px_rgba(244,63,94,0.4)]'
                : 'text-slate-300 hover:text-white'
            }`}
            title="Bio-Realistic Anatomical Tissue"
          >
            <HeartIcon className="w-3.5 h-3.5" />
            <span>Bio-Heart</span>
          </button>
          <button
            onClick={() => setShaderMode('cyber')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
              shaderMode === 'cyber'
                ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]'
                : 'text-slate-300 hover:text-white'
            }`}
            title="Cybernetic X-Ray Mesh"
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Cyber X-Ray</span>
          </button>
        </div>

        {/* Orbit & Reset Controls */}
        <div className="pointer-events-auto flex items-center gap-1.5">
          <button
            onClick={() => setAutoRotate(!autoRotate)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold backdrop-blur-xl border transition-all cursor-pointer ${
              autoRotate
                ? 'bg-cyan-500/25 border-cyan-400 text-cyan-200 shadow-glow-cyan'
                : 'bg-slate-950/80 border-white/10 text-slate-300 hover:border-slate-500'
            }`}
          >
            {autoRotate ? 'Pause Orbit' : 'Auto Orbit'}
          </button>
          <button
            onClick={resetCamera}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950/80 hover:bg-slate-900 text-slate-200 border border-white/10 text-xs font-semibold transition-all cursor-pointer"
            title="Reset Camera View"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* 3D Canvas */}
      <div className="flex-1 w-full h-full cursor-grab active:cursor-grabbing">
        <Canvas
          camera={{ position: [0, 0.08, 1.95], fov: 42 }}
          gl={{ antialias: true, alpha: true }}
          dpr={[1, 2]}
        >
          {/* Luminous Sci-Fi Medical Studio Lighting */}
          <ambientLight intensity={shaderMode === 'glass' ? 1.2 : 0.8} />
          <directionalLight position={[3, 4, 3]} intensity={2.0} color="#e0f2fe" />
          <directionalLight position={[-3, -2, -2]} intensity={1.2} color="#38bdf8" />
          <pointLight position={[0, 2, 2]} intensity={1.5} color="#ffffff" />
          <pointLight position={[0, -2, -1]} intensity={1.0} color="#0284c7" />
          {shaderMode === 'glass' && (
            <pointLight position={[0, 0, 0]} intensity={2.0} color="#00f0ff" />
          )}

          <group position={[0, 0, 0]}>
            <React.Suspense
              fallback={
                <Html center>
                  <div className="flex flex-col items-center gap-2 p-3.5 rounded-2xl bg-slate-900/90 border border-cyan-500/40 text-xs text-cyan-200 shadow-glow-cyan">
                    <div className="w-7 h-7 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                    <span>Rendering 3D Holographic Anatomy...</span>
                  </div>
                </Html>
              }
            >
              <HeartMeshModel shaderMode={shaderMode} />
            </React.Suspense>

            {/* LAD Artery Overlay */}
            <VesselTubeOverlay
              vesselId="LAD"
              isSelected={selectedVessel === 'LAD'}
              isHovered={hoveredVessel === 'LAD'}
              anySelected={Boolean(selectedVessel)}
              probability={ladProb}
              onSelect={focusVessel}
              onHover={setHoveredVessel}
            />

            {/* LCX Artery Overlay */}
            <VesselTubeOverlay
              vesselId="LCX"
              isSelected={selectedVessel === 'LCX'}
              isHovered={hoveredVessel === 'LCX'}
              anySelected={Boolean(selectedVessel)}
              probability={lcxProb}
              onSelect={focusVessel}
              onHover={setHoveredVessel}
            />

            {/* RCA Artery Overlay */}
            <VesselTubeOverlay
              vesselId="RCA"
              isSelected={selectedVessel === 'RCA'}
              isHovered={hoveredVessel === 'RCA'}
              anySelected={Boolean(selectedVessel)}
              probability={rcaProb}
              onSelect={focusVessel}
              onHover={setHoveredVessel}
            />
          </group>

          <CameraController
            targetAngles={targetAngles}
            onFinish={() => setTargetAngles(null)}
            controlsRef={controlsRef}
          />

          <OrbitControls
            ref={controlsRef}
            enablePan={false}
            enableZoom={true}
            minDistance={1.0}
            maxDistance={3.2}
            autoRotate={autoRotate}
            autoRotateSpeed={1.2}
            dampingFactor={0.06}
          />
        </Canvas>
      </div>

      {/* Bottom Floating Vessel Quick-Selector & Cheerful Legend */}
      <div className="absolute bottom-4 left-4 right-4 z-10 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
        {/* Quick Vessel Focus Tabs */}
        <div className="pointer-events-auto flex items-center gap-2 p-1.5 rounded-2xl bg-slate-950/85 backdrop-blur-xl border border-white/10 shadow-2xl">
          <button
            onClick={() => focusVessel('LAD')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedVessel === 'LAD'
                ? 'bg-cyan-400 text-slate-950 shadow-glow-cyan'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            LAD ({(ladProb * 100).toFixed(0)}%)
          </button>
          <button
            onClick={() => focusVessel('LCX')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedVessel === 'LCX'
                ? 'bg-cyan-400 text-slate-950 shadow-glow-cyan'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            LCX ({(lcxProb * 100).toFixed(0)}%)
          </button>
          <button
            onClick={() => focusVessel('RCA')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedVessel === 'RCA'
                ? 'bg-cyan-400 text-slate-950 shadow-glow-cyan'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            RCA ({(rcaProb * 100).toFixed(0)}%)
          </button>
        </div>

        {/* Cheerful Color Legend */}
        <div className="pointer-events-auto flex items-center gap-3.5 px-3.5 py-2 rounded-2xl bg-slate-950/85 backdrop-blur-xl border border-white/10 text-xs text-slate-200 shadow-2xl">
          <span className="text-cyan-300 font-bold uppercase tracking-wider text-[10px]">Stenosis Key:</span>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00f0ff] shadow-[0_0_10px_#00f0ff]" />
            <span className="font-medium">&lt;40% Low</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b] shadow-[0_0_10px_#f59e0b]" />
            <span className="font-medium">40-69% Mod</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ff3366] shadow-[0_0_10px_#ff3366]" />
            <span className="font-medium">&ge;70% High</span>
          </div>
        </div>
      </div>
    </div>
  );
};
