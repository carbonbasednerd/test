import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Box } from '@react-three/drei';
import { Group } from 'three';
import { PuzzlePiece, NotchPattern } from '../types/puzzle';

interface SquarePiece3DProps {
  piece: PuzzlePiece;
  position: [number, number, number];
  rotation: [number, number, number];
  opacity: number;
}

const SquarePiece3D: React.FC<SquarePiece3DProps> = ({
  piece,
  position,
  rotation,
  opacity,
}) => {
  const groupRef = useRef<Group>(null);

  useFrame(() => {
    if (groupRef.current) {
      // Subtle floating animation
      groupRef.current.position.y = position[1] + Math.sin(Date.now() * 0.001) * 0.1;
    }
  });

  if (!piece.notches || !piece.size) {
    return null; // Not a square piece
  }

  const size = piece.size / 100; // Scale down for display
  const notchDepth = size / 6; // Depth of each notch
  const notchWidth = size / 6; // Width of each notch position

  const renderNotchesOnSide = (
    pattern: NotchPattern,
    sidePosition: [number, number, number],
    sideRotation: [number, number, number]
  ) => {
    return pattern.map((present, index) => {
      if (present) return null; // Don't render anything for present material
      
      // Calculate position for this notch along the side
      const offset = (index - 2.5) * notchWidth; // Center around 0
      
      return (
        <Box
          key={index}
          position={[
            sidePosition[0] + (sideRotation[1] !== 0 ? offset : 0),
            sidePosition[1],
            sidePosition[2] + (sideRotation[1] === 0 ? offset : 0),
          ]}
          rotation={sideRotation}
          args={[
            sideRotation[1] !== 0 ? notchWidth * 0.8 : notchDepth * 2,
            notchDepth * 0.8,
            sideRotation[1] === 0 ? notchWidth * 0.8 : notchDepth * 2,
          ]}
        >
          <meshStandardMaterial color="#ff4444" transparent opacity={0.7} />
        </Box>
      );
    });
  };

  return (
    <group ref={groupRef} position={position} rotation={rotation}>
      {/* Main cube body */}
      <Box args={[size, notchDepth, size]}>
        <meshStandardMaterial
          color="#4CAF50"
          transparent
          opacity={opacity}
          roughness={0.7}
          metalness={0.2}
        />
      </Box>

      {/* Notches on each side - represented as red cubes showing cut-out areas */}
      {/* Top side */}
      {renderNotchesOnSide(
        piece.notches.top,
        [0, notchDepth/2 + 0.01, 0],
        [0, 0, 0]
      )}
      
      {/* Bottom side */}
      {renderNotchesOnSide(
        piece.notches.bottom,
        [0, -notchDepth/2 - 0.01, 0],
        [0, 0, 0]
      )}
      
      {/* Left side */}
      {renderNotchesOnSide(
        piece.notches.left,
        [-size/2 - 0.01, 0, 0],
        [0, Math.PI/2, 0]
      )}
      
      {/* Right side */}
      {renderNotchesOnSide(
        piece.notches.right,
        [size/2 + 0.01, 0, 0],
        [0, Math.PI/2, 0]
      )}
    </group>
  );
};

interface SquarePieceViewer3DProps {
  pieces: PuzzlePiece[];
}

const SquarePieceViewer3D: React.FC<SquarePieceViewer3DProps> = ({ pieces }) => {
  const squarePieces = pieces.filter(piece => piece.notches);
  
  const calculatePosition = (index: number): [number, number, number] => {
    const gridSize = Math.ceil(Math.sqrt(squarePieces.length));
    const spacing = 2;
    
    const row = Math.floor(index / gridSize);
    const col = index % gridSize;
    
    const offsetX = (col - gridSize / 2) * spacing;
    const offsetZ = (row - gridSize / 2) * spacing;
    
    return [offsetX, 0, offsetZ];
  };

  if (squarePieces.length === 0) {
    return (
      <div style={{ 
        height: '400px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: '#f5f5f5',
        border: '1px solid #ddd'
      }}>
        <p>No square pieces to display</p>
      </div>
    );
  }

  return (
    <div style={{ height: '400px' }}>
      <Canvas
        camera={{ position: [5, 5, 5], fov: 60 }}
        style={{ background: 'linear-gradient(to bottom, #87CEEB, #98FB98)' }}
      >
        <ambientLight intensity={0.6} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <pointLight position={[-10, -10, -10]} intensity={0.5} />

        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
        />

        {/* Grid reference */}
        <gridHelper args={[10, 10]} />

        {/* Render square pieces */}
        {squarePieces.map((piece, index) => (
          <SquarePiece3D
            key={piece.id}
            piece={piece}
            position={calculatePosition(index)}
            rotation={[0, 0, 0]}
            opacity={0.8}
          />
        ))}
      </Canvas>
    </div>
  );
};

export default SquarePieceViewer3D;