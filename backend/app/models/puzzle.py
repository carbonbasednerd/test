from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime

class PuzzlePiece(BaseModel):
    id: str
    image_path: str
    dimensions: Dict[str, float]  # x, y, z
    color_profile: List[int]  # RGB values
    shape_features: Dict[str, Any]
    position: Optional[Dict[str, float]] = None  # x, y, z coordinates in solution

class Puzzle(BaseModel):
    id: str
    name: str
    pieces: List[PuzzlePiece]
    target_shape: Optional[Dict[str, Any]] = None
    created_at: datetime
    solved: bool = False
    solution: Optional[List[Dict[str, Any]]] = None

class PuzzleUpload(BaseModel):
    name: str
    description: Optional[str] = None

class SolverRequest(BaseModel):
    puzzle_id: str
    algorithm: str = "genetic"  # genetic, simulated_annealing, reinforcement_learning
    max_iterations: int = 1000

class SolverResponse(BaseModel):
    puzzle_id: str
    solved: bool
    solution: Optional[List[Dict[str, Any]]]
    confidence: float
    processing_time: float