'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Float, RoundedBox } from '@react-three/drei';
import { useRef, useState, useEffect } from 'react';
import * as THREE from 'three';

// Rubik's cube colors - Custom scheme
const COLORS = {
  golden: '#101828',  // Golden for middle layers
  black: '#4a5565',   // Black for outer layers
  interior: '#4a5565', // Darker black for interior faces
};

function Cubie({ position, faceColors, cubeState }) {
  const meshRef = useRef();
  const [hovered, setHovered] = useState(false);

  useFrame(() => {
    if (hovered && meshRef.current) {
      meshRef.current.scale.lerp(new THREE.Vector3(1.03, 1.03, 1.03), 0.15);
    } else if (meshRef.current) {
      meshRef.current.scale.lerp(new THREE.Vector3(1, 1, 1), 0.15);
    }
  });

  // Create materials for each face with proper shine
  const materials = faceColors.map(color => {
    const mat = new THREE.MeshStandardMaterial({
      color: color,
      metalness: 0.1,
      roughness: 0.2,
      envMapIntensity: 0.5,
    });
    return mat;
  });

  return (
    <RoundedBox
      ref={meshRef}
      args={[0.92, 0.92, 0.92]}
      radius={0.08}
      smoothness={8}
      position={position}
      rotation={cubeState.rotation}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      {materials.map((material, index) => (
        <primitive key={index} object={material} attach={`material-${index}`} />
      ))}
    </RoundedBox>
  );
}

function RubiksCube() {
  const groupRef = useRef();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Initialize cube state - each cubie has position, rotation, and face colors
  const [cubeState, setCubeState] = useState(() => {
    const initialState = [];
    for (let x = -1; x <= 1; x++) {
      for (let y = -1; y <= 1; y++) {
        for (let z = -1; z <= 1; z++) {
          // Determine if this cubie is on a middle line (exactly one coordinate is 0)
          const zeroCount = [x, y, z].filter(coord => coord === 0).length;
          const isMiddleLine = zeroCount === 1;
          const cubieColor = isMiddleLine ? COLORS.golden : COLORS.black;

          // Define initial face colors based on position
          // Order: right, left, top, bottom, front, back
          // Both visible outer faces and interior faces follow the same color scheme
          const faceColors = [
            x === 1 ? cubieColor : (x === -1 ? cubieColor : COLORS.black),   // right face
            x === -1 ? cubieColor : (x === 1 ? cubieColor : COLORS.black),  // left face
            y === 1 ? cubieColor : (y === -1 ? cubieColor : COLORS.black),   // top face
            y === -1 ? cubieColor : (y === 1 ? cubieColor : COLORS.black),  // bottom face
            z === 1 ? cubieColor : (z === -1 ? cubieColor : COLORS.black),   // front face
            z === -1 ? cubieColor : (z === 1 ? cubieColor : COLORS.black),  // back face
          ];

          initialState.push({
            id: `${x}-${y}-${z}`,
            position: [x * 1.05, y * 1.05, z * 1.05],
            gridPosition: { x, y, z },
            rotation: [0, 0, 0],
            faceColors: faceColors,
          });
        }
      }
    }
    return initialState;
  });

  const [rotationState, setRotationState] = useState({
    isRotating: false,
    layer: null,
    axis: null,
    direction: 1,
    progress: 0,
    affectedCubies: [],
  });

  // Queue for upcoming rotations
  const [rotationQueue, setRotationQueue] = useState([]);

  // Add random rotations to queue
  useEffect(() => {
    const addRandomRotation = () => {
      const layers = [
        { axis: 'y', value: 1, name: 'top' },
        { axis: 'y', value: 0, name: 'middleY' },
        { axis: 'y', value: -1, name: 'bottom' },
        { axis: 'x', value: 1, name: 'right' },
        { axis: 'x', value: 0, name: 'middleX' },
        { axis: 'x', value: -1, name: 'left' },
        { axis: 'z', value: 1, name: 'front' },
        { axis: 'z', value: 0, name: 'middleZ' },
        { axis: 'z', value: -1, name: 'back' },
      ];

      const randomLayer = layers[Math.floor(Math.random() * layers.length)];
      const direction = Math.random() > 0.5 ? 1 : -1;

      setRotationQueue(prev => [...prev, { ...randomLayer, direction }]);
    };

    const interval = setInterval(addRandomRotation, 1200 + Math.random() * 600);
    return () => clearInterval(interval);
  }, []);

  // Process rotation queue
  useEffect(() => {
    if (!rotationState.isRotating && rotationQueue.length > 0) {
      const nextRotation = rotationQueue[0];
      setRotationQueue(prev => prev.slice(1));

      // Find affected cubies
      const affected = cubeState
        .map((cubie, index) => {
          const matches = cubie.gridPosition[nextRotation.axis] === nextRotation.value;
          return matches ? index : -1;
        })
        .filter(index => index !== -1);

      setRotationState({
        isRotating: true,
        layer: nextRotation.value,
        axis: nextRotation.axis,
        direction: nextRotation.direction,
        progress: 0,
        affectedCubies: affected,
      });
    }
  }, [rotationQueue, rotationState.isRotating, cubeState]);

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

    // Animate layer rotation
    if (rotationState.isRotating) {
      const newProgress = Math.min(rotationState.progress + delta * 2.5, 1);

      setRotationState(prev => ({
        ...prev,
        progress: newProgress,
      }));

      if (newProgress >= 1) {
        // Rotation complete - update cube state permanently
        const angle = rotationState.direction * (Math.PI / 2);

        setCubeState(prevState => {
          const newState = [...prevState];

          rotationState.affectedCubies.forEach(index => {
            const cubie = newState[index];
            const { axis, direction } = rotationState;

            // Update grid position
            const oldPos = cubie.gridPosition;
            let newGridPos = { ...oldPos };

            if (axis === 'x') {
              const newY = -direction * oldPos.z;
              const newZ = direction * oldPos.y;
              newGridPos.y = newY;
              newGridPos.z = newZ;
            } else if (axis === 'y') {
              const newX = direction * oldPos.z;
              const newZ = -direction * oldPos.x;
              newGridPos.x = newX;
              newGridPos.z = newZ;
            } else if (axis === 'z') {
              const newX = -direction * oldPos.y;
              const newY = direction * oldPos.x;
              newGridPos.x = newX;
              newGridPos.y = newY;
            }

            // Update world position
            newState[index].position = [
              newGridPos.x * 1.05,
              newGridPos.y * 1.05,
              newGridPos.z * 1.05,
            ];
            newState[index].gridPosition = newGridPos;

            // Rotate face colors
            const oldColors = [...cubie.faceColors];
            let newColors = [...oldColors];

            if (axis === 'x') {
              if (direction === 1) {
                // Clockwise around X: top->front, front->bottom, bottom->back, back->top
                newColors[2] = oldColors[4]; // top = front
                newColors[4] = oldColors[3]; // front = bottom
                newColors[3] = oldColors[5]; // bottom = back
                newColors[5] = oldColors[2]; // back = top
              } else {
                // Counter-clockwise around X
                newColors[2] = oldColors[5]; // top = back
                newColors[5] = oldColors[3]; // back = bottom
                newColors[3] = oldColors[4]; // bottom = front
                newColors[4] = oldColors[2]; // front = top
              }
            } else if (axis === 'y') {
              if (direction === 1) {
                // Clockwise around Y: front->right, right->back, back->left, left->front
                newColors[4] = oldColors[1]; // front = left
                newColors[0] = oldColors[4]; // right = front
                newColors[5] = oldColors[0]; // back = right
                newColors[1] = oldColors[5]; // left = back
              } else {
                // Counter-clockwise around Y
                newColors[4] = oldColors[0]; // front = right
                newColors[1] = oldColors[4]; // left = front
                newColors[5] = oldColors[1]; // back = left
                newColors[0] = oldColors[5]; // right = back
              }
            } else if (axis === 'z') {
              if (direction === 1) {
                // Clockwise around Z: top->left, left->bottom, bottom->right, right->top
                newColors[2] = oldColors[0]; // top = right
                newColors[1] = oldColors[2]; // left = top
                newColors[3] = oldColors[1]; // bottom = left
                newColors[0] = oldColors[3]; // right = bottom
              } else {
                // Counter-clockwise around Z
                newColors[2] = oldColors[1]; // top = left
                newColors[0] = oldColors[2]; // right = top
                newColors[3] = oldColors[0]; // bottom = right
                newColors[1] = oldColors[3]; // left = bottom
              }
            }

            newState[index].faceColors = newColors;
            newState[index].rotation = [0, 0, 0]; // Reset rotation
          });

          return newState;
        });

        setRotationState({
          isRotating: false,
          layer: null,
          axis: null,
          direction: 1,
          progress: 0,
          affectedCubies: [],
        });
      }
    }
  });

  const handlePointerMove = (event) => {
    setMousePosition({
      x: (event.point.x / 5),
      y: (event.point.y / 5),
    });
  };

  // Calculate rotation for cubies currently being rotated
  const getCubieRotation = (index) => {
    if (rotationState.isRotating && rotationState.affectedCubies.includes(index)) {
      const angle = rotationState.direction * (Math.PI / 2) * rotationState.progress;
      const eased = rotationState.progress < 0.5
        ? 2 * rotationState.progress * rotationState.progress
        : -1 + (4 - 2 * rotationState.progress) * rotationState.progress;
      const easedAngle = rotationState.direction * (Math.PI / 2) * eased;

      if (rotationState.axis === 'x') return [easedAngle, 0, 0];
      if (rotationState.axis === 'y') return [0, easedAngle, 0];
      if (rotationState.axis === 'z') return [0, 0, easedAngle];
    }
    return [0, 0, 0];
  };

  return (
    <Float speed={1.5} rotationIntensity={0.7} floatIntensity={0.4}>
      <group
        ref={groupRef}
        onPointerMove={handlePointerMove}
        rotation={[0.3, 0.3, 0]}
      >
        {cubeState.map((cubie, index) => (
          <Cubie
            key={cubie.id}
            position={cubie.position}
            faceColors={cubie.faceColors}
            cubeState={{
              rotation: getCubieRotation(index),
            }}
          />
        ))}
      </group>
    </Float>
  );
}

export default function RubiksCube3D() {
  return (
    <div className="w-full h-full min-h-[800px] relative">
    
      <Canvas
        camera={{ position: [6, 6, 9], fov: 45 }}
        style={{ background: 'transparent' }}
        shadows
      >
        {/* Enhanced lighting for realism */}
        <ambientLight intensity={0.4} />
        <directionalLight
          position={[10, 10, 8]}
          intensity={1.2}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        <directionalLight position={[-8, 5, -5]} intensity={0.3} />
        <pointLight position={[0, 10, 0]} intensity={0.3} />
        <spotLight
          position={[8, 8, 8]}
          angle={0.3}
          penumbra={1}
          intensity={0.5}
          castShadow
        />

        <RubiksCube />

        <OrbitControls
          enableZoom={false}
          enablePan={false}
          minPolarAngle={Math.PI / 4}
          maxPolarAngle={Math.PI / 1.8}
          autoRotate
          autoRotateSpeed={0.9}
        />
      </Canvas>
    </div>
  );
}
