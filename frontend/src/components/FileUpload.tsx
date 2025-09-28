import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Box,
  Typography,
  Button,
  LinearProgress,
  Alert,
  Grid,
  Card,
  CardMedia,
  CardContent,
  IconButton,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import VideoFileIcon from '@mui/icons-material/VideoFile';

interface FileUploadProps {
  puzzleId: string;
  onUploadComplete: () => void;
  acceptVideo?: boolean;
}

interface UploadFile extends File {
  preview?: string;
}

const FileUpload: React.FC<FileUploadProps> = ({
  puzzleId,
  onUploadComplete,
  acceptVideo = false,
}) => {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map(file => {
      const uploadFile = file as UploadFile;

      // Create preview for images
      if (file.type.startsWith('image/')) {
        uploadFile.preview = URL.createObjectURL(file);
      }

      return uploadFile;
    });

    setFiles(prev => [...prev, ...newFiles]);
    setError(null);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptVideo
      ? {
          'image/*': ['.jpeg', '.jpg', '.png', '.gif'],
          'video/*': ['.mp4', '.mov', '.avi', '.mkv']
        }
      : {
          'image/*': ['.jpeg', '.jpg', '.png', '.gif']
        },
    multiple: true,
  });

  const removeFile = (index: number) => {
    setFiles(prev => {
      const newFiles = [...prev];
      if (newFiles[index].preview) {
        URL.revokeObjectURL(newFiles[index].preview!);
      }
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  const handleUpload = async () => {
    if (files.length === 0) return;

    setUploading(true);
    setUploadProgress(0);
    setError(null);

    try {
      // Separate images and videos
      const imageFiles = files.filter(file => file.type.startsWith('image/'));
      const videoFiles = files.filter(file => file.type.startsWith('video/'));

      let completedUploads = 0;
      const totalUploads = imageFiles.length + videoFiles.length;

      // Upload images
      if (imageFiles.length > 0) {
        const { puzzleApi } = await import('../services/api');
        await puzzleApi.uploadImages(puzzleId, imageFiles);
        completedUploads += imageFiles.length;
        setUploadProgress((completedUploads / totalUploads) * 100);
      }

      // Upload videos one by one
      for (const videoFile of videoFiles) {
        const { puzzleApi } = await import('../services/api');
        await puzzleApi.uploadVideo(puzzleId, videoFile);
        completedUploads += 1;
        setUploadProgress((completedUploads / totalUploads) * 100);
      }

      // Clean up previews
      files.forEach(file => {
        if (file.preview) {
          URL.revokeObjectURL(file.preview);
        }
      });

      setFiles([]);
      onUploadComplete();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <Box>
      <Box
        {...getRootProps()}
        sx={{
          border: '2px dashed',
          borderColor: isDragActive ? 'primary.main' : 'grey.400',
          borderRadius: 2,
          p: 4,
          textAlign: 'center',
          cursor: 'pointer',
          backgroundColor: isDragActive ? 'action.hover' : 'transparent',
          transition: 'all 0.2s ease-in-out',
        }}
      >
        <input {...getInputProps()} />
        <CloudUploadIcon sx={{ fontSize: 48, color: 'grey.400', mb: 2 }} />
        <Typography variant="h6" gutterBottom>
          {isDragActive
            ? 'Drop the files here...'
            : 'Drag & drop files here, or click to select'}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {acceptVideo
            ? 'Supports images (JPEG, PNG, GIF) and videos (MP4, MOV, AVI, MKV)'
            : 'Supports images (JPEG, PNG, GIF)'}
        </Typography>
      </Box>

      {files.length > 0 && (
        <Box mt={3}>
          <Typography variant="h6" gutterBottom>
            Selected Files ({files.length})
          </Typography>

          <Grid container spacing={2}>
            {files.map((file, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Card>
                  {file.type.startsWith('image/') ? (
                    <CardMedia
                      component="img"
                      height="120"
                      image={file.preview}
                      alt={file.name}
                      sx={{ objectFit: 'cover' }}
                    />
                  ) : (
                    <Box
                      sx={{
                        height: 120,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: 'grey.100',
                      }}
                    >
                      <VideoFileIcon sx={{ fontSize: 48, color: 'grey.500' }} />
                    </Box>
                  )}
                  <CardContent sx={{ p: 1 }}>
                    <Typography variant="body2" noWrap title={file.name}>
                      {file.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {(file.size / 1024 / 1024).toFixed(1)} MB
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={() => removeFile(index)}
                      sx={{ float: 'right' }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          <Box mt={2}>
            <Button
              variant="contained"
              onClick={handleUpload}
              disabled={uploading}
              startIcon={<CloudUploadIcon />}
            >
              {uploading ? 'Uploading...' : 'Upload Files'}
            </Button>
          </Box>
        </Box>
      )}

      {uploading && (
        <Box mt={2}>
          <LinearProgress variant="determinate" value={uploadProgress} />
          <Typography variant="body2" color="text.secondary" mt={1}>
            {Math.round(uploadProgress)}% uploaded
          </Typography>
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
    </Box>
  );
};

export default FileUpload;