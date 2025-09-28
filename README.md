# 3D Puzzle Solver

An AI-powered web application for solving three-dimensional puzzles using computer vision and machine learning algorithms.

## Features

- **3D Puzzle Visualization**: Interactive Three.js-based 3D viewer for puzzle pieces
- **Multiple Input Methods**:
  - File upload (images and videos)
  - Real-time camera capture
  - Drag & drop interface
- **AI Solving Algorithms**:
  - Genetic Algorithm
  - Simulated Annealing
  - Reinforcement Learning (Q-learning)
- **Computer Vision**: Automatic piece detection and feature extraction
- **Real-time Processing**: Background processing with progress tracking

## Technology Stack

### Backend
- **FastAPI**: Modern Python web framework
- **OpenCV**: Computer vision and image processing
- **NumPy/SciPy**: Scientific computing
- **Redis**: In-memory data storage
- **Scikit-image**: Advanced image processing

### Frontend
- **React 18**: Modern React with TypeScript
- **Three.js**: 3D graphics and visualization
- **Material-UI**: React component library
- **React Three Fiber**: React renderer for Three.js
- **Axios**: HTTP client

### Infrastructure
- **Docker**: Containerization
- **Docker Compose**: Multi-container orchestration

## Getting Started

### Prerequisites

- Docker and Docker Compose
- Node.js 18+ (for local development)
- Python 3.11+ (for local development)

### Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd puzzle-solver
   ```

2. **Start the application**
   ```bash
   docker-compose up --build
   ```

3. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

### Development Setup

#### Backend Development
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\\Scripts\\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

#### Frontend Development
```bash
cd frontend
npm install
npm start
```

## Usage Guide

### 1. Create a New Puzzle
- Click the "+" button on the main page
- Enter a name for your puzzle
- Optionally add a description

### 2. Add Puzzle Pieces
Choose from multiple input methods:

**File Upload:**
- Drag and drop image files (JPEG, PNG, GIF)
- Upload video files (MP4, MOV, AVI, MKV) for automatic frame extraction

**Camera Capture:**
- Click "Open Camera" to use your device's camera
- Take individual photos of puzzle pieces
- Record videos showing multiple pieces

### 3. View 3D Visualization
- Interactive 3D viewer with orbit controls
- Piece information display
- Color-coded pieces based on extracted features
- Corner detection visualization (yellow dots)

### 4. Solve the Puzzle
- Choose from multiple AI algorithms
- Configure algorithm parameters
- Monitor solving progress in real-time
- View the solved arrangement in 3D

## API Endpoints

### Puzzle Management
- `GET /api/v1/puzzle/` - Get all puzzles
- `POST /api/v1/puzzle/` - Create new puzzle
- `GET /api/v1/puzzle/{id}` - Get specific puzzle
- `DELETE /api/v1/puzzle/{id}` - Delete puzzle

### File Upload
- `POST /api/v1/upload/images/{puzzle_id}` - Upload images
- `POST /api/v1/upload/video/{puzzle_id}` - Upload video

### Puzzle Solving
- `POST /api/v1/solve/` - Start solving puzzle
- `GET /api/v1/solve/status/{puzzle_id}` - Get solve status
- `POST /api/v1/solve/cancel/{puzzle_id}` - Cancel solving

## Image Processing Pipeline

1. **Image Preprocessing**
   - Gaussian blur for noise reduction
   - Edge detection using Canny algorithm
   - Contour detection for piece isolation

2. **Feature Extraction**
   - 3D dimension estimation from 2D images
   - Color profile analysis (RGB values)
   - Shape complexity metrics
   - Corner detection and counting

3. **Piece Classification**
   - Size-based sorting
   - Shape complexity analysis
   - Color clustering

## AI Solving Algorithms

### Genetic Algorithm
- Population-based optimization
- Crossover and mutation operations
- Fitness function based on piece compatibility
- Elite selection for best solutions

### Simulated Annealing
- Temperature-based acceptance probability
- Gradual cooling schedule
- Neighbor solution generation
- Local optima avoidance

### Reinforcement Learning
- Q-learning approach
- State representation using piece positions
- Reward function based on puzzle completion
- Action space for piece movement and rotation

## Configuration

### Environment Variables
- `REACT_APP_API_URL`: Backend API URL (default: http://localhost:8000)
- `ENVIRONMENT`: Backend environment (development/production)

### Algorithm Parameters
- **Max Iterations**: Maximum solving iterations (100-10000)
- **Population Size**: For genetic algorithm (20-100)
- **Mutation Rate**: For genetic algorithm (0.01-0.5)
- **Initial Temperature**: For simulated annealing (50-500)
- **Cooling Rate**: For simulated annealing (0.9-0.999)

## Project Structure

```
├── backend/
│   ├── app/
│   │   ├── api/routes/          # API route handlers
│   │   ├── models/              # Pydantic models
│   │   ├── services/            # Business logic
│   │   └── main.py              # FastAPI application
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/          # React components
│   │   ├── pages/               # Page components
│   │   ├── services/            # API services
│   │   ├── types/               # TypeScript types
│   │   └── App.tsx              # Main React component
│   ├── package.json
│   └── Dockerfile
├── shared/                      # Shared utilities
├── docker-compose.yml
└── README.md
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Troubleshooting

### Common Issues

**Camera not working:**
- Ensure HTTPS is enabled (required for camera access)
- Check browser permissions for camera access
- Try a different browser (Chrome/Firefox recommended)

**Upload failing:**
- Check file formats are supported
- Ensure files are not corrupted
- Verify backend container is running

**Solving takes too long:**
- Reduce max iterations
- Try a different algorithm
- Check number of puzzle pieces (complexity increases exponentially)

### Performance Optimization

- **Large Puzzles**: Use genetic algorithm with lower population size
- **Complex Pieces**: Increase max iterations for better results
- **Memory Usage**: Restart containers if memory usage is high

## Future Enhancements

- [ ] Machine learning model training on puzzle datasets
- [ ] Support for different puzzle types (jigsaw, mechanical, etc.)
- [ ] Multiplayer collaborative solving
- [ ] Advanced computer vision with deep learning
- [ ] Mobile app development
- [ ] Cloud deployment with scaling
- [ ] Integration with 3D printing for physical puzzle creation

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Three.js community for 3D rendering capabilities
- OpenCV contributors for computer vision tools
- React and FastAPI communities for excellent documentation