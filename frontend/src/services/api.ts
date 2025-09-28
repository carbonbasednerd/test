import axios from 'axios';
import { Puzzle, PuzzleUpload, SolverRequest, SolverResponse } from '../types/puzzle';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const puzzleApi = {
  // Puzzle management
  getAllPuzzles: async (): Promise<Puzzle[]> => {
    const response = await api.get('/api/v1/puzzle/');
    return response.data;
  },

  getPuzzle: async (puzzleId: string): Promise<Puzzle> => {
    const response = await api.get(`/api/v1/puzzle/${puzzleId}`);
    return response.data;
  },

  createPuzzle: async (puzzleData: PuzzleUpload): Promise<Puzzle> => {
    const response = await api.post('/api/v1/puzzle/', puzzleData);
    return response.data;
  },

  deletePuzzle: async (puzzleId: string): Promise<void> => {
    await api.delete(`/api/v1/puzzle/${puzzleId}`);
  },

  // File uploads
  uploadImages: async (puzzleId: string, files: File[]): Promise<any> => {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });

    const response = await api.post(`/api/v1/upload/images/${puzzleId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  uploadVideo: async (puzzleId: string, file: File): Promise<any> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post(`/api/v1/upload/video/${puzzleId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Puzzle solving
  solvePuzzle: async (solverRequest: SolverRequest): Promise<SolverResponse> => {
    const response = await api.post('/api/v1/solve/', solverRequest);
    return response.data;
  },

  getSolveStatus: async (puzzleId: string): Promise<any> => {
    const response = await api.get(`/api/v1/solve/status/${puzzleId}`);
    return response.data;
  },

  cancelSolve: async (puzzleId: string): Promise<void> => {
    await api.post(`/api/v1/solve/cancel/${puzzleId}`);
  },
};

export default api;