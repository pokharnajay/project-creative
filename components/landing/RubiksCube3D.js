'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Float, RoundedBox } from '@react-three/drei';
import { useRef, useState } from 'react';
import * as THREE from 'three';

// Rubik's cube colors
const COLORS = {
  front: '#ffffff',  // White
  back: '#ffff00',   // Yellow
  top: '#00ff00',    // Green
  bottom: '#0000ff', // Blue
  left: '#ff6b00',   // Orange
  right: '#ff0000',  // Red
};

function Cubie({ position, colors }) {
  const meshRef = useRef();
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (hovered) {
      meshRef.current.scale.lerp(new THREE.Vector3(1.1, 1.1, 1.1), 0.1);
    } else {
      meshRef.current.scale.lerp(new THREE.Vector3(1, 1, 1), 0.1);
    }
  });

  return (
    <RoundedBox
      ref={meshRef}
      args={[0.95, 0.95, 0.95]}
      radius={0.05}
      smoothness={4}
      position={position}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      {colors.map((color, index) => (
        <meshStandardMaterial
          key={index}
          attach={`material-${index}`}
          color={color || '#1f2937'}
          metalness={0.3}
          roughness={0.4}
        />
      ))}
    </RoundedBox>
  );
}

function RubiksCube() {
  const groupRef = useRef();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useFrame((state) => {
    // Smooth rotation based on mouse position
    if (groupRef.current) {
      const targetRotationY = mousePosition.x * Math.PI * 0.3;
      const targetRotationX = -mousePosition.y * Math.PI * 0.3;

      groupRef.current.rotation.y = THREE.MathUtils.lerp(
        groupRef.current.rotation.y,
        targetRotationY,
        0.05
      );
      groupRef.current.rotation.x = THREE.MathUtils.lerp(
        groupRef.current.rotation.x,
        targetRotationX,
        0.05
      );
    }
  });

  // Handle mouse move
  const handlePointerMove = (event) => {
    setMousePosition({
      x: (event.point.x / 5),
      y: (event.point.y / 5),
    });
  };

  // Generate 3x3x3 cube positions
  const cubies = [];
  for (let x = -1; x <= 1; x++) {
    for (let y = -1; y <= 1; y++) {
      for (let z = -1; z <= 1; z++) {
        // Determine which faces are visible (outer faces only)
        const colors = [
          z === 1 ? COLORS.front : null,    // front
          z === -1 ? COLORS.back : null,    // back
          y === 1 ? COLORS.top : null,      // top
          y === -1 ? COLORS.bottom : null,  // bottom
          x === -1 ? COLORS.left : null,    // left
          x === 1 ? COLORS.right : null,    // right
        ];

        cubies.push({
          position: [x * 1.02, y * 1.02, z * 1.02],
          colors,
          key: `${x}-${y}-${z}`,
        });
      }
    }
  }

  return (
    <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.5}>
      <group
        ref={groupRef}
        onPointerMove={handlePointerMove}
        rotation={[0.3, 0.3, 0]}
      >
        {cubies.map((cubie) => (
          <Cubie
            key={cubie.key}
            position={cubie.position}
            colors={cubie.colors}
          />
        ))}
      </group>
    </Float>
  );
}

export default function RubiksCube3D() {
  return (
    <div className="w-full h-full min-h-[600px]">
      <Canvas
        camera={{ position: [5, 5, 8], fov: 50 }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <pointLight position={[-10, -10, -5]} intensity={0.5} />
        <spotLight
          position={[5, 5, 5]}
          angle={0.3}
          penumbra={1}
          intensity={0.5}
          castShadow
        />

        <RubiksCube />

        <OrbitControls
          enableZoom={false}
          enablePan={false}
          minPolarAngle={Math.PI / 3}
          maxPolarAngle={Math.PI / 1.5}
          autoRotate
          autoRotateSpeed={0.5}
        />
      </Canvas>
    </div>
  );
}
