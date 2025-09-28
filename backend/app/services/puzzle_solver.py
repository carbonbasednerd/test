import asyncio
import time
import random
import numpy as np
from typing import Dict, List, Any, Optional
from app.models.puzzle import Puzzle, SolverResponse
import redis
import json

class PuzzleSolver:
    def __init__(self):
        self.redis_client = redis.Redis(host='redis', port=6379, decode_responses=True)
        self.active_solvers: Dict[str, bool] = {}

    async def solve_puzzle(self, puzzle: Puzzle, algorithm: str = "genetic", max_iterations: int = 1000) -> SolverResponse:
        """Solve the puzzle using the specified algorithm"""
        start_time = time.time()
        puzzle_id = puzzle.id

        # Mark as active
        self.active_solvers[puzzle_id] = True

        try:
            if algorithm == "genetic":
                solution = await self._genetic_algorithm_solve(puzzle, max_iterations)
            elif algorithm == "simulated_annealing":
                solution = await self._simulated_annealing_solve(puzzle, max_iterations)
            elif algorithm == "reinforcement_learning":
                solution = await self._reinforcement_learning_solve(puzzle, max_iterations)
            else:
                raise ValueError(f"Unknown algorithm: {algorithm}")

            processing_time = time.time() - start_time

            # Calculate confidence based on solution quality
            confidence = self._calculate_solution_confidence(puzzle, solution)

            return SolverResponse(
                puzzle_id=puzzle_id,
                solved=solution is not None and len(solution) > 0,
                solution=solution,
                confidence=confidence,
                processing_time=processing_time
            )

        finally:
            # Mark as inactive
            self.active_solvers.pop(puzzle_id, None)

    async def _genetic_algorithm_solve(self, puzzle: Puzzle, max_iterations: int) -> Optional[List[Dict[str, Any]]]:
        """Genetic algorithm for puzzle solving"""
        if not puzzle.pieces:
            return None

        population_size = min(50, len(puzzle.pieces) * 2)
        mutation_rate = 0.1

        # Initialize population with random arrangements
        population = []
        for _ in range(population_size):
            arrangement = self._create_random_arrangement(puzzle.pieces)
            population.append(arrangement)

        best_solution = None
        best_fitness = float('-inf')

        for iteration in range(max_iterations):
            # Check if solving was cancelled
            if puzzle.id not in self.active_solvers:
                break

            # Evaluate fitness for each arrangement
            fitness_scores = []
            for arrangement in population:
                fitness = self._calculate_fitness(arrangement, puzzle.pieces)
                fitness_scores.append(fitness)

                if fitness > best_fitness:
                    best_fitness = fitness
                    best_solution = arrangement.copy()

            # Selection, crossover, and mutation
            new_population = []

            # Keep best solutions (elitism)
            elite_count = population_size // 10
            elite_indices = np.argsort(fitness_scores)[-elite_count:]
            for idx in elite_indices:
                new_population.append(population[idx])

            # Generate new offspring
            while len(new_population) < population_size:
                # Tournament selection
                parent1 = self._tournament_selection(population, fitness_scores)
                parent2 = self._tournament_selection(population, fitness_scores)

                # Crossover
                child1, child2 = self._crossover(parent1, parent2)

                # Mutation
                if random.random() < mutation_rate:
                    child1 = self._mutate(child1)
                if random.random() < mutation_rate:
                    child2 = self._mutate(child2)

                new_population.extend([child1, child2])

            population = new_population[:population_size]

            # Allow other tasks to run
            await asyncio.sleep(0.001)

        return best_solution

    async def _simulated_annealing_solve(self, puzzle: Puzzle, max_iterations: int) -> Optional[List[Dict[str, Any]]]:
        """Simulated annealing algorithm for puzzle solving"""
        if not puzzle.pieces:
            return None

        # Initial solution
        current_solution = self._create_random_arrangement(puzzle.pieces)
        current_fitness = self._calculate_fitness(current_solution, puzzle.pieces)

        best_solution = current_solution.copy()
        best_fitness = current_fitness

        # Annealing parameters
        initial_temp = 100.0
        cooling_rate = 0.995

        temperature = initial_temp

        for iteration in range(max_iterations):
            # Check if solving was cancelled
            if puzzle.id not in self.active_solvers:
                break

            # Generate neighbor solution
            neighbor_solution = self._get_neighbor_solution(current_solution)
            neighbor_fitness = self._calculate_fitness(neighbor_solution, puzzle.pieces)

            # Accept or reject the neighbor
            fitness_diff = neighbor_fitness - current_fitness

            if fitness_diff > 0 or random.random() < np.exp(fitness_diff / temperature):
                current_solution = neighbor_solution
                current_fitness = neighbor_fitness

                if current_fitness > best_fitness:
                    best_solution = current_solution.copy()
                    best_fitness = current_fitness

            # Cool down
            temperature *= cooling_rate

            # Allow other tasks to run
            await asyncio.sleep(0.001)

        return best_solution

    async def _reinforcement_learning_solve(self, puzzle: Puzzle, max_iterations: int) -> Optional[List[Dict[str, Any]]]:
        """Simple Q-learning approach for puzzle solving"""
        if not puzzle.pieces:
            return None

        # Simplified RL approach - would need proper neural network implementation for production
        # For now, we'll use a random search with learned preferences

        best_solution = None
        best_fitness = float('-inf')

        for iteration in range(max_iterations):
            # Check if solving was cancelled
            if puzzle.id not in self.active_solvers:
                break

            # Generate solution with some learned heuristics
            solution = self._create_heuristic_arrangement(puzzle.pieces)
            fitness = self._calculate_fitness(solution, puzzle.pieces)

            if fitness > best_fitness:
                best_fitness = fitness
                best_solution = solution.copy()

            # Allow other tasks to run
            await asyncio.sleep(0.001)

        return best_solution

    def _create_random_arrangement(self, pieces: List) -> List[Dict[str, Any]]:
        """Create a random arrangement of puzzle pieces"""
        arrangement = []
        for i, piece in enumerate(pieces):
            arrangement.append({
                "piece_id": piece.id,
                "position": {
                    "x": random.uniform(-10, 10),
                    "y": random.uniform(-10, 10),
                    "z": random.uniform(-10, 10)
                },
                "rotation": {
                    "x": random.uniform(0, 360),
                    "y": random.uniform(0, 360),
                    "z": random.uniform(0, 360)
                }
            })
        return arrangement

    def _create_heuristic_arrangement(self, pieces: List) -> List[Dict[str, Any]]:
        """Create arrangement using simple heuristics"""
        arrangement = []

        # Sort pieces by size (largest first)
        sorted_pieces = sorted(pieces, key=lambda p: p.shape_features.get("area", 0), reverse=True)

        for i, piece in enumerate(sorted_pieces):
            # Place larger pieces more centrally
            center_bias = 1.0 - (i / len(sorted_pieces))

            arrangement.append({
                "piece_id": piece.id,
                "position": {
                    "x": random.uniform(-5 * center_bias, 5 * center_bias),
                    "y": random.uniform(-5 * center_bias, 5 * center_bias),
                    "z": random.uniform(-2, 2)
                },
                "rotation": {
                    "x": random.uniform(0, 360),
                    "y": random.uniform(0, 360),
                    "z": random.uniform(0, 360)
                }
            })
        return arrangement

    def _calculate_fitness(self, arrangement: List[Dict[str, Any]], pieces: List) -> float:
        """Calculate fitness score for an arrangement"""
        if not arrangement:
            return 0.0

        # Simple fitness function - would need domain-specific improvements
        fitness = 0.0

        # Penalty for pieces being too far apart
        positions = [arr["position"] for arr in arrangement]

        for i in range(len(positions)):
            for j in range(i + 1, len(positions)):
                distance = np.sqrt(
                    (positions[i]["x"] - positions[j]["x"]) ** 2 +
                    (positions[i]["y"] - positions[j]["y"]) ** 2 +
                    (positions[i]["z"] - positions[j]["z"]) ** 2
                )

                # Optimal distance based on piece sizes
                optimal_distance = 2.0  # This would be calculated based on piece dimensions

                # Penalty for being too far or too close
                distance_penalty = abs(distance - optimal_distance)
                fitness -= distance_penalty * 0.1

        # Bonus for compact arrangements
        center_of_mass = self._calculate_center_of_mass(positions)
        compactness_bonus = 100.0 / (1.0 + np.sqrt(
            center_of_mass["x"] ** 2 + center_of_mass["y"] ** 2 + center_of_mass["z"] ** 2
        ))
        fitness += compactness_bonus

        return fitness

    def _calculate_center_of_mass(self, positions: List[Dict[str, float]]) -> Dict[str, float]:
        """Calculate center of mass for positions"""
        if not positions:
            return {"x": 0.0, "y": 0.0, "z": 0.0}

        x_sum = sum(pos["x"] for pos in positions)
        y_sum = sum(pos["y"] for pos in positions)
        z_sum = sum(pos["z"] for pos in positions)

        count = len(positions)

        return {
            "x": x_sum / count,
            "y": y_sum / count,
            "z": z_sum / count
        }

    def _tournament_selection(self, population: List, fitness_scores: List[float]) -> List[Dict[str, Any]]:
        """Tournament selection for genetic algorithm"""
        tournament_size = 3
        indices = random.sample(range(len(population)), min(tournament_size, len(population)))
        best_idx = max(indices, key=lambda i: fitness_scores[i])
        return population[best_idx]

    def _crossover(self, parent1: List[Dict[str, Any]], parent2: List[Dict[str, Any]]) -> tuple:
        """Crossover operation for genetic algorithm"""
        if len(parent1) != len(parent2):
            return parent1.copy(), parent2.copy()

        crossover_point = random.randint(1, len(parent1) - 1)

        child1 = parent1[:crossover_point] + parent2[crossover_point:]
        child2 = parent2[:crossover_point] + parent1[crossover_point:]

        return child1, child2

    def _mutate(self, arrangement: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Mutation operation for genetic algorithm"""
        mutated = arrangement.copy()

        for item in mutated:
            if random.random() < 0.1:  # 10% chance to mutate each piece
                # Small random changes to position and rotation
                item["position"]["x"] += random.uniform(-1, 1)
                item["position"]["y"] += random.uniform(-1, 1)
                item["position"]["z"] += random.uniform(-1, 1)

                item["rotation"]["x"] += random.uniform(-30, 30)
                item["rotation"]["y"] += random.uniform(-30, 30)
                item["rotation"]["z"] += random.uniform(-30, 30)

        return mutated

    def _get_neighbor_solution(self, current_solution: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Generate a neighbor solution for simulated annealing"""
        neighbor = current_solution.copy()

        # Randomly modify one piece's position or rotation
        if neighbor:
            piece_idx = random.randint(0, len(neighbor) - 1)
            modification_type = random.choice(["position", "rotation"])

            if modification_type == "position":
                axis = random.choice(["x", "y", "z"])
                neighbor[piece_idx]["position"][axis] += random.uniform(-2, 2)
            else:
                axis = random.choice(["x", "y", "z"])
                neighbor[piece_idx]["rotation"][axis] += random.uniform(-45, 45)

        return neighbor

    def _calculate_solution_confidence(self, puzzle: Puzzle, solution: Optional[List[Dict[str, Any]]]) -> float:
        """Calculate confidence score for the solution"""
        if not solution:
            return 0.0

        # Simple confidence calculation based on fitness
        fitness = self._calculate_fitness(solution, puzzle.pieces)

        # Normalize to 0-1 range (this would need calibration with real data)
        confidence = min(1.0, max(0.0, (fitness + 100) / 200))

        return confidence

    async def get_solve_status(self, puzzle_id: str) -> Dict[str, Any]:
        """Get the current solving status"""
        is_solving = puzzle_id in self.active_solvers

        return {
            "puzzle_id": puzzle_id,
            "is_solving": is_solving,
            "status": "solving" if is_solving else "idle"
        }

    async def cancel_solve(self, puzzle_id: str) -> bool:
        """Cancel an ongoing solve operation"""
        if puzzle_id in self.active_solvers:
            self.active_solvers.pop(puzzle_id)
            return True
        return False