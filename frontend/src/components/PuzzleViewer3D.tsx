import React, { useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Text, Box, Sphere } from '@react-three/drei';
import { Color } from 'three';
import { Paper, Typography, Slider, FormControlLabel, Switch } from '@mui/material';
import { Puzzle, PuzzlePiece } from '../types/puzzle';

interface PuzzlePiece3DProps {
  piece: PuzzlePiece;
  position: [number, number, number];
  rotation: [number, number, number];
  showLabels: boolean;
  opacity: number;
}

const PuzzlePiece3D: React.FC<PuzzlePiece3DProps> = ({
  piece,
  position,
  rotation,
  showLabels,
  opacity,
}) => {
  const meshRef = useRef<any>();

  useFrame((state) => {
    if (meshRef.current) {
      // Subtle floating animation
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime + position[0]) * 0.1;
    }
  });

  // Convert color profile to Three.js color
  const color = new Color(
    piece.color_profile[0] / 255,
    piece.color_profile[1] / 255,
    piece.color_profile[2] / 255
  );

  // Scale based on piece dimensions
  const scale: [number, number, number] = [
    piece.dimensions.x / 100,
    piece.dimensions.y / 100,
    piece.dimensions.z / 50,
  ];

  return (
    <group position={position} rotation={rotation}>
      <Box
        ref={meshRef}
        args={scale}
        onClick={() => console.log('Clicked piece:', piece.id)}
      >
        <meshStandardMaterial
          color={color}
          transparent
          opacity={opacity}
          roughness={0.7}
          metalness={0.2}
        />
      </Box>

      {showLabels && (
        <Text
          position={[0, scale[1] / 2 + 0.5, 0]}
          fontSize={0.3}
          color="white"
          anchorX="center"
          anchorY="middle"
        >
          {`Piece ${piece.id.slice(0, 8)}`}
        </Text>
      )}

      {/* Corner indicators based on shape features */}
      {piece.shape_features.corners > 0 && (
        <>
          {Array.from({ length: Math.min(piece.shape_features.corners, 8) }).map((_, i) => {
            const angle = (i / Math.max(piece.shape_features.corners, 1)) * Math.PI * 2;
            const radius = Math.max(scale[0], scale[1]) * 0.6;
            const cornerPos: [number, number, number] = [
              Math.cos(angle) * radius,
              scale[1] / 2 + 0.1,
              Math.sin(angle) * radius,
            ];

            return (
              <Sphere key={i} position={cornerPos} args={[0.05]}>
                <meshBasicMaterial color="yellow" />
              </Sphere>
            );
          })}
        </>
      )}
    </group>
  );
};

interface CameraControllerProps {
  autoRotate: boolean;
}

const CameraController: React.FC<CameraControllerProps> = ({ autoRotate }) => {
  const { camera } = useThree();

  useFrame(() => {
    if (autoRotate) {
      camera.position.x = Math.cos(Date.now() * 0.001) * 15;
      camera.position.z = Math.sin(Date.now() * 0.001) * 15;
      camera.lookAt(0, 0, 0);
    }
  });

  return null;
};

interface PuzzleViewer3DProps {
  puzzle: Puzzle;
  showSolution?: boolean;
}

const PuzzleViewer3D: React.FC<PuzzleViewer3DProps> = ({
  puzzle,
  showSolution = false,
}) => {
  const [showLabels, setShowLabels] = useState(true);
  const [opacity, setOpacity] = useState(0.8);
  const [autoRotate, setAutoRotate] = useState(false);
  const [explodeView, setExplodeView] = useState(0);

  const calculatePiecePosition = (piece: PuzzlePiece, index: number): [number, number, number] => {
    if (showSolution && puzzle.solution && puzzle.solution[index]) {
      const solutionPos = puzzle.solution[index].position;
      return [solutionPos.x, solutionPos.y, solutionPos.z];
    }

    // Default grid layout when no solution is available
    const gridSize = Math.ceil(Math.sqrt(puzzle.pieces.length));
    const spacing = 3 + explodeView * 2;

    const row = Math.floor(index / gridSize);
    const col = index % gridSize;

    const offsetX = (col - gridSize / 2) * spacing;
    const offsetZ = (row - gridSize / 2) * spacing;
    const offsetY = explodeView * (Math.random() - 0.5) * 5;

    return [offsetX, offsetY, offsetZ];
  };

  const calculatePieceRotation = (piece: PuzzlePiece, index: number): [number, number, number] => {
    if (showSolution && puzzle.solution && puzzle.solution[index]) {
      const solutionRot = puzzle.solution[index].rotation;
      return [
        (solutionRot.x * Math.PI) / 180,
        (solutionRot.y * Math.PI) / 180,
        (solutionRot.z * Math.PI) / 180,
      ];
    }

    // Random rotation when no solution
    return [0, index * 0.5, 0];
  };

  if (!puzzle.pieces || puzzle.pieces.length === 0) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center', height: '400px' }}>
        <Typography variant="h6" color="text.secondary">
          No puzzle pieces to display
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Upload some images or videos to get started
        </Typography>
      </Paper>
    );
  }

  return (
    <div>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          3D Puzzle Viewer
        </Typography>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center' }}>
          <FormControlLabel
            control={
              <Switch
                checked={showLabels}
                onChange={(e) => setShowLabels(e.target.checked)}
              />
            }
            label="Show Labels"
          />

          <FormControlLabel
            control={
              <Switch
                checked={autoRotate}
                onChange={(e) => setAutoRotate(e.target.checked)}
              />
            }
            label="Auto Rotate"
          />

          <div style={{ minWidth: '120px' }}>
            <Typography variant="body2" gutterBottom>
              Opacity: {Math.round(opacity * 100)}%
            </Typography>
            <Slider
              value={opacity}
              onChange={(_, value) => setOpacity(value as number)}
              min={0.1}
              max={1}
              step={0.1}
              size="small"
            />
          </div>

          <div style={{ minWidth: '120px' }}>
            <Typography variant="body2" gutterBottom>
              Explode View: {explodeView}
            </Typography>
            <Slider
              value={explodeView}
              onChange={(_, value) => setExplodeView(value as number)}
              min={0}
              max={5}
              step={0.5}
              size="small"
            />
          </div>
        </div>
      </Paper>

      <Paper sx={{ height: '600px', overflow: 'hidden' }}>
        <Canvas
          camera={{ position: [10, 10, 10], fov: 60 }}
          style={{ background: 'linear-gradient(to bottom, #1a1a2e, #16213e)' }}
        >
          <ambientLight intensity={0.4} />
          <pointLight position={[10, 10, 10]} intensity={1} />
          <pointLight position={[-10, -10, -10]} intensity={0.5} color="#4fc3f7" />

          <CameraController autoRotate={autoRotate} />

          <OrbitControls
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
          />

          {/* Ground plane */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]}>
            <planeGeometry args={[50, 50]} />
            <meshStandardMaterial color="#2a2a2a" transparent opacity={0.3} />
          </mesh>

          {/* Render puzzle pieces */}
          {puzzle.pieces.map((piece, index) => (
            <PuzzlePiece3D
              key={piece.id}
              piece={piece}
              position={calculatePiecePosition(piece, index)}
              rotation={calculatePieceRotation(piece, index)}
              showLabels={showLabels}
              opacity={opacity}
            />
          ))}

          {/* Center reference point */}
          <Sphere position={[0, 0, 0]} args={[0.1]}>
            <meshBasicMaterial color="red" />
          </Sphere>

          {showSolution && puzzle.solved && (
            <Text
              position={[0, 8, 0]}
              fontSize={1}
              color="green"
              anchorX="center"
              anchorY="middle"
            >
              SOLVED!
            </Text>
          )}
        </Canvas>
      </Paper>

      <Paper sx={{ p: 2, mt: 2 }}>
        <Typography variant="body2" color="text.secondary">
          <strong>Controls:</strong> Left click + drag to rotate • Right click + drag to pan •
          Scroll to zoom • Click pieces to select
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          <strong>Pieces:</strong> {puzzle.pieces.length} •
          <strong>Status:</strong> {puzzle.solved ? 'Solved' : 'Unsolved'} •
          <strong>Yellow dots:</strong> Detected corners
        </Typography>
      </Paper>
    </div>
  );
};

export default PuzzleViewer3D;