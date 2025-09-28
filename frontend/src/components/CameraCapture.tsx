import React, { useRef, useState, useCallback } from 'react';
import {
  Box,
  Button,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
} from '@mui/material';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import VideocamIcon from '@mui/icons-material/Videocam';
import StopIcon from '@mui/icons-material/Stop';

interface CameraCaptureProps {
  puzzleId: string;
  onCaptureComplete: (files: File[]) => void;
}

const CameraCapture: React.FC<CameraCaptureProps> = ({
  puzzleId,
  onCaptureComplete,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  const [open, setOpen] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [capturedFiles, setCapturedFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
        audio: false,
      });

      setStream(mediaStream);
      setOpen(true);
      setError(null);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err: any) {
      setError('Failed to access camera. Please ensure camera permissions are granted.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setOpen(false);
    setCapturedFiles([]);
    setIsRecording(false);
  };

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw the current video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert canvas to blob and create file
    canvas.toBlob((blob) => {
      if (blob) {
        const timestamp = Date.now();
        const file = new File([blob], `puzzle_piece_${timestamp}.jpg`, {
          type: 'image/jpeg',
        });

        setCapturedFiles(prev => [...prev, file]);
      }
    }, 'image/jpeg', 0.8);
  }, []);

  const startVideoRecording = useCallback(() => {
    if (!stream) return;

    try {
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9',
      });

      const chunks: Blob[] = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const timestamp = Date.now();
        const file = new File([blob], `puzzle_video_${timestamp}.webm`, {
          type: 'video/webm',
        });

        setCapturedFiles(prev => [...prev, file]);
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
    } catch (err: any) {
      setError('Failed to start video recording.');
    }
  }, [stream]);

  const stopVideoRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, [isRecording]);

  const handleComplete = () => {
    onCaptureComplete(capturedFiles);
    stopCamera();
  };

  return (
    <Box>
      <Button
        variant="outlined"
        startIcon={<CameraAltIcon />}
        onClick={startCamera}
        disabled={!navigator.mediaDevices}
      >
        Open Camera
      </Button>

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      <Dialog
        open={open}
        onClose={stopCamera}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Capture Puzzle Pieces
        </DialogTitle>

        <DialogContent>
          <Box sx={{ position: 'relative', mb: 2 }}>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              style={{
                width: '100%',
                height: 'auto',
                borderRadius: 8,
              }}
            />

            <canvas
              ref={canvasRef}
              style={{ display: 'none' }}
            />
          </Box>

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mb: 2 }}>
            <Button
              variant="contained"
              startIcon={<CameraAltIcon />}
              onClick={capturePhoto}
            >
              Take Photo
            </Button>

            {!isRecording ? (
              <Button
                variant="contained"
                color="secondary"
                startIcon={<VideocamIcon />}
                onClick={startVideoRecording}
              >
                Start Recording
              </Button>
            ) : (
              <Button
                variant="contained"
                color="error"
                startIcon={<StopIcon />}
                onClick={stopVideoRecording}
              >
                Stop Recording
              </Button>
            )}
          </Box>

          {capturedFiles.length > 0 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Captured Files ({capturedFiles.length})
              </Typography>
              {capturedFiles.map((file, index) => (
                <Typography key={index} variant="body2">
                  {file.name} ({(file.size / 1024 / 1024).toFixed(1)} MB)
                </Typography>
              ))}
            </Box>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={stopCamera}>
            Cancel
          </Button>
          <Button
            onClick={handleComplete}
            variant="contained"
            disabled={capturedFiles.length === 0}
          >
            Use Captured Files ({capturedFiles.length})
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CameraCapture;