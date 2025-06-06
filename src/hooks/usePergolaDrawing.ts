
import { useState, useCallback } from 'react';
import { Point, PergolaElementType, DrawingState, FrameElement, BeamElement, ColumnElement, WallElement } from '@/types/pergola';

export const usePergolaDrawing = () => {
  const [elements, setElements] = useState<PergolaElementType[]>([]);
  const [drawingState, setDrawingState] = useState<DrawingState>({
    mode: 'frame',
    activeElement: null,
    isDrawing: false,
    tempPoints: []
  });

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const addPoint = useCallback((point: Point) => {
    if (drawingState.mode === 'frame') {
      setDrawingState(prev => ({
        ...prev,
        isDrawing: true,
        tempPoints: [...prev.tempPoints, point]
      }));
    }
  }, [drawingState.mode]);

  const finishFrame = useCallback(() => {
    if (drawingState.tempPoints.length >= 3) {
      const newFrame: FrameElement = {
        id: generateId(),
        type: 'frame',
        points: drawingState.tempPoints,
        closed: true,
        color: '#1f2937'
      };
      
      setElements(prev => [...prev, newFrame]);
      setDrawingState(prev => ({
        ...prev,
        isDrawing: false,
        tempPoints: []
      }));
    }
  }, [drawingState.tempPoints]);

  const addBeam = useCallback((start: Point, end: Point) => {
    const newBeam: BeamElement = {
      id: generateId(),
      type: 'beam',
      start,
      end,
      width: 2,
      color: '#6b7280'
    };
    
    setElements(prev => [...prev, newBeam]);
  }, []);

  const addColumn = useCallback((position: Point) => {
    const newColumn: ColumnElement = {
      id: generateId(),
      type: 'column',
      position,
      size: 8,
      color: '#374151'
    };
    
    setElements(prev => [...prev, newColumn]);
  }, []);

  const addWall = useCallback((start: Point, end: Point) => {
    const newWall: WallElement = {
      id: generateId(),
      type: 'wall',
      start,
      end,
      height: 6,
      color: '#111827'
    };
    
    setElements(prev => [...prev, newWall]);
  }, []);

  const removeElement = useCallback((id: string) => {
    setElements(prev => prev.filter(el => el.id !== id));
  }, []);

  const setMode = useCallback((mode: DrawingState['mode']) => {
    setDrawingState(prev => ({
      ...prev,
      mode,
      isDrawing: false,
      tempPoints: [],
      activeElement: null
    }));
  }, []);

  const selectElement = useCallback((id: string) => {
    setDrawingState(prev => ({
      ...prev,
      activeElement: id
    }));
  }, []);

  const clearAll = useCallback(() => {
    setElements([]);
    setDrawingState({
      mode: 'frame',
      activeElement: null,
      isDrawing: false,
      tempPoints: []
    });
  }, []);

  return {
    elements,
    drawingState,
    addPoint,
    finishFrame,
    addBeam,
    addColumn,
    addWall,
    removeElement,
    setMode,
    selectElement,
    clearAll
  };
};
