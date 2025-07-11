
import { useState, useCallback, useRef, useEffect } from 'react';

export interface ZoomState {
  scale: number;
  offsetX: number;
  offsetY: number;
}

export interface CanvasTransform {
  scale: number;
  offsetX: number;
  offsetY: number;
  transformPoint: (x: number, y: number) => { x: number; y: number };
  inverseTransformPoint: (x: number, y: number) => { x: number; y: number };
  reset: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
  pan: (deltaX: number, deltaY: number) => void;
}

export const useCanvasZoom = (
  canvasRef: React.RefObject<HTMLCanvasElement>,
  initialScale: number = 1,
  minScale: number = 0.1,
  maxScale: number = 5
): CanvasTransform => {
  const [zoomState, setZoomState] = useState<ZoomState>({
    scale: initialScale,
    offsetX: 0,
    offsetY: 0
  });

  const isDragging = useRef(false);
  const lastMousePos = useRef({ x: 0, y: 0 });

  // Transform screen coordinates to canvas coordinates
  const inverseTransformPoint = useCallback((screenX: number, screenY: number) => {
    return {
      x: (screenX - zoomState.offsetX) / zoomState.scale,
      y: (screenY - zoomState.offsetY) / zoomState.scale
    };
  }, [zoomState]);

  // Transform canvas coordinates to screen coordinates
  const transformPoint = useCallback((canvasX: number, canvasY: number) => {
    return {
      x: canvasX * zoomState.scale + zoomState.offsetX,
      y: canvasY * zoomState.scale + zoomState.offsetY
    };
  }, [zoomState]);

  const reset = useCallback(() => {
    setZoomState({
      scale: initialScale,
      offsetX: 0,
      offsetY: 0
    });
  }, [initialScale]);

  const zoomIn = useCallback(() => {
    setZoomState(prev => ({
      ...prev,
      scale: Math.min(prev.scale * 1.2, maxScale)
    }));
  }, [maxScale]);

  const zoomOut = useCallback(() => {
    setZoomState(prev => ({
      ...prev,
      scale: Math.max(prev.scale / 1.2, minScale)
    }));
  }, [minScale]);

  const pan = useCallback((deltaX: number, deltaY: number) => {
    setZoomState(prev => ({
      ...prev,
      offsetX: prev.offsetX + deltaX,
      offsetY: prev.offsetY + deltaY
    }));
  }, []);

  // Handle wheel zoom
  const handleWheel = useCallback((e: WheelEvent) => {
    if (!canvasRef.current) return;
    
    e.preventDefault();
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    // Add null checks for rect
    if (!rect || typeof rect.left === 'undefined' || typeof rect.top === 'undefined') {
      console.warn('Canvas rect is invalid:', rect);
      return;
    }
    
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.max(minScale, Math.min(maxScale, zoomState.scale * zoomFactor));
    
    if (newScale !== zoomState.scale) {
      const scaleChange = newScale / zoomState.scale;
      
      setZoomState(prev => ({
        scale: newScale,
        offsetX: prev.offsetX - (mouseX - prev.offsetX) * (scaleChange - 1),
        offsetY: prev.offsetY - (mouseY - prev.offsetY) * (scaleChange - 1)
      }));
    }
  }, [zoomState.scale, minScale, maxScale, canvasRef]);

  // Handle mouse pan
  const handleMouseDown = useCallback((e: MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.ctrlKey)) { // Middle mouse or Ctrl+Left mouse
      e.preventDefault();
      isDragging.current = true;
      lastMousePos.current = { x: e.clientX, y: e.clientY };
    }
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging.current) {
      const deltaX = e.clientX - lastMousePos.current.x;
      const deltaY = e.clientY - lastMousePos.current.y;
      
      pan(deltaX, deltaY);
      
      lastMousePos.current = { x: e.clientX, y: e.clientY };
    }
  }, [pan]);

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  // Attach event listeners
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.addEventListener('wheel', handleWheel, { passive: false });
    canvas.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      canvas.removeEventListener('wheel', handleWheel);
      canvas.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [canvasRef, handleWheel, handleMouseDown, handleMouseMove, handleMouseUp]);

  return {
    scale: zoomState.scale,
    offsetX: zoomState.offsetX,
    offsetY: zoomState.offsetY,
    transformPoint,
    inverseTransformPoint,
    reset,
    zoomIn,
    zoomOut,
    pan
  };
};
