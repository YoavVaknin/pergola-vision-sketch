import { Point, FrameElement, ShadingConfig } from '@/types/pergola';
import { DrawnPath } from '@/hooks/useFreeDrawing';
import { generate3DModelFromDrawing, Model3D } from './3dModelGenerator';

/**
 * Convert free drawing paths to pergola frame elements for 3D generation
 */
export const convertPathsToFrameElements = (
  paths: DrawnPath[],
  pixelsPerCm: number
): FrameElement[] => {
  const frameElements: FrameElement[] = [];
  
  paths.forEach((path, index) => {
    if (path.points.length < 2) return;
    
    // Convert each path to a frame element
    const frameElement: FrameElement = {
      id: `frame_from_path_${path.id}`,
      type: 'frame',
      points: [...path.points],
      color: path.color || '#2563eb',
      closed: path.isClosed || false,
      measurements: {
        segmentLengths: [],
        area: 0,
        angles: []
      }
    };
    
    frameElements.push(frameElement);
  });
  
  return frameElements;
};

/**
 * Generate 3D model directly from drawn paths
 */
export const generate3DModelFromPaths = (
  paths: DrawnPath[],
  pixelsPerCm: number,
  frameColor: string,
  shadingConfig: ShadingConfig
): Model3D => {
  if (paths.length === 0) {
    throw new Error('אין נתיבים מצוירים ליצירת מודל תלת-ממדי');
  }
  
  // Convert paths to frame elements
  const frameElements = convertPathsToFrameElements(paths, pixelsPerCm);
  
  // Create drawing data object
  const drawingData = {
    elements: frameElements,
    pixelsPerCm,
    frameColor,
    shadingConfig
  };
  
  console.log('🎨 Converting drawn paths to 3D model:', {
    pathCount: paths.length,
    frameElements: frameElements.length,
    pixelsPerCm,
    frameColor
  });
  
  // Generate 3D model from converted elements
  return generate3DModelFromDrawing(drawingData);
};

/**
 * Extract outline points from all paths for pergola boundary
 */
export const extractPergolaOutline = (paths: DrawnPath[]): Point[] => {
  if (paths.length === 0) return [];
  
  // Find the largest closed path as the main outline
  const closedPaths = paths.filter(path => path.isClosed);
  if (closedPaths.length > 0) {
    // Sort by number of points (assuming larger path is the main outline)
    closedPaths.sort((a, b) => b.points.length - a.points.length);
    return closedPaths[0].points;
  }
  
  // If no closed paths, try to connect all paths to form an outline
  // This is a simple approach - in practice, you might need more sophisticated logic
  const allPoints: Point[] = [];
  paths.forEach(path => {
    allPoints.push(...path.points);
  });
  
  // Return convex hull or simplified outline
  return simplifyOutline(allPoints);
};

/**
 * Simplify an outline by removing unnecessary points
 */
const simplifyOutline = (points: Point[], tolerance: number = 10): Point[] => {
  if (points.length <= 3) return points;
  
  // Simple implementation - remove points that are too close to each other
  const simplified: Point[] = [points[0]];
  
  for (let i = 1; i < points.length; i++) {
    const prev = simplified[simplified.length - 1];
    const curr = points[i];
    const distance = Math.sqrt(
      Math.pow(curr.x - prev.x, 2) + Math.pow(curr.y - prev.y, 2)
    );
    
    if (distance > tolerance) {
      simplified.push(curr);
    }
  }
  
  return simplified;
};

/**
 * Validate that paths can form a valid pergola structure
 */
export const validatePathsForPergola = (paths: DrawnPath[]): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} => {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  if (paths.length === 0) {
    errors.push('אין נתיבים מצוירים');
    return { isValid: false, errors, warnings };
  }
  
  // Check if at least one path has enough points
  const validPaths = paths.filter(path => path.points.length >= 3);
  if (validPaths.length === 0) {
    errors.push('אין נתיב עם מספיק נקודות (לפחות 3) ליצירת פרגולה');
  }
  
  // Check for closed paths
  const closedPaths = paths.filter(path => path.isClosed);
  if (closedPaths.length === 0) {
    warnings.push('אין נתיבים סגורים - הפרגולה עלולה להיות לא שלמה');
  }
  
  // Check path complexity
  paths.forEach((path, index) => {
    if (path.points.length > 50) {
      warnings.push(`נתיב ${index + 1} מורכב מדי (${path.points.length} נקודות) - עלול להאט את היצירה`);
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};