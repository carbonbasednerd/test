import React, { useState } from 'react';
import {
  Paper,
  Typography,
  TextField,
  Button,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Alert,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { puzzleApi } from '../services/api';
import FileUpload from '../components/FileUpload';
import CameraCapture from '../components/CameraCapture';

const CreatePuzzle: React.FC = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [puzzleName, setPuzzleName] = useState('');
  const [puzzleDescription, setPuzzleDescription] = useState('');
  const [createdPuzzle, setCreatedPuzzle] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCreatePuzzle = async () => {
    if (!puzzleName.trim()) {
      setError('Puzzle name is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const puzzle = await puzzleApi.createPuzzle({
        name: puzzleName.trim(),
        description: puzzleDescription.trim() || undefined,
      });

      setCreatedPuzzle(puzzle);
      setActiveStep(1);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create puzzle');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadComplete = () => {
    setActiveStep(2);
  };

  const handleCameraCapture = async (files: File[]) => {
    if (!createdPuzzle || files.length === 0) return;

    try {
      // Convert camera files to regular upload
      await puzzleApi.uploadImages(createdPuzzle.id, files);
      handleUploadComplete();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to upload captured files');
    }
  };

  const handleFinish = () => {
    navigate(`/puzzle/${createdPuzzle.id}`);
  };

  return (
    <div>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate('/')}
        sx={{ mb: 2 }}
      >
        Back to Puzzles
      </Button>

      <Typography variant="h4" component="h1" gutterBottom>
        Create New Puzzle
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 3 }}>
        <Stepper activeStep={activeStep} orientation="vertical">
          <Step>
            <StepLabel>Create Puzzle</StepLabel>
            <StepContent>
              <div style={{ marginBottom: '16px' }}>
                <TextField
                  fullWidth
                  label="Puzzle Name"
                  value={puzzleName}
                  onChange={(e) => setPuzzleName(e.target.value)}
                  required
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  label="Description (optional)"
                  value={puzzleDescription}
                  onChange={(e) => setPuzzleDescription(e.target.value)}
                  multiline
                  rows={3}
                />
              </div>
              <div style={{ marginBottom: '8px' }}>
                <Button
                  variant="contained"
                  onClick={handleCreatePuzzle}
                  disabled={loading || !puzzleName.trim()}
                  sx={{ mr: 1 }}
                >
                  {loading ? 'Creating...' : 'Create Puzzle'}
                </Button>
              </div>
            </StepContent>
          </Step>

          <Step>
            <StepLabel>Upload Pieces</StepLabel>
            <StepContent>
              <Typography variant="body1" gutterBottom>
                Upload images or videos of your puzzle pieces. You can use multiple methods:
              </Typography>

              <div style={{ marginTop: '24px', marginBottom: '24px' }}>
                <Typography variant="h6" gutterBottom>
                  Method 1: File Upload
                </Typography>
                {createdPuzzle && (
                  <FileUpload
                    puzzleId={createdPuzzle.id}
                    onUploadComplete={handleUploadComplete}
                    acceptVideo={true}
                  />
                )}
              </div>

              <div style={{ marginTop: '24px', marginBottom: '24px' }}>
                <Typography variant="h6" gutterBottom>
                  Method 2: Camera Capture
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Use your device's camera to take photos or record videos of the puzzle pieces.
                </Typography>
                <CameraCapture
                  puzzleId={createdPuzzle?.id || ''}
                  onCaptureComplete={handleCameraCapture}
                />
              </div>

              <div style={{ marginTop: '16px' }}>
                <Button
                  variant="outlined"
                  onClick={() => setActiveStep(2)}
                  sx={{ mr: 1 }}
                >
                  Skip for Now
                </Button>
              </div>
            </StepContent>
          </Step>

          <Step>
            <StepLabel>Complete Setup</StepLabel>
            <StepContent>
              <Typography variant="body1" gutterBottom>
                Your puzzle has been created successfully! You can now:
              </Typography>

              <ul style={{ marginTop: '16px', marginBottom: '16px' }}>
                <li>Add more pieces by uploading additional images or videos</li>
                <li>View the 3D visualization of your puzzle pieces</li>
                <li>Start the AI solving process</li>
                <li>Monitor the solving progress</li>
              </ul>

              <div style={{ marginTop: '16px' }}>
                <Button
                  variant="contained"
                  onClick={handleFinish}
                  sx={{ mr: 1 }}
                >
                  View Puzzle
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/')}
                >
                  Back to List
                </Button>
              </div>
            </StepContent>
          </Step>
        </Stepper>
      </Paper>
    </div>
  );
};

export default CreatePuzzle;