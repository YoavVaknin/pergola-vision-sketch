import { useState, useCallback } from 'react';
import { Point, PergolaElementType, DrawingState, FrameElement, BeamElement, ColumnElement, WallElement, ShadingElement, DivisionElement, ShadingConfig, MeasurementConfig } from '@/types/pergola';
import { calculateRealDistance, calculatePolygonArea, calculatePolygonAngles } from '@/utils/measurementUtils';

// Generate unique ID for elements
const generateId = (): string => {
  return `pergola_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export const usePergolaDrawing = () => {
  const [elements, setElements] = useState<PergolaElementType[]>([]);
  const [drawingState, setDrawingState] = useState<DrawingState>({
    mode: 'frame',
    activeElement: null,
    isDrawing: false,
    tempPoints: []
  });
  
  const [shadingConfig, setShadingConfig] = useState<ShadingConfig>({
    spacing: 10,
    direction: 0,
    color: '#8b4513',
    enabled: true,
    divisionSpacing: 50,
    divisionColor: '#f97316',
    divisionEnabled: true,
    pergolaModel: 'bottom_shading',
    frameProfile: {
      width: 20,
      height: 15
    },
    divisionProfile: {
      width: 15,
      height: 10
    },
    shadingProfile: {
      width: 8,
      height: 2
    },
    divisionDirection: 'both',
    shadingDirection: 'width'
  });

  const [measurementConfig, setMeasurementConfig] = useState<MeasurementConfig>({
    pixelsPerCm: 2, // 2 pixels = 1 cm (can be adjusted based on scale)
    showLengths: true,
    showArea: true,
    showAngles: true,
    unit: 'cm'
  });

  // New state for length input
  const [lengthInputState, setLengthInputState] = useState<{
    visible: boolean;
    position: Point;
    startPoint: Point | null;
    targetLength: number;
  }>({
    visible: false,
    position: { x: 0, y: 0 },
    startPoint: null,
    targetLength: 0
  });

  // New state for dimension editing
  const [dimensionEditState, setDimensionEditState] = useState<{
    visible: boolean;
    position: Point;
    elementId: string | null;
    segmentIndex: number | null;
    currentLength: number;
  }>({
    visible: false,
    position: { x: 0, y: 0 },
    elementId: null,
    segmentIndex: null,
    currentLength: 0
  });

  // פונקציה לחישוב נקודה חדשה על פי אורך ויישור
  const calculatePointByLength = useCallback((startPoint: Point, direction: Point, targetLength: number): Point => {
    const currentLength = calculateRealDistance(startPoint, direction, measurementConfig.pixelsPerCm);
    if (currentLength === 0) return direction;
    
    const ratio = targetLength / currentLength;
    const targetPixelLength = targetLength * measurementConfig.pixelsPerCm;
    
    const dx = direction.x - startPoint.x;
    const dy = direction.y - startPoint.y;
    const currentPixelLength = Math.sqrt(dx * dx + dy * dy);
    
    if (currentPixelLength === 0) return direction;
    
    const scale = targetPixelLength / currentPixelLength;
    
    return {
      x: startPoint.x + dx * scale,
      y: startPoint.y + dy * scale
    };
  }, [measurementConfig.pixelsPerCm]);

  // Show length input
  const showLengthInput = useCallback((startPoint: Point, mousePosition: Point) => {
    const currentLength = calculateRealDistance(startPoint, mousePosition, measurementConfig.pixelsPerCm);
    setLengthInputState({
      visible: true,
      position: mousePosition,
      startPoint,
      targetLength: currentLength
    });
  }, [measurementConfig.pixelsPerCm]);

  // Hide length input
  const hideLengthInput = useCallback(() => {
    setLengthInputState(prev => ({ ...prev, visible: false }));
  }, []);

  // Handle length input submission
  const handleLengthSubmit = useCallback((length: number) => {
    if (lengthInputState.startPoint) {
      const lastMousePosition = lengthInputState.position;
      const newPoint = calculatePointByLength(lengthInputState.startPoint, lastMousePosition, length);
      addPoint(newPoint);
      hideLengthInput();
    }
  }, [lengthInputState, calculatePointByLength]);

  // פונקציה לבדיקה אם נקודה נמצאת בתוך פוליגון
  const isPointInPolygon = (point: Point, polygon: Point[]): boolean => {
    if (polygon.length < 3) return false;
    
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      if (((polygon[i].y > point.y) !== (polygon[j].y > point.y)) &&
          (point.x < (polygon[j].x - polygon[i].x) * (point.y - polygon[i].y) / (polygon[j].y - polygon[i].y) + polygon[i].x)) {
        inside = !inside;
      }
    }
    return inside;
  };

  // Function to calculate measurements for a frame
  const calculateFrameMeasurements = useCallback((points: Point[]) => {
    if (points.length < 2) return undefined;

    const segmentLengths: number[] = [];
    
    // Calculate segment lengths
    for (let i = 0; i < points.length; i++) {
      const nextIndex = (i + 1) % points.length;
      if (i === points.length - 1 && points.length < 3) break; // Don't close if less than 3 points
      
      const length = calculateRealDistance(points[i], points[nextIndex], measurementConfig.pixelsPerCm);
      segmentLengths.push(length);
    }

    let area: number | undefined;
    let angles: number[] | undefined;

    // Calculate area and angles only for closed shapes with 3+ points
    if (points.length >= 3) {
      area = calculatePolygonArea(points, measurementConfig.pixelsPerCm);
      angles = calculatePolygonAngles(points);
    }

    return {
      segmentLengths,
      area,
      angles
    };
  }, [measurementConfig.pixelsPerCm]);

  // Simplified shading beams generation (now handled by 3D generator)
  const generateShadingBeams = useCallback((framePoints: Point[], config: ShadingConfig): ShadingElement[] => {
    // This is now mainly for 2D display purposes
    if (!config.enabled || framePoints.length < 3) {
      return [];
    }

    const beams: ShadingElement[] = [];
    const minX = Math.min(...framePoints.map(p => p.x));
    const maxX = Math.max(...framePoints.map(p => p.x));
    const minY = Math.min(...framePoints.map(p => p.y));
    const maxY = Math.max(...framePoints.map(p => p.y));

    if (config.shadingDirection === 'width') {
      for (let x = minX + config.spacing; x < maxX; x += config.spacing) {
        const intersections: number[] = [];
        
        for (let i = 0; i < framePoints.length; i++) {
          const p1 = framePoints[i];
          const p2 = framePoints[(i + 1) % framePoints.length];
          
          const minEdgeX = Math.min(p1.x, p2.x);
          const maxEdgeX = Math.max(p1.x, p2.x);
          
          if (x >= minEdgeX && x <= maxEdgeX && p1.x !== p2.x) {
            const t = (x - p1.x) / (p2.x - p1.x);
            const y = p1.y + t * (p2.y - p1.y);
            
            if (y >= minY && y <= maxY) {
              intersections.push(y);
            }
          }
        }
        
        intersections.sort((a, b) => a - b);
        
        for (let i = 0; i < intersections.length - 1; i += 2) {
          if (i + 1 < intersections.length) {
            const start = { x, y: intersections[i] };
            const end = { x, y: intersections[i + 1] };
            
            beams.push({
              id: generateId(),
              type: 'shading',
              start,
              end,
              width: 2,
              spacing: config.spacing,
              direction: config.direction,
              color: config.color
            });
          }
        }
      }
    } else {
      for (let y = minY + config.spacing; y < maxY; y += config.spacing) {
        const intersections: number[] = [];
        
        for (let i = 0; i < framePoints.length; i++) {
          const p1 = framePoints[i];
          const p2 = framePoints[(i + 1) % framePoints.length];
          
          const minEdgeY = Math.min(p1.y, p2.y);
          const maxEdgeY = Math.max(p1.y, p2.y);
          
          if (y >= minEdgeY && y <= maxEdgeY && p1.y !== p2.y) {
            const t = (y - p1.y) / (p2.y - p1.y);
            const x = p1.x + t * (p2.x - p1.x);
            
            if (x >= minX && x <= maxX) {
              intersections.push(x);
            }
          }
        }
        
        intersections.sort((a, b) => a - b);
        
        for (let i = 0; i < intersections.length - 1; i += 2) {
          if (i + 1 < intersections.length) {
            const start = { x: intersections[i], y };
            const end = { x: intersections[i + 1], y };
            
            beams.push({
              id: generateId(),
              type: 'shading',
              start,
              end,
              width: 2,
              spacing: config.spacing,
              direction: config.direction,
              color: config.color
            });
          }
        }
      }
    }

    return beams;
  }, []);

  // Simplified division beams generation (now handled by 3D generator)
  const generateDivisionBeams = useCallback((framePoints: Point[], config: ShadingConfig): DivisionElement[] => {
    // This is now mainly for 2D display purposes
    if (!config.divisionEnabled || framePoints.length < 3) {
      return [];
    }

    const beams: DivisionElement[] = [];
    const minX = Math.min(...framePoints.map(p => p.x));
    const maxX = Math.max(...framePoints.map(p => p.x));
    const minY = Math.min(...framePoints.map(p => p.y));
    const maxY = Math.max(...framePoints.map(p => p.y));

    // Division beams along width
    if (config.divisionDirection === 'width' || config.divisionDirection === 'both') {
      for (let x = minX + config.divisionSpacing; x < maxX; x += config.divisionSpacing) {
        const intersections: number[] = [];
        
        for (let i = 0; i < framePoints.length; i++) {
          const p1 = framePoints[i];
          const p2 = framePoints[(i + 1) % framePoints.length];
          
          const minEdgeX = Math.min(p1.x, p2.x);
          const maxEdgeX = Math.max(p1.x, p2.x);
          
          if (x >= minEdgeX && x <= maxEdgeX && p1.x !== p2.x) {
            const t = (x - p1.x) / (p2.x - p1.x);
            const y = p1.y + t * (p2.y - p1.y);
            
            if (y >= minY && y <= maxY) {
              intersections.push(y);
            }
          }
        }
        
        intersections.sort((a, b) => a - b);
        
        for (let i = 0; i < intersections.length - 1; i += 2) {
          if (i + 1 < intersections.length) {
            const start = { x, y: intersections[i] };
            const end = { x, y: intersections[i + 1] };
            
            beams.push({
              id: generateId(),
              type: 'division',
              start,
              end,
              width: 3,
              spacing: config.divisionSpacing,
              direction: 0,
              color: config.divisionColor
            });
          }
        }
      }
    }

    // Division beams along length
    if (config.divisionDirection === 'length' || config.divisionDirection === 'both') {
      for (let y = minY + config.divisionSpacing; y < maxY; y += config.divisionSpacing) {
        const intersections: number[] = [];
        
        for (let i = 0; i < framePoints.length; i++) {
          const p1 = framePoints[i];
          const p2 = framePoints[(i + 1) % framePoints.length];
          
          const minEdgeY = Math.min(p1.y, p2.y);
          const maxEdgeY = Math.max(p1.y, p2.y);
          
          if (y >= minEdgeY && y <= maxEdgeY && p1.y !== p2.y) {
            const t = (y - p1.y) / (p2.y - p1.y);
            const x = p1.x + t * (p2.x - p1.x);
            
            if (x >= minX && x <= maxX) {
              intersections.push(x);
            }
          }
        }
        
        intersections.sort((a, b) => a - b);
        
        for (let i = 0; i < intersections.length - 1; i += 2) {
          if (i + 1 < intersections.length) {
            const start = { x: intersections[i], y };
            const end = { x: intersections[i + 1], y };
            
            beams.push({
              id: generateId(),
              type: 'division',
              start,
              end,
              width: 3,
              spacing: config.divisionSpacing,
              direction: 90,
              color: config.divisionColor
            });
          }
        }
      }
    }

    return beams;
  }, []);

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
      const measurements = calculateFrameMeasurements(drawingState.tempPoints);
      
      const newFrame: FrameElement = {
        id: generateId(),
        type: 'frame',
        points: drawingState.tempPoints,
        closed: true,
        color: '#1f2937',
        measurements
      };
      
      console.log('Creating frame with points:', drawingState.tempPoints);
      console.log('Frame measurements:', measurements);
      
      setElements(prev => {
        const filteredElements = prev.filter(el => el.type !== 'shading' && el.type !== 'column' && el.type !== 'division');
        
        const newElements: PergolaElementType[] = [...filteredElements, newFrame];
        
        if (shadingConfig.enabled) {
          const shadingBeams = generateShadingBeams(drawingState.tempPoints, shadingConfig);
          console.log('Adding shading beams:', shadingBeams);
          newElements.push(...shadingBeams);
        }
        
        if (shadingConfig.divisionEnabled) {
          const divisionBeams = generateDivisionBeams(drawingState.tempPoints, shadingConfig);
          console.log('Adding division beams:', divisionBeams);
          newElements.push(...divisionBeams);
        }
        
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
  }, [drawingState.tempPoints, shadingConfig, generateShadingBeams, generateDivisionBeams, generateCornerColumns, calculateFrameMeasurements]);

  const updateShadingConfig = useCallback((newConfig: Partial<ShadingConfig>) => {
    setShadingConfig(prev => {
      const updated = { ...prev, ...newConfig };
      
      const frameElement = elements.find(el => el.type === 'frame') as FrameElement;
      if (frameElement) {
        setElements(prevElements => {
          const filteredElements = prevElements.filter(el => el.type !== 'shading' && el.type !== 'division');
          
          const newElements: PergolaElementType[] = [...filteredElements];
          
          if (updated.enabled) {
            const shadingBeams = generateShadingBeams(frameElement.points, updated);
            newElements.push(...shadingBeams);
          }
          
          if (updated.divisionEnabled) {
            const divisionBeams = generateDivisionBeams(frameElement.points, updated);
            newElements.push(...divisionBeams);
          }
          
          return newElements;
        });
      }
      
      return updated;
    });
  }, [elements, generateShadingBeams, generateDivisionBeams]);

  const updateMeasurementConfig = useCallback((newConfig: Partial<MeasurementConfig>) => {
    setMeasurementConfig(prev => {
      const updated = { ...prev, ...newConfig };
      
      setElements(prevElements => {
        return prevElements.map(element => {
          if (element.type === 'frame') {
            const frameElement = element as FrameElement;
            const measurements = calculateFrameMeasurements(frameElement.points);
            return {
              ...frameElement,
              measurements
            } as FrameElement;
          }
          return element;
        });
      });
      
      return updated;
    });
  }, [calculateFrameMeasurements]);

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

  // New function to show dimension editor
  const showDimensionEditor = useCallback((elementId: string, segmentIndex: number, position: Point, currentLength: number) => {
    setDimensionEditState({
      visible: true,
      position,
      elementId,
      segmentIndex,
      currentLength
    });
  }, []);

  // New function to hide dimension editor
  const hideDimensionEditor = useCallback(() => {
    setDimensionEditState(prev => ({ ...prev, visible: false }));
  }, []);

  // New function to handle dimension edit submission
  const handleDimensionEdit = useCallback((newLength: number) => {
    if (!dimensionEditState.elementId || dimensionEditState.segmentIndex === null) return;

    setElements(prevElements => {
      return prevElements.map(element => {
        if (element.id === dimensionEditState.elementId && element.type === 'frame') {
          const frame = element as FrameElement;
          const newPoints = [...frame.points];
          
          const startIndex = dimensionEditState.segmentIndex!;
          const endIndex = (startIndex + 1) % newPoints.length;
          
          if (!frame.closed && endIndex === 0) return element;
          
          const startPoint = newPoints[startIndex];
          const endPoint = newPoints[endIndex];
          
          // Calculate new end point based on desired length
          const currentVector = {
            x: endPoint.x - startPoint.x,
            y: endPoint.y - startPoint.y
          };
          
          const currentLength = Math.sqrt(currentVector.x * currentVector.x + currentVector.y * currentVector.y);
          if (currentLength === 0) return element;
          
          const scale = (newLength * measurementConfig.pixelsPerCm) / currentLength;
          
          newPoints[endIndex] = {
            x: startPoint.x + currentVector.x * scale,
            y: startPoint.y + currentVector.y * scale
          };
          
          // Recalculate measurements
          const measurements = calculateFrameMeasurements(newPoints);
          
          return {
            ...frame,
            points: newPoints,
            measurements
          } as FrameElement;
        }
        return element;
      });
    });
    
    hideDimensionEditor();
  }, [dimensionEditState, measurementConfig.pixelsPerCm, calculateFrameMeasurements]);

  // New function to update corner position
  const updateCornerPosition = useCallback((elementId: string, cornerIndex: number, newPosition: Point) => {
    setElements(prevElements => {
      return prevElements.map(element => {
        if (element.id === elementId && element.type === 'frame') {
          const frame = element as FrameElement;
          const newPoints = [...frame.points];
          newPoints[cornerIndex] = newPosition;
          
          // Recalculate measurements
          const measurements = calculateFrameMeasurements(newPoints);
          
          return {
            ...frame,
            points: newPoints,
            measurements
          } as FrameElement;
        }
        return element;
      });
    });
  }, [calculateFrameMeasurements]);

  return {
    elements,
    drawingState,
    shadingConfig,
    measurementConfig,
    lengthInputState,
    dimensionEditState,
    addPoint,
    finishFrame,
    addBeam,
    addColumn,
    addWall,
    removeElement,
    setMode,
    selectElement,
    clearAll,
    updateShadingConfig,
    updateMeasurementConfig,
    showLengthInput,
    hideLengthInput,
    handleLengthSubmit,
    calculatePointByLength,
    showDimensionEditor,
    hideDimensionEditor,
    handleDimensionEdit,
    updateCornerPosition
  };
};
