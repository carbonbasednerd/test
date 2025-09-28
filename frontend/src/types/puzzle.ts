export interface PuzzlePiece {
  id: string;
  image_path: string;
  dimensions: {
    x: number;
    y: number;
    z: number;
  };
  color_profile: number[];
  shape_features: {
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