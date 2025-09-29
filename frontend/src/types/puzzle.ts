// Notch pattern for each side of a square piece
// Array of 6 booleans: true = present (material), false = notched (cut out)
export type NotchPattern = [boolean, boolean, boolean, boolean, boolean, boolean];

export interface SquarePieceNotches {
  top: NotchPattern;
  right: NotchPattern;
  bottom: NotchPattern;
  left: NotchPattern;
}

export interface PuzzlePiece {
  id: string;
  // For new square pieces with notches
  notches?: SquarePieceNotches;
  size?: number; // width/height of square (depth is always 1 notch unit)
  
  // Legacy fields for image-based pieces (keeping for backward compatibility)
  image_path?: string;
  dimensions?: {
    x: number;
    y: number;
    z: number;
  };
  color_profile?: number[];
  shape_features?: {
    area: number;
    perimeter: number;
    complexity: number;
    corners: number;
  };
  position?: {
    x: number;
    y: number;
    z: number;
  };
}

export interface Puzzle {
  id: string;
  name: string;
  pieces: PuzzlePiece[];
  target_shape?: any;
  created_at: string;
  solved: boolean;
  solution?: Array<{
    piece_id: string;
    position: {
      x: number;
      y: number;
      z: number;
    };
    rotation: {
      x: number;
      y: number;
      z: number;
    };
  }>;
}

export interface PuzzleUpload {
  name: string;
  description?: string;
}

export interface SolverRequest {
  puzzle_id: string;
  algorithm: 'genetic' | 'simulated_annealing' | 'reinforcement_learning';
  max_iterations: number;
}

export interface SolverResponse {
  puzzle_id: string;
  solved: boolean;
  solution?: Array<{
    piece_id: string;
    position: {
      x: number;
      y: number;
      z: number;
    };
    rotation: {
      x: number;
      y: number;
      z: number;
    };
  }>;
  confidence: number;
  processing_time: number;
}