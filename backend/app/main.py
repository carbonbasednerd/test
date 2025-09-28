from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import puzzle, upload, solve

app = FastAPI(
    title="3D Puzzle Solver API",
    description="API for AI-powered 3D puzzle solving",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(puzzle.router, prefix="/api/v1/puzzle", tags=["puzzle"])
app.include_router(upload.router, prefix="/api/v1/upload", tags=["upload"])
app.include_router(solve.router, prefix="/api/v1/solve", tags=["solve"])

@app.get("/")
async def root():
    return {"message": "3D Puzzle Solver API", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}