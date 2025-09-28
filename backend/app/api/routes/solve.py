from fastapi import APIRouter, HTTPException, BackgroundTasks
from app.models.puzzle import SolverRequest, SolverResponse
from app.services.puzzle_solver import PuzzleSolver
from app.services.puzzle_service import PuzzleService

router = APIRouter()
puzzle_solver = PuzzleSolver()
puzzle_service = PuzzleService()

@router.post("/", response_model=SolverResponse)
async def solve_puzzle(solver_request: SolverRequest, background_tasks: BackgroundTasks):
    """Solve a puzzle using AI algorithms"""
    try:
        # Validate puzzle exists
        puzzle = await puzzle_service.get_puzzle(solver_request.puzzle_id)
        if not puzzle:
            raise HTTPException(status_code=404, detail="Puzzle not found")

        if not puzzle.pieces:
            raise HTTPException(status_code=400, detail="Puzzle has no pieces to solve")

        # Start solving process
        solution = await puzzle_solver.solve_puzzle(
            puzzle,
            algorithm=solver_request.algorithm,
            max_iterations=solver_request.max_iterations
        )

        # Update puzzle with solution
        if solution.solved:
            await puzzle_service.update_puzzle_solution(solver_request.puzzle_id, solution.solution)

        return solution

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/status/{puzzle_id}")
async def get_solve_status(puzzle_id: str):
    """Get the current solving status of a puzzle"""
    try:
        status = await puzzle_solver.get_solve_status(puzzle_id)
        return status
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/cancel/{puzzle_id}")
async def cancel_solve(puzzle_id: str):
    """Cancel an ongoing solve operation"""
    try:
        success = await puzzle_solver.cancel_solve(puzzle_id)
        if not success:
            raise HTTPException(status_code=404, detail="No active solve operation found")
        return {"message": "Solve operation cancelled"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))