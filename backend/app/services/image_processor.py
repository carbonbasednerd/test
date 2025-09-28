import cv2
import numpy as np
from typing import Dict, List, Any
import uuid
import os
from skimage import measure, morphology
from scipy import ndimage

class ImageProcessor:
    def __init__(self):
        pass

    async def process_piece_image(self, image_path: str) -> Dict[str, Any]:
        """Process a single piece image to extract features"""
        try:
            # Load image
            image = cv2.imread(image_path)
            if image is None:
                raise ValueError(f"Could not load image: {image_path}")

            # Convert to different color spaces for analysis
            rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
            gray_image = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            hsv_image = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)

            # Extract basic features
            dimensions = self._estimate_3d_dimensions(gray_image)
            color_profile = self._extract_color_profile(rgb_image)
            shape_features = self._extract_shape_features(gray_image)

            return {
                "dimensions": dimensions,
                "color_profile": color_profile,
                "shape_features": shape_features
            }

        except Exception as e:
            raise Exception(f"Error processing image {image_path}: {str(e)}")

    async def process_video_for_pieces(self, video_path: str, puzzle_id: str) -> List[Dict[str, Any]]:
        """Extract frames from video and identify individual pieces"""
        try:
            cap = cv2.VideoCapture(video_path)
            pieces = []
            frame_count = 0

            while True:
                ret, frame = cap.read()
                if not ret:
                    break

                # Process every 30th frame to avoid duplicates
                if frame_count % 30 == 0:
                    detected_pieces = await self._detect_pieces_in_frame(frame, puzzle_id, frame_count)
                    pieces.extend(detected_pieces)

                frame_count += 1

            cap.release()
            return pieces

        except Exception as e:
            raise Exception(f"Error processing video {video_path}: {str(e)}")

    async def _detect_pieces_in_frame(self, frame: np.ndarray, puzzle_id: str, frame_num: int) -> List[Dict[str, Any]]:
        """Detect individual puzzle pieces in a video frame"""
        try:
            # Convert to grayscale for edge detection
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

            # Apply Gaussian blur to reduce noise
            blurred = cv2.GaussianBlur(gray, (5, 5), 0)

            # Edge detection
            edges = cv2.Canny(blurred, 50, 150)

            # Find contours
            contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

            pieces = []
            for i, contour in enumerate(contours):
                # Filter out small contours
                area = cv2.contourArea(contour)
                if area < 1000:  # Minimum area threshold
                    continue

                # Extract piece region
                x, y, w, h = cv2.boundingRect(contour)
                piece_region = frame[y:y+h, x:x+w]

                # Save piece image
                piece_id = str(uuid.uuid4())
                piece_filename = f"frame_{frame_num}_piece_{i}.jpg"
                piece_path = f"uploads/{puzzle_id}/extracted/{piece_filename}"

                os.makedirs(os.path.dirname(piece_path), exist_ok=True)
                cv2.imwrite(piece_path, piece_region)

                # Process the extracted piece
                piece_data = await self.process_piece_image(piece_path)
                piece_data['id'] = piece_id
                piece_data['image_path'] = piece_path

                pieces.append(piece_data)

            return pieces

        except Exception as e:
            raise Exception(f"Error detecting pieces in frame: {str(e)}")

    def _estimate_3d_dimensions(self, gray_image: np.ndarray) -> Dict[str, float]:
        """Estimate 3D dimensions from 2D image"""
        # Find contours to get the piece outline
        contours, _ = cv2.findContours(gray_image, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        if not contours:
            return {"x": 0.0, "y": 0.0, "z": 1.0}  # Default dimensions

        # Get the largest contour (assumed to be the piece)
        largest_contour = max(contours, key=cv2.contourArea)

        # Get bounding box
        x, y, w, h = cv2.boundingRect(largest_contour)

        # Estimate depth based on image brightness variations (primitive approach)
        roi = gray_image[y:y+h, x:x+w]
        depth_estimate = np.std(roi) / 255.0  # Normalized standard deviation as depth indicator

        return {
            "x": float(w),
            "y": float(h),
            "z": float(depth_estimate * 10)  # Scale depth estimate
        }

    def _extract_color_profile(self, rgb_image: np.ndarray) -> List[int]:
        """Extract dominant colors from the image"""
        # Reshape image to be a list of pixels
        pixels = rgb_image.reshape(-1, 3)

        # Calculate mean color
        mean_color = np.mean(pixels, axis=0)

        return mean_color.astype(int).tolist()

    def _extract_shape_features(self, gray_image: np.ndarray) -> Dict[str, Any]:
        """Extract shape-based features"""
        # Find contours
        contours, _ = cv2.findContours(gray_image, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        if not contours:
            return {"area": 0, "perimeter": 0, "complexity": 0}

        # Get the largest contour
        largest_contour = max(contours, key=cv2.contourArea)

        # Calculate features
        area = cv2.contourArea(largest_contour)
        perimeter = cv2.arcLength(largest_contour, True)

        # Shape complexity (ratio of perimeter to area)
        complexity = perimeter / (area + 1e-6)  # Add small value to avoid division by zero

        return {
            "area": float(area),
            "perimeter": float(perimeter),
            "complexity": float(complexity),
            "corners": self._detect_corners(largest_contour)
        }

    def _detect_corners(self, contour: np.ndarray) -> int:
        """Detect number of corners/vertices in the contour"""
        # Approximate contour to polygon
        epsilon = 0.02 * cv2.arcLength(contour, True)
        approx = cv2.approxPolyDP(contour, epsilon, True)

        return len(approx)