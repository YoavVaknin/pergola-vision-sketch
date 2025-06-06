import { useState, useCallback } from 'react';
import { Point, PergolaElementType, DrawingState, FrameElement, BeamElement, ColumnElement, WallElement, ShadingElement, ShadingConfig } from '@/types/pergola';

export const usePergolaDrawing = () => {
  const [elements, setElements] = useState<PergolaElementType[]>([]);
  const [drawingState, setDrawingState] = useState<DrawingState>({
    mode: 'frame',
    activeElement: null,
    isDrawing: false,
    tempPoints: []
  });
  
  const [shadingConfig, setShadingConfig] = useState<ShadingConfig>({
    spacing: 50,
    direction: 0,
    color: '#8b4513',
    enabled: true
  });

  const generateId = () => Math.random().toString(36).substr(2, 9);

  // פונקציה לחישוב קורות הצללה בתוך מסגרת
  const generateShadingBeams = useCallback((framePoints: Point[], config: ShadingConfig): ShadingElement[] => {
    if (!config.enabled || framePoints.length < 3) return [];

    const beams: ShadingElement[] = [];
    
    // חישוב bounding box של המסגרת
    const minX = Math.min(...framePoints.map(p => p.x));
    const maxX = Math.max(...framePoints.map(p => p.x));
    const minY = Math.min(...framePoints.map(p => p.y));
    const maxY = Math.max(...framePoints.map(p => p.y));

    if (config.direction === 0) {
      // קורות אנכיות
      for (let x = minX + config.spacing; x < maxX; x += config.spacing) {
        // בדיקה שהקו נמצא בתוך המסגרת
        const topPoint = { x, y: minY };
        const bottomPoint = { x, y: maxY };
        
        if (isPointInPolygon(topPoint, framePoints) && isPointInPolygon(bottomPoint, framePoints)) {
          beams.push({
            id: generateId(),
            type: 'shading',
            start: topPoint,
            end: bottomPoint,
            spacing: config.spacing,
            direction: config.direction,
            color: config.color
          });
        }
      }
    } else {
      // קורות אופקיות
      for (let y = minY + config.spacing; y < maxY; y += config.spacing) {
        const leftPoint = { x: minX, y };
        const rightPoint = { x: maxX, y };
        
        if (isPointInPolygon(leftPoint, framePoints) && isPointInPolygon(rightPoint, framePoints)) {
          beams.push({
            id: generateId(),
            type: 'shading',
            start: leftPoint,
            end: rightPoint,
            spacing: config.spacing,
            direction: config.direction,
            color: config.color
          });
        }
      }
    }

    return beams;
  }, []);

  // פונקציה לבדיקה אם נקודה נמצאת בתוך פוליגון
  const isPointInPolygon = (point: Point, polygon: Point[]): boolean => {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      if (((polygon[i].y > point.y) !== (polygon[j].y > point.y)) &&
          (point.x < (polygon[j].x - polygon[i].x) * (point.y - polygon[i].y) / (polygon[j].y - polygon[i].y) + polygon[i].x)) {
        inside = !inside;
      }
    }
    return inside;
  };

  // פונקציה להוספת עמודים אוטומטית בפינות המסגרת
  const generateCornerColumns = useCallback((framePoints: Point[]): ColumnElement[] => {
    return framePoints.map(point => ({
      id: generateId(),
      type: 'column' as const,
      position: point,
      size: 8,
      color: '#374151'
    }));
  }, []);

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
      
      setElements(prev => {
        // הסרת קורות הצללה והעמודים הקיימים
        const filteredElements = prev.filter(el => el.type !== 'shading' && el.type !== 'column');
        
        // הוספת המסגרת החדשה
        const newElements: PergolaElementType[] = [...filteredElements, newFrame];
        
        // הוספת קורות הצללה
        if (shadingConfig.enabled) {
          const shadingBeams = generateShadingBeams(drawingState.tempPoints, shadingConfig);
          newElements.push(...shadingBeams);
        }
        
        // הוספת עמודים בפינות
        const cornerColumns = generateCornerColumns(drawingState.tempPoints);
        newElements.push(...cornerColumns);
        
        return newElements;
      });
      
      setDrawingState(prev => ({
        ...prev,
        isDrawing: false,
        tempPoints: []
      }));
    }
  }, [drawingState.tempPoints, shadingConfig, generateShadingBeams, generateCornerColumns]);

  const updateShadingConfig = useCallback((newConfig: Partial<ShadingConfig>) => {
    setShadingConfig(prev => {
      const updated = { ...prev, ...newConfig };
      
      // עדכון קורות הצללה הקיימות
      const frameElement = elements.find(el => el.type === 'frame') as FrameElement;
      if (frameElement && updated.enabled) {
        setElements(prevElements => {
          // הסרת קורות הצללה קיימות
          const filteredElements = prevElements.filter(el => el.type !== 'shading');
          
          // הוספת קורות הצללה חדשות
          const shadingBeams = generateShadingBeams(frameElement.points, updated);
          return [...filteredElements, ...shadingBeams];
        });
      } else if (!updated.enabled) {
        // הסרת כל קורות הצללה
        setElements(prevElements => prevElements.filter(el => el.type !== 'shading'));
      }
      
      return updated;
    });
  }, [elements, generateShadingBeams]);

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
    shadingConfig,
    addPoint,
    finishFrame,
    addBeam,
    addColumn,
    addWall,
    removeElement,
    setMode,
    selectElement,
    clearAll,
    updateShadingConfig
  };
};
