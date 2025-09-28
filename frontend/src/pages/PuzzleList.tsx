import React, { useState, useEffect } from 'react';
import {
  Grid,
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Fab,
  Box,
  Chip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useNavigate } from 'react-router-dom';
import { puzzleApi } from '../services/api';
import { Puzzle } from '../types/puzzle';

const PuzzleList: React.FC = () => {
  const [puzzles, setPuzzles] = useState<Puzzle[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadPuzzles();
  }, []);

  const loadPuzzles = async () => {
    try {
      const data = await puzzleApi.getAllPuzzles();
      setPuzzles(data);
    } catch (error) {
      console.error('Error loading puzzles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePuzzle = async (puzzleId: string) => {
    try {
      await puzzleApi.deletePuzzle(puzzleId);
      setPuzzles(puzzles.filter(p => p.id !== puzzleId));
    } catch (error) {
      console.error('Error deleting puzzle:', error);
    }
  };

  if (loading) {
    return <Typography>Loading puzzles...</Typography>;
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Your Puzzles
      </Typography>

      <Grid container spacing={3}>
        {puzzles.map((puzzle) => (
          <Grid item xs={12} sm={6} md={4} key={puzzle.id}>
            <Card>
              <CardContent>
                <Typography variant="h6" component="h2" gutterBottom>
                  {puzzle.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Created: {new Date(puzzle.created_at).toLocaleDateString()}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  Pieces: {puzzle.pieces.length}
                </Typography>
                <Chip
                  label={puzzle.solved ? 'Solved' : 'Unsolved'}
                  color={puzzle.solved ? 'success' : 'default'}
                  size="small"
                />
              </CardContent>
              <CardActions>
                <Button
                  size="small"
                  onClick={() => navigate(`/puzzle/${puzzle.id}`)}
                >
                  View Details
                </Button>
                <Button
                  size="small"
                  color="error"
                  onClick={() => handleDeletePuzzle(puzzle.id)}
                >
                  Delete
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {puzzles.length === 0 && (
        <Box textAlign="center" mt={4}>
          <Typography variant="h6" color="text.secondary">
            No puzzles yet. Create your first puzzle!
          </Typography>
        </Box>
      )}

      <Fab
        color="primary"
        aria-label="add"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        onClick={() => navigate('/create')}
      >
        <AddIcon />
      </Fab>
    </Box>
  );
};

export default PuzzleList;