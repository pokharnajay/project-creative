'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Float } from '@react-three/drei';
import { useRef, useState, useEffect } from 'react';
import * as THREE from 'three';

// Rubik's cube colors - Real Rubik's cube color scheme
const COLORS = {
  right: '#ff0000',   // Red (x+)
  left: '#ff6b00',    // Orange (x-)
  top: '#00ff00',     // Green (y+)
  bottom: '#0000ff',  // Blue (y-)
  front: '#ffffff',   // White (z+)
  back: '#ffff00',    // Yellow (z-)
};

function Cubie({ position, faceColors }) {
  const meshRef = useRef();
  const [hovered, setHovered] = useState(false);

  useFrame(() => {
    if (hovered) {
      meshRef.current.scale.lerp(new THREE.Vector3(1.05, 1.05, 1.05), 0.15);
    } else {
      meshRef.current.scale.lerp(new THREE.Vector3(1, 1, 1), 0.15);
    }
  });

  // Create materials array for each face
  // Order: right, left, top, bottom, front, back
  const materials = faceColors.map(color =>
    new THREE.MeshStandardMaterial({
      color: color || '#1a1a1a',
      metalness: 0.2,
      roughness: 0.3,
    })
  );

  return (
    <mesh
      ref={meshRef}
      position={position}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <boxGeometry args={[0.98, 0.98, 0.98]} />
      {materials.map((material, index) => (
        <primitive key={index} object={material} attach={`material-${index}`} />
      ))}
    </mesh>
  );
}

function RubiksCube() {
  const groupRef = useRef();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Layer refs for random rotations - now including middle layers
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

  // Random layer rotation effect with faster intervals
  useEffect(() => {
    const layers = [
      { ref: topLayerRef, axis: 'y', name: 'top' },
      { ref: middleYLayerRef, axis: 'y', name: 'middleY' },
      { ref: bottomLayerRef, axis: 'y', name: 'bottom' },
      { ref: leftLayerRef, axis: 'x', name: 'left' },
      { ref: middleXLayerRef, axis: 'x', name: 'middleX' },
      { ref: rightLayerRef, axis: 'x', name: 'right' },
      { ref: frontLayerRef, axis: 'z', name: 'front' },
      { ref: middleZLayerRef, axis: 'z', name: 'middleZ' },
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

    // Faster intervals: 800ms to 1500ms between rotations
    const interval = setInterval(rotateRandomLayer, 800 + Math.random() * 700);
    return () => clearInterval(interval);
  }, [rotationState.isRotating]);

  useFrame(() => {
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

  // Generate 3x3x3 cube positions with proper face colors
  const cubies = [];
  for (let x = -1; x <= 1; x++) {
    for (let y = -1; y <= 1; y++) {
      for (let z = -1; z <= 1; z++) {
        // Determine which faces are visible and assign colors
        // Material order: right(x+), left(x-), top(y+), bottom(y-), front(z+), back(z-)
        const faceColors = [
          x === 1 ? COLORS.right : null,    // right face (red)
          x === -1 ? COLORS.left : null,    // left face (orange)
          y === 1 ? COLORS.top : null,      // top face (green)
          y === -1 ? COLORS.bottom : null,  // bottom face (blue)
          z === 1 ? COLORS.front : null,    // front face (white)
          z === -1 ? COLORS.back : null,    // back face (yellow)
        ];

        cubies.push({
          position: [x * 1.01, y * 1.01, z * 1.01],
          faceColors,
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
              faceColors={cubie.faceColors}
            />
          ))}
        </group>

        {/* Middle Y Layer (y = 0) */}
        <group ref={middleYLayerRef}>
          {cubies.filter(c => c.y === 0).map((cubie) => (
            <Cubie
              key={cubie.key}
              position={cubie.position}
              faceColors={cubie.faceColors}
            />
          ))}
        </group>

        {/* Bottom Layer (y = -1) */}
        <group ref={bottomLayerRef}>
          {cubies.filter(c => c.y === -1).map((cubie) => (
            <Cubie
              key={cubie.key}
              position={cubie.position}
              faceColors={cubie.faceColors}
            />
          ))}
        </group>

        {/* Left Layer (x = -1) - only middle cubies */}
        <group ref={leftLayerRef}>
          {cubies.filter(c => c.x === -1 && c.y !== 1 && c.y !== -1).map((cubie) => (
            <Cubie
              key={`left-${cubie.key}`}
              position={cubie.position}
              faceColors={cubie.faceColors}
            />
          ))}
        </group>

        {/* Middle X Layer (x = 0) */}
        <group ref={middleXLayerRef}>
          {cubies.filter(c => c.x === 0 && c.y !== 1 && c.y !== -1).map((cubie) => (
            <Cubie
              key={`middleX-${cubie.key}`}
              position={cubie.position}
              faceColors={cubie.faceColors}
            />
          ))}
        </group>

        {/* Right Layer (x = 1) - only middle cubies */}
        <group ref={rightLayerRef}>
          {cubies.filter(c => c.x === 1 && c.y !== 1 && c.y !== -1).map((cubie) => (
            <Cubie
              key={`right-${cubie.key}`}
              position={cubie.position}
              faceColors={cubie.faceColors}
            />
          ))}
        </group>

        {/* Front Layer (z = 1) - only center cubie */}
        <group ref={frontLayerRef}>
          {cubies.filter(c => c.z === 1 && c.y !== 1 && c.y !== -1 && c.x !== 1 && c.x !== -1).map((cubie) => (
            <Cubie
              key={`front-${cubie.key}`}
              position={cubie.position}
              faceColors={cubie.faceColors}
            />
          ))}
        </group>

        {/* Middle Z Layer (z = 0) - only center cubie */}
        <group ref={middleZLayerRef}>
          {cubies.filter(c => c.z === 0 && c.y !== 1 && c.y !== -1 && c.x !== 1 && c.x !== -1).map((cubie) => (
            <Cubie
              key={`middleZ-${cubie.key}`}
              position={cubie.position}
              faceColors={cubie.faceColors}
            />
          ))}
        </group>

        {/* Back Layer (z = -1) - only center cubie */}
        <group ref={backLayerRef}>
          {cubies.filter(c => c.z === -1 && c.y !== 1 && c.y !== -1 && c.x !== 1 && c.x !== -1).map((cubie) => (
            <Cubie
              key={`back-${cubie.key}`}
              position={cubie.position}
              faceColors={cubie.faceColors}
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
        <ambientLight intensity={0.7} />
        <directionalLight position={[10, 10, 5]} intensity={1.5} />
        <directionalLight position={[-10, -10, -5]} intensity={0.5} />
        <pointLight position={[0, 10, 0]} intensity={0.3} />
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
