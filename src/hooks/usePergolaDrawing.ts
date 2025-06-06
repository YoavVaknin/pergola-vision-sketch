import { useState, useCallback } from 'react';
import { Point, PergolaElementType, DrawingState, FrameElement, BeamElement, ColumnElement, WallElement, ShadingElement, DivisionElement, ShadingConfig } from '@/types/pergola';

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
    enabled: true,
    divisionSpacing: 100,
    divisionColor: '#f97316',
    divisionEnabled: true
  });

  const generateId = () => Math.random().toString(36).substr(2, 9);

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

  // פונקציה לחישוב קורות הצללה
  const generateShadingBeams = useCallback((framePoints: Point[], config: ShadingConfig): ShadingElement[] => {
    if (!config.enabled || framePoints.length < 3) {
      console.log('Shading disabled or insufficient points:', config.enabled, framePoints.length);
      return [];
    }

    const beams: ShadingElement[] = [];
    
    // חישוב bounding box של המסגרת
    const minX = Math.min(...framePoints.map(p => p.x));
    const maxX = Math.max(...framePoints.map(p => p.x));
    const minY = Math.min(...framePoints.map(p => p.y));
    const maxY = Math.max(...framePoints.map(p => p.y));

    console.log('Frame bounds:', { minX, maxX, minY, maxY });
    console.log('Shading config:', config);

    if (config.direction === 0) {
      // קורות אנכיות - מעבר על ציר X
      for (let x = minX + config.spacing; x < maxX; x += config.spacing) {
        const intersections: number[] = [];
        
        // חיפוש החתכים עם צלעות המסגרת
        for (let i = 0; i < framePoints.length; i++) {
          const p1 = framePoints[i];
          const p2 = framePoints[(i + 1) % framePoints.length];
          
          // בדיקה אם הקו האנכי חותך את הצלע
          const minEdgeX = Math.min(p1.x, p2.x);
          const maxEdgeX = Math.max(p1.x, p2.x);
          
          if (x >= minEdgeX && x <= maxEdgeX && p1.x !== p2.x) {
            // חישוב נקודת החתך
            const t = (x - p1.x) / (p2.x - p1.x);
            const y = p1.y + t * (p2.y - p1.y);
            
            if (y >= minY && y <= maxY) {
              intersections.push(y);
            }
          }
        }
        
        // מיון החתכים ויצירת קורות בזוגות
        intersections.sort((a, b) => a - b);
        console.log(`Vertical line at x=${x}, intersections:`, intersections);
        
        for (let i = 0; i < intersections.length - 1; i += 2) {
          if (i + 1 < intersections.length) {
            const start = { x, y: intersections[i] };
            const end = { x, y: intersections[i + 1] };
            
            beams.push({
              id: generateId(),
              type: 'shading',
              start,
              end,
              spacing: config.spacing,
              direction: config.direction,
              color: config.color
            });
          }
        }
      }
    } else {
      // קורות אופקיות - מעבר על ציר Y
      for (let y = minY + config.spacing; y < maxY; y += config.spacing) {
        const intersections: number[] = [];
        
        // חיפוש החתכים עם צלעות המסגרת
        for (let i = 0; i < framePoints.length; i++) {
          const p1 = framePoints[i];
          const p2 = framePoints[(i + 1) % framePoints.length];
          
          // בדיקה אם הקו האופקי חותך את הצלע
          const minEdgeY = Math.min(p1.y, p2.y);
          const maxEdgeY = Math.max(p1.y, p2.y);
          
          if (y >= minEdgeY && y <= maxEdgeY && p1.y !== p2.y) {
            // חישוב נקודת החתך
            const t = (y - p1.y) / (p2.y - p1.y);
            const x = p1.x + t * (p2.x - p1.x);
            
            if (x >= minX && x <= maxX) {
              intersections.push(x);
            }
          }
        }
        
        // מיון החתכים ויצירת קורות בזוגות
        intersections.sort((a, b) => a - b);
        console.log(`Horizontal line at y=${y}, intersections:`, intersections);
        
        for (let i = 0; i < intersections.length - 1; i += 2) {
          if (i + 1 < intersections.length) {
            const start = { x: intersections[i], y };
            const end = { x: intersections[i + 1], y };
            
            beams.push({
              id: generateId(),
              type: 'shading',
              start,
              end,
              spacing: config.spacing,
              direction: config.direction,
              color: config.color
            });
          }
        }
      }
    }

    console.log('Generated shading beams:', beams.length, beams);
    return beams;
  }, []);

  // פונקציה חדשה לחישוב קורות חלוקה
  const generateDivisionBeams = useCallback((framePoints: Point[], config: ShadingConfig): DivisionElement[] => {
    if (!config.divisionEnabled || framePoints.length < 3) {
      console.log('Division disabled or insufficient points:', config.divisionEnabled, framePoints.length);
      return [];
    }

    const beams: DivisionElement[] = [];
    
    // חישוב bounding box של המסגרת
    const minX = Math.min(...framePoints.map(p => p.x));
    const maxX = Math.max(...framePoints.map(p => p.x));
    const minY = Math.min(...framePoints.map(p => p.y));
    const maxY = Math.max(...framePoints.map(p => p.y));

    console.log('Division beams - Frame bounds:', { minX, maxX, minY, maxY });

    // קורות החלוקה תמיד עוברות בכיוון הניצב לקורות הצללה
    const divisionDirection = config.direction === 0 ? 90 : 0;

    if (divisionDirection === 0) {
      // קורות חלוקה אנכיות - מעבר על ציר X
      for (let x = minX + config.divisionSpacing; x < maxX; x += config.divisionSpacing) {
        const intersections: number[] = [];
        
        // חיפוש החתכים עם צלעות המסגרת
        for (let i = 0; i < framePoints.length; i++) {
          const p1 = framePoints[i];
          const p2 = framePoints[(i + 1) % framePoints.length];
          
          // בדיקה אם הקו האנכי חותך את הצלע
          const minEdgeX = Math.min(p1.x, p2.x);
          const maxEdgeX = Math.max(p1.x, p2.x);
          
          if (x >= minEdgeX && x <= maxEdgeX && p1.x !== p2.x) {
            // חישוב נקודת החתך
            const t = (x - p1.x) / (p2.x - p1.x);
            const y = p1.y + t * (p2.y - p1.y);
            
            if (y >= minY && y <= maxY) {
              intersections.push(y);
            }
          }
        }
        
        // מיון החתכים ויצירת קורות בזוגות
        intersections.sort((a, b) => a - b);
        console.log(`Division vertical line at x=${x}, intersections:`, intersections);
        
        for (let i = 0; i < intersections.length - 1; i += 2) {
          if (i + 1 < intersections.length) {
            const start = { x, y: intersections[i] };
            const end = { x, y: intersections[i + 1] };
            
            beams.push({
              id: generateId(),
              type: 'division',
              start,
              end,
              spacing: config.divisionSpacing,
              direction: divisionDirection,
              color: config.divisionColor
            });
          }
        }
      }
    } else {
      // קורות חלוקה אופקיות - מעבר על ציר Y
      for (let y = minY + config.divisionSpacing; y < maxY; y += config.divisionSpacing) {
        const intersections: number[] = [];
        
        // חיפוש החתכים עם צלעות המסגרת
        for (let i = 0; i < framePoints.length; i++) {
          const p1 = framePoints[i];
          const p2 = framePoints[(i + 1) % framePoints.length];
          
          // בדיקה אם הקו האופקי חותך את הצלע
          const minEdgeY = Math.min(p1.y, p2.y);
          const maxEdgeY = Math.max(p1.y, p2.y);
          
          if (y >= minEdgeY && y <= maxEdgeY && p1.y !== p2.y) {
            // חישוב נקודת החתך
            const t = (y - p1.y) / (p2.y - p1.y);
            const x = p1.x + t * (p2.x - p1.x);
            
            if (x >= minX && x <= maxX) {
              intersections.push(x);
            }
          }
        }
        
        // מיון החתכים ויצירת קורות בזוגות
        intersections.sort((a, b) => a - b);
        console.log(`Division horizontal line at y=${y}, intersections:`, intersections);
        
        for (let i = 0; i < intersections.length - 1; i += 2) {
          if (i + 1 < intersections.length) {
            const start = { x: intersections[i], y };
            const end = { x: intersections[i + 1], y };
            
            beams.push({
              id: generateId(),
              type: 'division',
              start,
              end,
              spacing: config.divisionSpacing,
              direction: divisionDirection,
              color: config.divisionColor
            });
          }
        }
      }
    }

    console.log('Generated division beams:', beams.length, beams);
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
      const newFrame: FrameElement = {
        id: generateId(),
        type: 'frame',
        points: drawingState.tempPoints,
        closed: true,
        color: '#1f2937'
      };
      
      console.log('Creating frame with points:', drawingState.tempPoints);
      
      setElements(prev => {
        // הסרת קורות הצללה, החלוקה והעמודים הקיימים
        const filteredElements = prev.filter(el => el.type !== 'shading' && el.type !== 'column' && el.type !== 'division');
        
        // הוספת המסגרת החדשה
        const newElements: PergolaElementType[] = [...filteredElements, newFrame];
        
        // הוספת קורות הצללה
        if (shadingConfig.enabled) {
          const shadingBeams = generateShadingBeams(drawingState.tempPoints, shadingConfig);
          console.log('Adding shading beams:', shadingBeams);
          newElements.push(...shadingBeams);
        }
        
        // הוספת קורות החלוקה
        if (shadingConfig.divisionEnabled) {
          const divisionBeams = generateDivisionBeams(drawingState.tempPoints, shadingConfig);
          console.log('Adding division beams:', divisionBeams);
          newElements.push(...divisionBeams);
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
  }, [drawingState.tempPoints, shadingConfig, generateShadingBeams, generateDivisionBeams, generateCornerColumns]);

  const updateShadingConfig = useCallback((newConfig: Partial<ShadingConfig>) => {
    setShadingConfig(prev => {
      const updated = { ...prev, ...newConfig };
      
      // עדכון קורות הצללה והחלוקה הקיימות
      const frameElement = elements.find(el => el.type === 'frame') as FrameElement;
      if (frameElement) {
        setElements(prevElements => {
          // הסרת קורות הצללה והחלוקה קיימות
          const filteredElements = prevElements.filter(el => el.type !== 'shading' && el.type !== 'division');
          
          let newElements = [...filteredElements];
          
          // הוספת קורות הצללה חדשות
          if (updated.enabled) {
            const shadingBeams = generateShadingBeams(frameElement.points, updated);
            newElements.push(...shadingBeams);
          }
          
          // הוספת קורות החלוקה חדשות
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
