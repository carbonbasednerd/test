from fastapi import APIRouter, File, UploadFile, HTTPException, Form
from typing import List
import uuid
import os
from app.services.image_processor import ImageProcessor
from app.services.puzzle_service import PuzzleService

router = APIRouter()
image_processor = ImageProcessor()
puzzle_service = PuzzleService()

@router.post("/images/{puzzle_id}")
async def upload_puzzle_images(
    puzzle_id: str,
    files: List[UploadFile] = File(...)
):
    """Upload images of puzzle pieces"""
    try:
        # Validate puzzle exists
        puzzle = await puzzle_service.get_puzzle(puzzle_id)
        if not puzzle:
            raise HTTPException(status_code=404, detail="Puzzle not found")

        uploaded_pieces = []

        for file in files:
            # Validate file type
            if not file.content_type.startswith('image/'):
                raise HTTPException(status_code=400, detail=f"File {file.filename} is not an image")

            # Generate unique filename
            file_id = str(uuid.uuid4())
            file_extension = os.path.splitext(file.filename)[1]
            filename = f"{file_id}{file_extension}"

            # Save file
            file_path = f"uploads/{puzzle_id}/{filename}"
            os.makedirs(os.path.dirname(file_path), exist_ok=True)

            with open(file_path, "wb") as buffer:
                content = await file.read()
                buffer.write(content)

            # Process image to extract piece features
            piece_data = await image_processor.process_piece_image(file_path)
            piece_data['id'] = file_id
            piece_data['image_path'] = file_path

            uploaded_pieces.append(piece_data)

        # Add pieces to puzzle
        await puzzle_service.add_pieces_to_puzzle(puzzle_id, uploaded_pieces)

        return {
            "message": f"Successfully uploaded {len(files)} images",
            "pieces": uploaded_pieces
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/video/{puzzle_id}")
async def upload_puzzle_video(
    puzzle_id: str,
    file: UploadFile = File(...)
):
    """Upload video of puzzle pieces for frame extraction"""
    try:
        # Validate puzzle exists
        puzzle = await puzzle_service.get_puzzle(puzzle_id)
        if not puzzle:
            raise HTTPException(status_code=404, detail="Puzzle not found")

        # Validate file type
        if not file.content_type.startswith('video/'):
            raise HTTPException(status_code=400, detail="File is not a video")

        # Save video file
        file_id = str(uuid.uuid4())
        file_extension = os.path.splitext(file.filename)[1]
        filename = f"{file_id}{file_extension}"
        file_path = f"uploads/{puzzle_id}/{filename}"

        os.makedirs(os.path.dirname(file_path), exist_ok=True)

        with open(file_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)

        # Extract frames and process pieces
        pieces = await image_processor.process_video_for_pieces(file_path, puzzle_id)

        # Add pieces to puzzle
        await puzzle_service.add_pieces_to_puzzle(puzzle_id, pieces)

        return {
            "message": f"Successfully processed video and extracted {len(pieces)} pieces",
            "pieces": pieces
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))