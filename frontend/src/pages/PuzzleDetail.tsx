import React, { useState, useEffect, useCallback } from 'react';
import {
  Typography,
  Button,
  Paper,
  Grid,
  Card,
  CardContent,
  Chip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  LinearProgress,
  Tabs,
  Tab,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import { useParams, useNavigate } from 'react-router-dom';
import { puzzleApi } from '../services/api';
import { Puzzle, SolverRequest } from '../types/puzzle';
import PuzzleViewer3D from '../components/PuzzleViewer3D';
import FileUpload from '../components/FileUpload';
import CameraCapture from '../components/CameraCapture';
import SquarePieceEditor from '../components/SquarePieceEditor';
import SquarePieceViewer3D from '../components/SquarePieceViewer3D';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
  <div hidden={value !== index}>
    {value === index && <div style={{ paddingTop: '24px' }}>{children}</div>}
  </div>
);

const PuzzleDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [puzzle, setPuzzle] = useState<Puzzle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [solveDialogOpen, setSolveDialogOpen] = useState(false);
  const [solving, setSolving] = useState(false);
  const [solveProgress, setSolveProgress] = useState(0);
  const [tabValue, setTabValue] = useState(0);
  const [showSquareEditor, setShowSquareEditor] = useState(false);

  // Solver settings
  const [algorithm, setAlgorithm] = useState<'genetic' | 'simulated_annealing' | 'reinforcement_learning'>('genetic');
  const [maxIterations, setMaxIterations] = useState(1000);

  const loadPuzzle = useCallback(async () => {
    if (!id) return;

    try {
      const data = await puzzleApi.getPuzzle(id);
      setPuzzle(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load puzzle');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      loadPuzzle();
    }
  }, [id, loadPuzzle]);

  const handleSolvePuzzle = async () => {
    if (!puzzle) return;

    setSolving(true);
    setSolveProgress(0);
    setSolveDialogOpen(false);

    try {
      const request: SolverRequest = {
        puzzle_id: puzzle.id,
        algorithm,
        max_iterations: maxIterations,
      };

      // Start solving
      const result = await puzzleApi.solvePuzzle(request);

      // Simulate progress updates (in a real app, you'd poll the status endpoint)
      const progressInterval = setInterval(() => {
        setSolveProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 100;
          }
          return prev + Math.random() * 10;
        });
      }, 500);

      // Update puzzle with solution
      if (result.solved) {
        const updatedPuzzle = { ...puzzle, solved: true, solution: result.solution };
        setPuzzle(updatedPuzzle);
      }

      setTimeout(() => {
        setSolving(false);
        setSolveProgress(0);
        clearInterval(progressInterval);
      }, 3000);

    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to solve puzzle');
      setSolving(false);
      setSolveProgress(0);
    }
  };

  const handleCancelSolve = async () => {
    if (!puzzle) return;

    try {
      await puzzleApi.cancelSolve(puzzle.id);
      setSolving(false);
      setSolveProgress(0);
    } catch (err: any) {
      console.error('Failed to cancel solve:', err);
    }
  };

  const handleUploadComplete = () => {
    loadPuzzle(); // Reload to get updated pieces
  };

  const handleCameraCapture = async (files: File[]) => {
    if (!puzzle || files.length === 0) return;

    try {
      await puzzleApi.uploadImages(puzzle.id, files);
      loadPuzzle();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to upload captured files');
    }
  };

  const handleSaveSquarePiece = (pieceData: any) => {
    // For now, add to local state - later integrate with backend
    const newPiece = {
      ...pieceData,
      id: crypto.randomUUID(),
    };
    
    setPuzzle(prev => prev ? {
      ...prev,
      pieces: [...prev.pieces, newPiece]
    } : null);
    
    setShowSquareEditor(false);
  };

  if (loading) {
    return <Typography>Loading puzzle...</Typography>;
  }

  if (error || !puzzle) {
    return (
      <div>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/')}
          sx={{ mb: 2 }}
        >
          Back to Puzzles
        </Button>
        <Alert severity="error">
          {error || 'Puzzle not found'}
        </Alert>
      </div>
    );
  }

  return (
    <div>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate('/')}
        sx={{ mb: 2 }}
      >
        Back to Puzzles
      </Button>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <Typography variant="h4" component="h1">
          {puzzle.name}
        </Typography>

        <div style={{ display: 'flex', gap: '16px' }}>
          {!solving ? (
            <Button
              variant="contained"
              startIcon={<PlayArrowIcon />}
              onClick={() => setSolveDialogOpen(true)}
              disabled={puzzle.pieces.length === 0}
            >
              Solve Puzzle
            </Button>
          ) : (
            <Button
              variant="contained"
              color="error"
              startIcon={<StopIcon />}
              onClick={handleCancelSolve}
            >
              Cancel Solving
            </Button>
          )}
        </div>
      </div>

      {solving && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Solving puzzle using {algorithm} algorithm...
          </Typography>
          <LinearProgress variant="determinate" value={solveProgress} />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Progress: {Math.round(solveProgress)}%
          </Typography>
        </Paper>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <div style={{ borderBottom: '1px solid #e0e0e0', marginBottom: '16px' }}>
            <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
              <Tab label="3D Viewer" />
              <Tab label="Square Pieces" />
              <Tab label="Add Image Pieces" />
            </Tabs>
          </div>

          <TabPanel value={tabValue} index={0}>
            <PuzzleViewer3D puzzle={puzzle} showSolution={puzzle.solved} />
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <Paper sx={{ p: 3 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <Typography variant="h6">
                  Square Puzzle Pieces
                </Typography>
                <Button
                  variant="contained"
                  onClick={() => setShowSquareEditor(true)}
                >
                  Add Square Piece
                </Button>
              </div>

              <SquarePieceViewer3D pieces={puzzle.pieces} />

              {showSquareEditor && (
                <div style={{ marginTop: '24px' }}>
                  <SquarePieceEditor
                    onSave={handleSaveSquarePiece}
                    onCancel={() => setShowSquareEditor(false)}
                  />
                </div>
              )}
            </Paper>
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Add Image-Based Pieces
              </Typography>

              <div style={{ marginBottom: '32px' }}>
                <Typography variant="subtitle1" gutterBottom>
                  Upload Files
                </Typography>
                <FileUpload
                  puzzleId={puzzle.id}
                  onUploadComplete={handleUploadComplete}
                  acceptVideo={true}
                />
              </div>

              <div>
                <Typography variant="subtitle1" gutterBottom>
                  Camera Capture
                </Typography>
                <CameraCapture
                  puzzleId={puzzle.id}
                  onCaptureComplete={handleCameraCapture}
                />
              </div>
            </Paper>
          </TabPanel>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Puzzle Information
            </Typography>

            <div style={{ marginBottom: '16px' }}>
              <Typography variant="body2" color="text.secondary">
                Status
              </Typography>
              <Chip
                label={puzzle.solved ? 'Solved' : 'Unsolved'}
                color={puzzle.solved ? 'success' : 'default'}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <Typography variant="body2" color="text.secondary">
                Pieces Count
              </Typography>
              <Typography variant="h4">
                {puzzle.pieces.length}
              </Typography>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <Typography variant="body2" color="text.secondary">
                Created
              </Typography>
              <Typography variant="body1">
                {new Date(puzzle.created_at).toLocaleDateString()}
              </Typography>
            </div>

            {puzzle.solution && (
              <div>
                <Typography variant="body2" color="text.secondary">
                  Solution Confidence
                </Typography>
                <Typography variant="body1">
                  {/* This would come from the solver response */}
                  85%
                </Typography>
              </div>
            )}
          </Paper>

          {puzzle.pieces.length > 0 && (
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Piece Details
              </Typography>

              <div style={{ maxHeight: '300px', overflow: 'auto' }}>
                {puzzle.pieces.map((piece, index) => (
                  <Card key={piece.id} sx={{ mb: 1 }}>
                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                      <Typography variant="body2" gutterBottom>
                        Piece {index + 1}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Dimensions: {piece.dimensions.x.toFixed(1)} ×{' '}
                        {piece.dimensions.y.toFixed(1)} ×{' '}
                        {piece.dimensions.z.toFixed(1)}
                      </Typography>
                      <br />
                      <Typography variant="caption" color="text.secondary">
                        Corners: {piece.shape_features.corners}
                      </Typography>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </Paper>
          )}
        </Grid>
      </Grid>

      {/* Solve Dialog */}
      <Dialog open={solveDialogOpen} onClose={() => setSolveDialogOpen(false)}>
        <DialogTitle>Solve Puzzle</DialogTitle>
        <DialogContent>
          <div style={{ minWidth: '300px', paddingTop: '8px' }}>
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Algorithm</InputLabel>
              <Select
                value={algorithm}
                label="Algorithm"
                onChange={(e) => setAlgorithm(e.target.value as any)}
              >
                <MenuItem value="genetic">Genetic Algorithm</MenuItem>
                <MenuItem value="simulated_annealing">Simulated Annealing</MenuItem>
                <MenuItem value="reinforcement_learning">Reinforcement Learning</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Max Iterations"
              type="number"
              value={maxIterations}
              onChange={(e) => setMaxIterations(parseInt(e.target.value) || 1000)}
              inputProps={{ min: 100, max: 10000, step: 100 }}
            />

            <Alert severity="info" sx={{ mt: 2 }}>
              The AI will analyze your puzzle pieces and attempt to find the optimal arrangement.
              This process may take several minutes depending on the complexity.
            </Alert>
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSolveDialogOpen(false)}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleSolvePuzzle}>
            Start Solving
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default PuzzleDetail;