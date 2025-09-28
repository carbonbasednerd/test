import uuid
from datetime import datetime
from typing import List, Optional, Dict, Any
from app.models.puzzle import Puzzle, PuzzleUpload, PuzzlePiece
import redis
import json

class PuzzleService:
    def __init__(self):
        self.redis_client = redis.Redis(host='redis', port=6379, decode_responses=True)

    async def get_all_puzzles(self) -> List[Puzzle]:
        """Get all puzzles"""
        puzzle_keys = self.redis_client.keys("puzzle:*")
        puzzles = []
        for key in puzzle_keys:
            puzzle_data = self.redis_client.get(key)
            if puzzle_data:
                puzzles.append(Puzzle(**json.loads(puzzle_data)))
        return puzzles

    async def get_puzzle(self, puzzle_id: str) -> Optional[Puzzle]:
        """Get a specific puzzle by ID"""
        puzzle_data = self.redis_client.get(f"puzzle:{puzzle_id}")
        if puzzle_data:
            return Puzzle(**json.loads(puzzle_data))
        return None

    async def create_puzzle(self, puzzle_data: PuzzleUpload) -> Puzzle:
        """Create a new puzzle"""
        puzzle_id = str(uuid.uuid4())
        puzzle = Puzzle(
            id=puzzle_id,
            name=puzzle_data.name,
            pieces=[],
            created_at=datetime.now(),
            solved=False
        )

        self.redis_client.set(
            f"puzzle:{puzzle_id}",
            json.dumps(puzzle.model_dump(), default=str)
        )
        return puzzle

    async def add_pieces_to_puzzle(self, puzzle_id: str, pieces: List[Dict[str, Any]]) -> bool:
        """Add pieces to an existing puzzle"""
        puzzle = await self.get_puzzle(puzzle_id)
        if not puzzle:
            return False

        # Convert pieces to PuzzlePiece objects
        puzzle_pieces = [PuzzlePiece(**piece) for piece in pieces]
        puzzle.pieces.extend(puzzle_pieces)

        # Update in Redis
        self.redis_client.set(
            f"puzzle:{puzzle_id}",
            json.dumps(puzzle.model_dump(), default=str)
        )
        return True

    async def update_puzzle_solution(self, puzzle_id: str, solution: List[Dict[str, Any]]) -> bool:
        """Update puzzle with solution"""
        puzzle = await self.get_puzzle(puzzle_id)
        if not puzzle:
            return False

        puzzle.solved = True
        puzzle.solution = solution

        # Update in Redis
        self.redis_client.set(
            f"puzzle:{puzzle_id}",
            json.dumps(puzzle.model_dump(), default=str)
        )
        return True

    async def delete_puzzle(self, puzzle_id: str) -> bool:
        """Delete a puzzle"""
        result = self.redis_client.delete(f"puzzle:{puzzle_id}")
        return result > 0