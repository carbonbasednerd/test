import React, { useState } from 'react';
import {
  Paper,
  Typography,
  Button,
  Grid,
  FormControlLabel,
  Switch,
} from '@mui/material';
import { NotchPattern, SquarePieceNotches, PuzzlePiece } from '../types/puzzle';

interface SquarePieceEditorProps {
  piece?: PuzzlePiece;
  onSave: (piece: Partial<PuzzlePiece>) => void;
  onCancel: () => void;
}

const SquarePieceEditor: React.FC<SquarePieceEditorProps> = ({
  piece,
  onSave,
  onCancel,
}) => {
  const [notches, setNotches] = useState<SquarePieceNotches>(
    piece?.notches || {
      top: [true, false, true, true, false, true],
      right: [true, false, true, true, false, true],
      bottom: [true, false, true, true, false, true],
      left: [true, false, true, true, false, true],
    }
  );

  const validateNotches = (pattern: NotchPattern): boolean => {
    // Each side must have at least one notch present (true)
    return pattern.some(present => present);
  };

  const isValidPiece = (): boolean => {
    return Object.values(notches).every(pattern => validateNotches(pattern));
  };

  const toggleNotch = (side: keyof SquarePieceNotches, index: number) => {
    const newNotches = { ...notches };
    const newPattern = [...newNotches[side]] as NotchPattern;
    newPattern[index] = !newPattern[index];
    
    // Check if this would leave the side with no present notches
    if (newPattern.every(present => !present)) {
      // Don't allow this change - each side needs at least one present notch
      return;
    }
    
    newNotches[side] = newPattern;
    setNotches(newNotches);
  };

  const renderSideEditor = (side: keyof SquarePieceNotches, label: string) => (
    <div key={side} style={{ marginBottom: '16px' }}>
      <Typography variant="subtitle2" gutterBottom>
        {label}
      </Typography>
      <div style={{ display: 'flex', gap: '4px' }}>
        {notches[side].map((present, index) => (
          <Button
            key={index}
            variant={present ? 'contained' : 'outlined'}
            color={present ? 'primary' : 'secondary'}
            size="small"
            sx={{ 
              minWidth: '40px', 
              height: '40px',
              fontSize: '12px'
            }}
            onClick={() => toggleNotch(side, index)}
          >
            {present ? '■' : '□'}
          </Button>
        ))}
      </div>
      <Typography variant="caption" color="text.secondary">
        ■ = Present, □ = Notched (at least one ■ required)
      </Typography>
    </div>
  );

  const handleSave = () => {
    if (!isValidPiece()) return;
    
    onSave({
      id: piece?.id || crypto.randomUUID(),
      notches,
      size: 100, // Standard size for now
    });
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        {piece ? 'Edit Square Piece' : 'Create Square Piece'}
      </Typography>
      
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Design the notch pattern for each side of the square piece. Each side has 6 positions
        that can be either present (■) or notched out (□). Each side must have at least one
        present position.
      </Typography>

      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          {renderSideEditor('top', 'Top Side')}
          {renderSideEditor('bottom', 'Bottom Side')}
        </Grid>
        <Grid item xs={12} md={6}>
          {renderSideEditor('left', 'Left Side')}
          {renderSideEditor('right', 'Right Side')}
        </Grid>
      </Grid>

      <div style={{ marginTop: '24px', display: 'flex', gap: '16px' }}>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={!isValidPiece()}
        >
          Save Piece
        </Button>
        <Button variant="outlined" onClick={onCancel}>
          Cancel
        </Button>
      </div>

      {!isValidPiece() && (
        <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
          Each side must have at least one present position (■)
        </Typography>
      )}
    </Paper>
  );
};

export default SquarePieceEditor;