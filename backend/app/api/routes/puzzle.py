from fastapi import APIRouter, HTTPException
from typing import List
from app.models.puzzle import Puzzle, PuzzleUpload
from app.services.puzzle_service import PuzzleService

router = APIRouter()
puzzle_service = PuzzleService()

@router.get("/", response_model=List[Puzzle])
async def get_puzzles():
    """Get all puzzles"""
    return await puzzle_service.get_all_puzzles()

@router.get("/{puzzle_id}", response_model=Puzzle)
async def get_puzzle(puzzle_id: str):
    """Get a specific puzzle by ID"""
    puzzle = await puzzle_service.get_puzzle(puzzle_id)
    if not puzzle:
        raise HTTPException(status_code=404, detail="Puzzle not found")
    return puzzle

@router.post("/", response_model=Puzzle)
async def create_puzzle(puzzle_data: PuzzleUpload):
    """Create a new puzzle"""
    return await puzzle_service.create_puzzle(puzzle_data)

@router.delete("/{puzzle_id}")
async def delete_puzzle(puzzle_id: str):
    """Delete a puzzle"""
    success = await puzzle_service.delete_puzzle(puzzle_id)
    if not success:
        raise HTTPException(status_code=404, detail="Puzzle not found")
    return {"message": "Puzzle deleted successfully"}