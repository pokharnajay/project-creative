'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Float, RoundedBox } from '@react-three/drei';
import { useRef, useState, useEffect } from 'react';
import * as THREE from 'three';

// Rubik's cube colors - Real Rubik's cube color scheme
const COLORS = {
  front: '#ffffff',  // White
  back: '#ffff00',   // Yellow
  top: '#00ff00',    // Green
  bottom: '#0000ff', // Blue
  left: '#ff6b00',   // Orange
  right: '#ff0000',  // Red
};

function Cubie({ position, colors, layerRef }) {
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

  // Layer refs for random rotations
  const topLayerRef = useRef();
  const middleYLayerRef = useRef();
  const bottomLayerRef = useRef();
  const leftLayerRef = useRef();
  const middleXLayerRef = useRef();
  const rightLayerRef = useRef();
  const frontLayerRef = useRef();
  const middleZLayerRef = useRef();
  const backLayerRef = useRef();

  const [rotationState, setRotationState] = useState({
    currentLayer: null,
    targetRotation: 0,
    currentRotation: 0,
    isRotating: false,
  });

  // Random layer rotation effect
  useEffect(() => {
    const layers = [
      { ref: topLayerRef, axis: 'y', name: 'top' },
      { ref: bottomLayerRef, axis: 'y', name: 'bottom' },
      { ref: leftLayerRef, axis: 'x', name: 'left' },
      { ref: rightLayerRef, axis: 'x', name: 'right' },
      { ref: frontLayerRef, axis: 'z', name: 'front' },
      { ref: backLayerRef, axis: 'z', name: 'back' },
    ];

    const rotateRandomLayer = () => {
      if (!rotationState.isRotating) {
        const randomLayer = layers[Math.floor(Math.random() * layers.length)];
        const direction = Math.random() > 0.5 ? 1 : -1;

        setRotationState({
          currentLayer: randomLayer,
          targetRotation: direction * Math.PI / 2, // 90 degrees
          currentRotation: 0,
          isRotating: true,
        });
      }
    };

    const interval = setInterval(rotateRandomLayer, 3000 + Math.random() * 2000);
    return () => clearInterval(interval);
  }, [rotationState.isRotating]);

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

    // Animate layer rotations
    if (rotationState.isRotating && rotationState.currentLayer?.ref.current) {
      const speed = 0.08;
      const newRotation = THREE.MathUtils.lerp(
        rotationState.currentRotation,
        rotationState.targetRotation,
        speed
      );

      const axis = rotationState.currentLayer.axis;
      if (axis === 'x') {
        rotationState.currentLayer.ref.current.rotation.x = newRotation;
      } else if (axis === 'y') {
        rotationState.currentLayer.ref.current.rotation.y = newRotation;
      } else if (axis === 'z') {
        rotationState.currentLayer.ref.current.rotation.z = newRotation;
      }

      setRotationState(prev => ({
        ...prev,
        currentRotation: newRotation,
      }));

      // Check if rotation is complete
      if (Math.abs(newRotation - rotationState.targetRotation) < 0.01) {
        // Reset rotation to 0 after completing 90 degrees
        if (axis === 'x') {
          rotationState.currentLayer.ref.current.rotation.x = 0;
        } else if (axis === 'y') {
          rotationState.currentLayer.ref.current.rotation.y = 0;
        } else if (axis === 'z') {
          rotationState.currentLayer.ref.current.rotation.z = 0;
        }

        setRotationState({
          currentLayer: null,
          targetRotation: 0,
          currentRotation: 0,
          isRotating: false,
        });
      }
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
          z === 1 ? COLORS.front : null,    // front (white)
          z === -1 ? COLORS.back : null,    // back (yellow)
          y === 1 ? COLORS.top : null,      // top (green)
          y === -1 ? COLORS.bottom : null,  // bottom (blue)
          x === -1 ? COLORS.left : null,    // left (orange)
          x === 1 ? COLORS.right : null,    // right (red)
        ];

        cubies.push({
          position: [x * 1.02, y * 1.02, z * 1.02],
          colors,
          key: `${x}-${y}-${z}`,
          x, y, z,
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
        {/* Top Layer (y = 1) */}
        <group ref={topLayerRef}>
          {cubies.filter(c => c.y === 1).map((cubie) => (
            <Cubie
              key={cubie.key}
              position={cubie.position}
              colors={cubie.colors}
            />
          ))}
        </group>

        {/* Middle Y Layer (y = 0) */}
        <group ref={middleYLayerRef}>
          {cubies.filter(c => c.y === 0).map((cubie) => (
            <Cubie
              key={cubie.key}
              position={cubie.position}
              colors={cubie.colors}
            />
          ))}
        </group>

        {/* Bottom Layer (y = -1) */}
        <group ref={bottomLayerRef}>
          {cubies.filter(c => c.y === -1).map((cubie) => (
            <Cubie
              key={cubie.key}
              position={cubie.position}
              colors={cubie.colors}
            />
          ))}
        </group>

        {/* Left Layer (x = -1) */}
        <group ref={leftLayerRef}>
          {cubies.filter(c => c.x === -1 && c.y !== 1 && c.y !== -1).map((cubie) => (
            <Cubie
              key={`left-${cubie.key}`}
              position={cubie.position}
              colors={cubie.colors}
            />
          ))}
        </group>

        {/* Right Layer (x = 1) */}
        <group ref={rightLayerRef}>
          {cubies.filter(c => c.x === 1 && c.y !== 1 && c.y !== -1).map((cubie) => (
            <Cubie
              key={`right-${cubie.key}`}
              position={cubie.position}
              colors={cubie.colors}
            />
          ))}
        </group>

        {/* Front Layer (z = 1) */}
        <group ref={frontLayerRef}>
          {cubies.filter(c => c.z === 1 && c.y !== 1 && c.y !== -1 && c.x !== 1 && c.x !== -1).map((cubie) => (
            <Cubie
              key={`front-${cubie.key}`}
              position={cubie.position}
              colors={cubie.colors}
            />
          ))}
        </group>

        {/* Back Layer (z = -1) */}
        <group ref={backLayerRef}>
          {cubies.filter(c => c.z === -1 && c.y !== 1 && c.y !== -1 && c.x !== 1 && c.x !== -1).map((cubie) => (
            <Cubie
              key={`back-${cubie.key}`}
              position={cubie.position}
              colors={cubie.colors}
            />
          ))}
        </group>

        {/* Center cubie (middle of everything) */}
        <group ref={middleZLayerRef}>
          {cubies.filter(c => c.x === 0 && c.y === 0 && c.z === 0).map((cubie) => (
            <Cubie
              key={`center-${cubie.key}`}
              position={cubie.position}
              colors={cubie.colors}
            />
          ))}
        </group>
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
        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 10, 5]} intensity={1.2} />
        <directionalLight position={[-10, -10, -5]} intensity={0.4} />
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
