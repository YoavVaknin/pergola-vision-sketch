import { useState, useCallback } from 'react';
import { Point } from '@/types/pergola';

export interface DrawnPath {
  id: string;
  points: Point[];
  isClosed: boolean;
  color: string;
  strokeWidth: number;
}

export interface FreeDrawingState {
  isDrawing: boolean;
  currentPath: Point[];
  drawnPaths: DrawnPath[];
  activePathId: string | null;
}

export const useFreeDrawing = () => {
  const [drawingState, setDrawingState] = useState<FreeDrawingState>({
    isDrawing: false,
    currentPath: [],
    drawnPaths: [],
    activePathId: null
  });

  const startDrawing = useCallback((startPoint: Point) => {
    const pathId = `path_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setDrawingState(prev => ({
      ...prev,
      isDrawing: true,
      currentPath: [startPoint],
      activePathId: pathId
    }));
  }, []);

  const addPointToPath = useCallback((point: Point) => {
    setDrawingState(prev => {
      if (!prev.isDrawing) return prev;
      return {
        ...prev,
        currentPath: [...prev.currentPath, point]
      };
    });
  }, []);

  const finishPath = useCallback((shouldClose: boolean = false) => {
    setDrawingState(prev => {
      if (!prev.isDrawing || prev.currentPath.length < 2) {
        return {
          ...prev,
          isDrawing: false,
          currentPath: [],
          activePathId: null
        };
      }

      const newPath: DrawnPath = {
        id: prev.activePathId || `path_${Date.now()}`,
        points: [...prev.currentPath],
        isClosed: shouldClose,
        color: '#2563eb',
        strokeWidth: 2
      };

      return {
        ...prev,
        isDrawing: false,
        currentPath: [],
        activePathId: null,
        drawnPaths: [...prev.drawnPaths, newPath]
      };
    });
  }, []);

  const clearAllPaths = useCallback(() => {
    setDrawingState({
      isDrawing: false,
      currentPath: [],
      drawnPaths: [],
      activePathId: null
    });
  }, []);

  const removePath = useCallback((pathId: string) => {
    setDrawingState(prev => ({
      ...prev,
      drawnPaths: prev.drawnPaths.filter(path => path.id !== pathId)
    }));
  }, []);

  // Convert drawn paths to frame outline for 3D generation
  const getFrameOutline = useCallback((): Point[] => {
    if (drawingState.drawnPaths.length === 0) return [];
    
    // For now, use the first closed path or combine all paths
    const closedPath = drawingState.drawnPaths.find(path => path.isClosed);
    if (closedPath) {
      return closedPath.points;
    }
    
    // If no closed path, try to connect all paths to form an outline
    const allPoints: Point[] = [];
    drawingState.drawnPaths.forEach(path => {
      allPoints.push(...path.points);
    });
    
    return allPoints;
  }, [drawingState.drawnPaths]);

  // Convert paths to simplified polygon for 3D generation
  const getSimplifiedOutline = useCallback((tolerance: number = 5): Point[] => {
    const outline = getFrameOutline();
    if (outline.length === 0) return [];
    
    // Douglas-Peucker algorithm for path simplification
    const simplifyPath = (points: Point[], tolerance: number): Point[] => {
      if (points.length <= 2) return points;
      
      const perpendicularDistance = (point: Point, lineStart: Point, lineEnd: Point): number => {
        const A = lineEnd.x - lineStart.x;
        const B = lineEnd.y - lineStart.y;
        const C = lineStart.x * lineEnd.y - lineEnd.x * lineStart.y;
        return Math.abs(A * point.y - B * point.x + C) / Math.sqrt(A * A + B * B);
      };
      
      let maxDistance = 0;
      let maxIndex = 0;
      
      for (let i = 1; i < points.length - 1; i++) {
        const distance = perpendicularDistance(points[i], points[0], points[points.length - 1]);
        if (distance > maxDistance) {
          maxDistance = distance;
          maxIndex = i;
        }
      }
      
      if (maxDistance > tolerance) {
        const leftPart = simplifyPath(points.slice(0, maxIndex + 1), tolerance);
        const rightPart = simplifyPath(points.slice(maxIndex), tolerance);
        return [...leftPart.slice(0, -1), ...rightPart];
      } else {
        return [points[0], points[points.length - 1]];
      }
    };
    
    return simplifyPath(outline, tolerance);
  }, [getFrameOutline]);

  return {
    drawingState,
    startDrawing,
    addPointToPath,
    finishPath,
    clearAllPaths,
    removePath,
    getFrameOutline,
    getSimplifiedOutline
  };
};