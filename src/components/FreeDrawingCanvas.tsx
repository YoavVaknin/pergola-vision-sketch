import { useRef, useEffect, useState, useCallback } from 'react';
import { Point, PergolaElementType, FrameElement, BeamElement, ColumnElement, WallElement, ShadingElement } from '@/types/pergola';
import { usePergolaDrawing } from '@/hooks/usePergolaDrawing';
import { DrawingToolbar } from './DrawingToolbar';
import { ShadingConfigComponent } from './ShadingConfig';

export const FreeDrawingCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<Point | null>(null);
  
  const {
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
  } = usePergolaDrawing();

  const getCanvasPoint = useCallback((clientX: number, clientY: number): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  }, []);

  const drawElements = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw grid
    ctx.strokeStyle = '#f3f4f6';
    ctx.lineWidth = 1;
    for (let i = 0; i <= canvas.width; i += 20) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, canvas.height);
      ctx.stroke();
    }
    for (let i = 0; i <= canvas.height; i += 20) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(canvas.width, i);
      ctx.stroke();
    }

    // Draw elements
    elements.forEach(element => {
      ctx.strokeStyle = element.color || '#000000';
      
      switch (element.type) {
        case 'frame':
          const frame = element as FrameElement;
          if (frame.points.length > 1) {
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(frame.points[0].x, frame.points[0].y);
            frame.points.slice(1).forEach(point => {
              ctx.lineTo(point.x, point.y);
            });
            if (frame.closed && frame.points.length > 2) {
              ctx.closePath();
            }
            ctx.stroke();
          }
          // Draw points
          frame.points.forEach(point => {
            ctx.fillStyle = '#ef4444';
            ctx.beginPath();
            ctx.arc(point.x, point.y, 4, 0, 2 * Math.PI);
            ctx.fill();
          });
          break;
          
        case 'beam':
          const beam = element as BeamElement;
          ctx.lineWidth = beam.width;
          ctx.beginPath();
          ctx.moveTo(beam.start.x, beam.start.y);
          ctx.lineTo(beam.end.x, beam.end.y);
          ctx.stroke();
          break;

        case 'shading':
          const shading = element as ShadingElement;
          ctx.strokeStyle = shading.color || '#8b4513';
          ctx.lineWidth = 2;
          ctx.setLineDash([]);
          ctx.beginPath();
          ctx.moveTo(shading.start.x, shading.start.y);
          ctx.lineTo(shading.end.x, shading.end.y);
          ctx.stroke();
          break;
          
        case 'column':
          const column = element as ColumnElement;
          ctx.fillStyle = element.color || '#374151';
          ctx.fillRect(
            column.position.x - column.size / 2,
            column.position.y - column.size / 2,
            column.size,
            column.size
          );
          break;
          
        case 'wall':
          const wall = element as WallElement;
          ctx.lineWidth = wall.height;
          ctx.beginPath();
          ctx.moveTo(wall.start.x, wall.start.y);
          ctx.lineTo(wall.end.x, wall.end.y);
          ctx.stroke();
          break;
      }
    });

    // Draw temporary points for frame drawing
    if (drawingState.mode === 'frame' && drawingState.tempPoints.length > 0) {
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      
      if (drawingState.tempPoints.length > 1) {
        ctx.beginPath();
        ctx.moveTo(drawingState.tempPoints[0].x, drawingState.tempPoints[0].y);
        drawingState.tempPoints.slice(1).forEach(point => {
          ctx.lineTo(point.x, point.y);
        });
        ctx.stroke();
      }
      
      ctx.setLineDash([]);
      drawingState.tempPoints.forEach(point => {
        ctx.fillStyle = '#10b981';
        ctx.beginPath();
        ctx.arc(point.x, point.y, 6, 0, 2 * Math.PI);
        ctx.fill();
      });
    }
  }, [elements, drawingState]);

  useEffect(() => {
    drawElements();
  }, [drawElements]);

  const handleMouseDown = (e: React.MouseEvent) => {
    const point = getCanvasPoint(e.clientX, e.clientY);
    
    switch (drawingState.mode) {
      case 'frame':
        addPoint(point);
        break;
        
      case 'beam':
      case 'wall':
        setIsDragging(true);
        setDragStart(point);
        break;
        
      case 'column':
        addColumn(point);
        break;
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!isDragging || !dragStart) return;
    
    const point = getCanvasPoint(e.clientX, e.clientY);
    
    switch (drawingState.mode) {
      case 'beam':
        addBeam(dragStart, point);
        break;
        
      case 'wall':
        addWall(dragStart, point);
        break;
    }
    
    setIsDragging(false);
    setDragStart(null);
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    if (drawingState.mode === 'frame' && drawingState.tempPoints.length >= 3) {
      finishFrame();
    }
  };

  return (
    <div className="grid lg:grid-cols-4 gap-6 h-full">
      <div className="lg:col-span-1 space-y-4">
        <DrawingToolbar
          mode={drawingState.mode}
          onModeChange={setMode}
          onClear={clearAll}
          isDrawing={drawingState.isDrawing}
          onFinishFrame={finishFrame}
        />
        
        <ShadingConfigComponent
          config={shadingConfig}
          onConfigChange={updateShadingConfig}
        />
        
        <div className="p-4 bg-muted rounded-lg">
          <h4 className="font-semibold mb-2">סטטיסטיקות</h4>
          <div className="text-sm space-y-1">
            <p>מסגרות: {elements.filter(e => e.type === 'frame').length}</p>
            <p>קורות: {elements.filter(e => e.type === 'beam').length}</p>
            <p>הצללה: {elements.filter(e => e.type === 'shading').length}</p>
            <p>עמודים: {elements.filter(e => e.type === 'column').length}</p>
            <p>קירות: {elements.filter(e => e.type === 'wall').length}</p>
          </div>
        </div>
      </div>
      
      <div className="lg:col-span-3">
        <div className="border rounded-lg shadow-sm bg-white p-4">
          <h3 className="text-lg font-semibold mb-4">שרטוט חופשי עם הצללה אוטומטית</h3>
          <canvas
            ref={canvasRef}
            width={800}
            height={600}
            className="border rounded cursor-crosshair bg-white"
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onDoubleClick={handleDoubleClick}
          />
          
          <div className="mt-4 text-sm text-muted-foreground">
            <p><strong>הוראות:</strong></p>
            <p>• מסגרת: לחץ לסימון נקודות, דאבל-קליק או "סיום מסגרת" לסגירה</p>
            <p>• הצללה תתווסף אוטומטית בתוך המסגרת לפי ההגדרות</p>
            <p>• עמודים יתווספו אוטומטית בפינות המסגרת</p>
            <p>• קורה/קיר: לחץ והחזק, גרור ושחרר</p>
            <p>• עמוד נוסף: לחיצה פשוטה</p>
          </div>
        </div>
      </div>
    </div>
  );
};
