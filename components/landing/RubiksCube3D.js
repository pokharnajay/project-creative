'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Float } from '@react-three/drei';
import { useRef, useState, useEffect } from 'react';
import * as THREE from 'three';

// Rubik's cube colors
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

  // Layer refs - these will accumulate rotations
  const layerRefs = {
    top: useRef(),
    middleY: useRef(),
    bottom: useRef(),
    left: useRef(),
    middleX: useRef(),
    right: useRef(),
    front: useRef(),
    middleZ: useRef(),
    back: useRef(),
  };

  const [rotationQueue, setRotationQueue] = useState([]);
  const [isRotating, setIsRotating] = useState(false);
  const currentRotationRef = useRef({
    layer: null,
    startRotation: 0,
    targetRotation: 0,
    progress: 0,
  });

  // Add random rotations to queue
  useEffect(() => {
    const addRandomRotation = () => {
      const layers = [
        { name: 'top', ref: layerRefs.top, axis: 'y' },
        { name: 'middleY', ref: layerRefs.middleY, axis: 'y' },
        { name: 'bottom', ref: layerRefs.bottom, axis: 'y' },
        { name: 'left', ref: layerRefs.left, axis: 'x' },
        { name: 'middleX', ref: layerRefs.middleX, axis: 'x' },
        { name: 'right', ref: layerRefs.right, axis: 'x' },
        { name: 'front', ref: layerRefs.front, axis: 'z' },
        { name: 'middleZ', ref: layerRefs.middleZ, axis: 'z' },
        { name: 'back', ref: layerRefs.back, axis: 'z' },
      ];

      const randomLayer = layers[Math.floor(Math.random() * layers.length)];
      const direction = Math.random() > 0.5 ? 1 : -1;

      setRotationQueue(prev => [...prev, {
        layer: randomLayer,
        direction,
        amount: Math.PI / 2, // 90 degrees
      }]);
    };

    const interval = setInterval(addRandomRotation, 1000 + Math.random() * 500);
    return () => clearInterval(interval);
  }, []);

  useFrame((state, delta) => {
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

    // Process rotation queue
    if (!isRotating && rotationQueue.length > 0) {
      const nextRotation = rotationQueue[0];
      setRotationQueue(prev => prev.slice(1));

      if (nextRotation.layer.ref.current) {
        const currentRot = nextRotation.layer.axis === 'x'
          ? nextRotation.layer.ref.current.rotation.x
          : nextRotation.layer.axis === 'y'
          ? nextRotation.layer.ref.current.rotation.y
          : nextRotation.layer.ref.current.rotation.z;

        currentRotationRef.current = {
          layer: nextRotation.layer,
          startRotation: currentRot,
          targetRotation: currentRot + (nextRotation.direction * nextRotation.amount),
          progress: 0,
        };

        setIsRotating(true);
      }
    }

    // Animate current rotation
    if (isRotating && currentRotationRef.current.layer) {
      currentRotationRef.current.progress += delta * 3; // Speed of rotation

      if (currentRotationRef.current.progress >= 1) {
        // Complete the rotation
        const axis = currentRotationRef.current.layer.axis;
        const finalRotation = currentRotationRef.current.targetRotation;

        if (axis === 'x') {
          currentRotationRef.current.layer.ref.current.rotation.x = finalRotation;
        } else if (axis === 'y') {
          currentRotationRef.current.layer.ref.current.rotation.y = finalRotation;
        } else if (axis === 'z') {
          currentRotationRef.current.layer.ref.current.rotation.z = finalRotation;
        }

        setIsRotating(false);
        currentRotationRef.current = {
          layer: null,
          startRotation: 0,
          targetRotation: 0,
          progress: 0,
        };
      } else {
        // Interpolate rotation
        const t = currentRotationRef.current.progress;
        const eased = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; // Ease in-out

        const currentRot = THREE.MathUtils.lerp(
          currentRotationRef.current.startRotation,
          currentRotationRef.current.targetRotation,
          eased
        );

        const axis = currentRotationRef.current.layer.axis;
        if (axis === 'x') {
          currentRotationRef.current.layer.ref.current.rotation.x = currentRot;
        } else if (axis === 'y') {
          currentRotationRef.current.layer.ref.current.rotation.y = currentRot;
        } else if (axis === 'z') {
          currentRotationRef.current.layer.ref.current.rotation.z = currentRot;
        }
      }
    }
  });

  const handlePointerMove = (event) => {
    setMousePosition({
      x: (event.point.x / 5),
      y: (event.point.y / 5),
    });
  };

  // Generate cubies
  const cubies = [];
  for (let x = -1; x <= 1; x++) {
    for (let y = -1; y <= 1; y++) {
      for (let z = -1; z <= 1; z++) {
        const faceColors = [
          x === 1 ? COLORS.right : null,
          x === -1 ? COLORS.left : null,
          y === 1 ? COLORS.top : null,
          y === -1 ? COLORS.bottom : null,
          z === 1 ? COLORS.front : null,
          z === -1 ? COLORS.back : null,
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

  // Helper function to assign cubies to layers
  const getCubiesForLayer = (layerName) => {
    switch (layerName) {
      case 'top':
        return cubies.filter(c => c.y === 1);
      case 'middleY':
        return cubies.filter(c => c.y === 0);
      case 'bottom':
        return cubies.filter(c => c.y === -1);
      case 'left':
        return cubies.filter(c => c.x === -1 && c.y !== 1 && c.y !== -1);
      case 'middleX':
        return cubies.filter(c => c.x === 0 && c.y !== 1 && c.y !== -1);
      case 'right':
        return cubies.filter(c => c.x === 1 && c.y !== 1 && c.y !== -1);
      case 'front':
        return cubies.filter(c => c.z === 1 && c.y !== 1 && c.y !== -1 && c.x !== 1 && c.x !== -1);
      case 'middleZ':
        return cubies.filter(c => c.z === 0 && c.y !== 1 && c.y !== -1 && c.x !== 1 && c.x !== -1);
      case 'back':
        return cubies.filter(c => c.z === -1 && c.y !== 1 && c.y !== -1 && c.x !== 1 && c.x !== -1);
      default:
        return [];
    }
  };

  return (
    <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.5}>
      <group
        ref={groupRef}
        onPointerMove={handlePointerMove}
        rotation={[0.3, 0.3, 0]}
      >
        {/* Render all layers */}
        {Object.entries(layerRefs).map(([layerName, ref]) => (
          <group key={layerName} ref={ref}>
            {getCubiesForLayer(layerName).map((cubie) => (
              <Cubie
                key={cubie.key}
                position={cubie.position}
                faceColors={cubie.faceColors}
              />
            ))}
          </group>
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
