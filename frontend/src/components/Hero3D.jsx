import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, MeshTransmissionMaterial, Float, Sparkles, Stars, ContactShadows, Text } from '@react-three/drei';
import * as THREE from 'three';

function GlassRings() {
  const outerRing = useRef();
  const innerRing = useRef();

  useFrame((state, delta) => {
    outerRing.current.rotation.x += delta * 0.2;
    outerRing.current.rotation.y += delta * 0.3;
    innerRing.current.rotation.x -= delta * 0.25;
    innerRing.current.rotation.y += delta * 0.15;
  });

  return (
    <group>
      <Float speed={2} rotationIntensity={1} floatIntensity={2}>
        <mesh ref={outerRing}>
          <torusGeometry args={[3, 0.4, 64, 100]} />
          <MeshTransmissionMaterial 
            backside
            samples={4}
            thickness={1.5}
            chromaticAberration={0.4}
            anisotropy={0.3}
            distortion={0.5}
            distortionScale={0.5}
            temporalDistortion={0.1}
            iridescence={1}
            iridescenceIOR={1}
            iridescenceThicknessRange={[0, 1400]}
            clearcoat={1}
            color="#E8E1D3"
          />
        </mesh>
      </Float>
      
      <Float speed={3} rotationIntensity={1.5} floatIntensity={1}>
        <mesh ref={innerRing} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1.8, 0.3, 64, 100]} />
          <MeshTransmissionMaterial 
            backside
            samples={4}
            thickness={1}
            chromaticAberration={0.6}
            anisotropy={0.3}
            distortion={0.8}
            distortionScale={0.8}
            temporalDistortion={0.2}
            iridescence={1}
            iridescenceIOR={1}
            iridescenceThicknessRange={[0, 1400]}
            clearcoat={1}
            color="#B8AFA0"
          />
        </mesh>
      </Float>
    </group>
  );
}

function FloatingShapes() {
  return (
    <>
      <Float speed={1.5} rotationIntensity={2} floatIntensity={3} position={[-4, 2, -2]}>
        <mesh>
          <octahedronGeometry args={[1]} />
          <meshStandardMaterial color="#B76C3D" roughness={0.1} metalness={0.8} />
        </mesh>
      </Float>
      
      <Float speed={2.5} rotationIntensity={1.5} floatIntensity={2} position={[4, -2, -1]}>
        <mesh>
          <icosahedronGeometry args={[0.8]} />
          <meshStandardMaterial color="#1A1A1A" roughness={0.2} metalness={0.9} />
        </mesh>
      </Float>
    </>
  );
}

function Scene() {
  return (
    <>
      <color attach="background" args={['#09090b']} />
      
      <ambientLight intensity={0.5} />
      <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={2} color="#F7F5F0" />
      <pointLight position={[-10, -10, -10]} intensity={1} color="#B76C3D" />

      <GlassRings />
      <FloatingShapes />
      
      <Sparkles count={200} scale={12} size={2} speed={0.4} opacity={0.3} color="#E8E1D3" />
      <Stars radius={50} depth={50} count={2000} factor={4} saturation={0} fade speed={1} />
      
      <Environment preset="city" />
      <ContactShadows position={[0, -4, 0]} opacity={0.4} scale={20} blur={2} far={10} color="#000000" />
    </>
  );
}

export default function Hero3D() {
  return (
    <div className="absolute inset-0 w-full h-full z-0 pointer-events-none">
      <Canvas 
        camera={{ position: [0, 0, 10], fov: 45 }}
        gl={{ antialias: true, alpha: false }}
        dpr={[1, 2]}
      >
        <Scene />
      </Canvas>
      
      {/* Overlay gradient to blend bottom edge with the dark page */}
      <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-nest-ink to-transparent z-10"></div>
    </div>
  );
}
