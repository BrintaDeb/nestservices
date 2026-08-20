import React, { useRef, Suspense } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

// Soothing 3D Slideshow Component
function Slideshow() {
  const textures = useTexture([
    "/images/hero-bg.jpg",
    "/images/hero-exterior.jpg",
    "/images/hero-bedroom.jpg",
    "/images/hero-kitchen.jpg"
  ]);

  const materials = useRef([]);
  const planes = useRef([]);
  const { mouse, camera } = useThree();
  
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const duration = 6; // 6 seconds per slide
    const fadeTime = 2; // 2 seconds crossfade
    
    // Soothing mouse parallax sway
    camera.position.x = THREE.MathUtils.lerp(camera.position.x, mouse.x * 0.6, 0.02);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, mouse.y * 0.6, 0.02);
    camera.lookAt(0, 0, 0);

    // Crossfade and Ken Burns slow zoom
    planes.current.forEach((plane, i) => {
      if (!plane) return;
      
      const cycle = textures.length * duration;
      let timeOffset = (t - i * duration) % cycle;
      if (timeOffset < 0) timeOffset += cycle;
      
      let targetOpacity = 0;
      
      if (timeOffset < fadeTime) {
        // Fading in
        targetOpacity = timeOffset / fadeTime;
      } else if (timeOffset < duration) {
        // Fully visible
        targetOpacity = 1;
      } else if (timeOffset < duration + fadeTime) {
        // Fading out
        targetOpacity = 1 - ((timeOffset - duration) / fadeTime);
      }
      
      targetOpacity = Math.max(0, Math.min(1, targetOpacity));
      
      if (materials.current[i]) {
        materials.current[i].opacity = targetOpacity;
      }
      
      // Slow continuous zoom while active
      const zoom = 1 + (timeOffset * 0.015);
      plane.scale.set(18 * zoom, 10.125 * zoom, 1); // 16:9 aspect ratio
    });
  });

  return (
    <group>
      {textures.map((tex, i) => (
        <mesh key={i} ref={(el) => planes.current[i] = el} position={[0, 0, -i * 0.01]}>
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial 
            ref={(el) => materials.current[i] = el} 
            map={tex} 
            transparent 
            opacity={i === 0 ? 1 : 0} 
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
}

export default function HeroParallax() {
  const ref = useRef(null);
  
  // Track scroll progress to fade out the scroll indicator
  const { scrollY } = useScroll();
  const opacity = useTransform(scrollY, [0, 300], [0.8, 0]);

  return (
    <div ref={ref} className="absolute inset-0 w-full h-full z-0 overflow-hidden bg-nest-ink pointer-events-none">
      
      <Canvas 
        camera={{ position: [0, 0, 7], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
        dpr={[1, 2]}
        className="w-full h-full"
      >
        <Suspense fallback={null}>
          <Slideshow />
        </Suspense>
      </Canvas>
      
      {/* Dynamic dark vignette / gradient overlay to ensure text contrast */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-nest-ink/40 to-nest-ink"></div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-black/20 to-black/80"></div>
      
      {/* Scroll indicator overlay */}
      <motion.div style={{ opacity }} className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center justify-center gap-2">
        <span className="text-white/60 font-mono-sm text-[10px] uppercase tracking-widest">Scroll to explore</span>
        <div className="w-[1px] h-12 bg-gradient-to-b from-white/60 to-transparent"></div>
      </motion.div>
    </div>
  );
}
