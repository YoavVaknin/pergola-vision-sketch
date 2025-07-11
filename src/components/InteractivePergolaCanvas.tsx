import React, { useRef, useEffect, useState } from 'react';
import { DrawingData, generate3DModelFromDrawing } from '@/utils/3dModelGenerator';
import { Point, PergolaElementType } from '@/types/pergola';
import { useCanvasZoom } from '@/hooks/useCanvasZoom';
import { Button } from '@/components/ui/button';
import { Save, RefreshCw, Download, Upload, Redo, Undo, Plus, Minus, Move } from 'lucide-react';
import { exportDrawingAsJSON, importDrawingFromJSON } from '@/utils/exportUtils';
import { useToast } from "@/components/ui/use-toast"
import { Model3DViewer } from './Model3DViewer';

interface InteractivePergolaCanvasProps {
  onDrawingChange: (drawingData: DrawingData) => void;
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    position: 'relative' as const,
    width: '100%',
    height: '100%',
    minHeight: '500px',
    backgroundColor: '#f0f0f0',
    overflow: 'hidden',
    cursor: 'crosshair'
  },
  canvas: {
    position: 'absolute' as const,
    top: '0',
    left: '0',
    width: '100%',
    height: '100%',
    objectFit: 'contain' as const,
    cursor: 'crosshair'
  },
  toolbar: {
    position: 'absolute' as const,
    top: '10px',
    left: '10px',
    zIndex: 10,
    display: 'flex',
    gap: '8px',
    padding: '8px',
    background: 'rgba(255, 255, 255, 0.8)',
    borderRadius: '6px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
  }
};

const InteractivePergolaCanvas: React.FC<InteractivePergolaCanvasProps> = ({ onDrawingChange }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [drawing, setDrawing] = useState<PergolaElementType[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<Point | null>(null);
  const [pixelsPerCm, setPixelsPerCm] = useState(20);
  const [frameColor, setFrameColor] = useState('#2d4a2b');
  const [shadingConfig, setShadingConfig] = useState({
    enabled: true,
    shadingDirection: 'width' as 'width' | 'length',
    spacing: 25,
    color: '#777777',
    shadingProfile: { width: 5, height: 2 },
    divisionEnabled: true,
    divisionDirection: 'both' as 'width' | 'length' | 'both',
    divisionSpacing: 40,
    divisionColor: '#999999',
    divisionProfile: { width: 8, height: 3 },
    frameProfile: { width: 10, height: 5 },
    direction: 0,
    pergolaModel: 'bottom_shading' as 'bottom_shading' | 'top_shading' | 't_model'
  });
  const [history, setHistory] = useState<PergolaElementType[][]>([[]]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [model3D, setModel3D] = useState(null);
  const { toast } = useToast()

  const { scale, offsetX, offsetY, transformPoint, inverseTransformPoint, pan, zoomIn, zoomOut, reset } = useCanvasZoom(canvasRef);

  useEffect(() => {
    const initialDrawingData: DrawingData = {
      elements: [],
      pixelsPerCm: pixelsPerCm,
      frameColor: frameColor,
      shadingConfig: shadingConfig
    };
    onDrawingChange(initialDrawingData);
  }, []);

  useEffect(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();

      // Apply zoom and pan transformations
      ctx.translate(offsetX, offsetY);
      ctx.scale(scale, scale);

      // Draw existing elements
      drawing.forEach(element => {
        ctx.beginPath();
        switch (element.type) {
          case 'frame':
            const frame = element;
            if (frame.points.length > 0) {
              ctx.moveTo(frame.points[0].x, frame.points[0].y);
              for (let i = 1; i < frame.points.length; i++) {
                ctx.lineTo(frame.points[i].x, frame.points[i].y);
              }
              if (frame.closed) {
                ctx.closePath();
              }
              ctx.strokeStyle = frameColor;
              ctx.lineWidth = 3;
              ctx.stroke();
            }
            break;
          // Add other element types here
        }
      });

      ctx.restore();
    }
  }, [drawing, offsetX, offsetY, scale, frameColor]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const { x: canvasX, y: canvasY } = inverseTransformPoint(x, y);
    setStartPoint({ x: canvasX, y: canvasY });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !startPoint) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const { x: canvasX, y: canvasY } = inverseTransformPoint(x, y);

    setDrawing(prev => {
      if (prev.length > 0) {
        const lastElement = prev[prev.length - 1];
        if (lastElement.type === 'frame') {
          const updatedPoints = [...lastElement.points, { x: canvasX, y: canvasY }];
          return [...prev.slice(0, prev.length - 1), { ...lastElement, points: updatedPoints }];
        }
      }
      return prev;
    });
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
    if (!startPoint) return;

    setDrawing(prev => {
      const newFrame = {
        id: `frame_${Date.now()}`,
        type: 'frame' as const,
        points: [startPoint],
        closed: false
      };
      return [...prev, newFrame];
    });
    setStartPoint(null);
  };

  const handleClosePath = () => {
    setDrawing(prev => {
      if (prev.length === 0) return prev;
      const lastElement = prev[prev.length - 1];
      if (lastElement.type === 'frame') {
        return [...prev.slice(0, prev.length - 1), { ...lastElement, closed: true }];
      }
      return prev;
    });
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setDrawing(history[historyIndex - 1]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setDrawing(history[historyIndex + 1]);
    }
  };

  useEffect(() => {
    setHistory(prev => [...prev.slice(0, historyIndex + 1), drawing]);
    setHistoryIndex(historyIndex => historyIndex + 1);
  }, [drawing]);

  useEffect(() => {
    const drawingData: DrawingData = {
      elements: drawing,
      pixelsPerCm: pixelsPerCm,
      frameColor: frameColor,
      shadingConfig: shadingConfig
    };
    onDrawingChange(drawingData);
    setModel3D(generate3DModelFromDrawing(drawingData));
  }, [drawing, pixelsPerCm, frameColor, shadingConfig, onDrawingChange]);

  const handleReset = () => {
    setDrawing([]);
    reset();
  };

  const handleExport = () => {
    const drawingData: DrawingData = {
      elements: drawing,
      pixelsPerCm: pixelsPerCm,
      frameColor: frameColor,
      shadingConfig: shadingConfig
    };
    const json = exportDrawingAsJSON(drawingData);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pergola_drawing.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = event.target?.result as string;
        const importedData = importDrawingFromJSON(json);
        setDrawing(importedData.elements);
        setPixelsPerCm(importedData.pixelsPerCm);
        setFrameColor(importedData.frameColor);
        setShadingConfig(importedData.shadingConfig);
        toast({
          title: "הצלחה!",
          description: "הייבוא בוצע בהצלחה.",
        })
      } catch (error) {
        console.error('Error importing drawing:', error);
        toast({
          variant: "destructive",
          title: "אופס! משהו השתבש.",
          description: "הקובץ לא תקין.",
        })
      }
    };
    reader.readAsText(file);
  };

  return (
    <div style={styles.container}>
      <div style={styles.toolbar}>
        <Button size="icon" onClick={zoomIn} aria-label="Zoom In">
          <Plus className="h-4 w-4" />
        </Button>
        <Button size="icon" onClick={zoomOut} aria-label="Zoom Out">
          <Minus className="h-4 w-4" />
        </Button>
        <Button size="icon" onClick={() => {}} aria-label="Pan">
          <Move className="h-4 w-4" />
        </Button>
        <Button size="icon" onClick={handleUndo} disabled={historyIndex <= 0} aria-label="Undo">
          <Undo className="h-4 w-4" />
        </Button>
        <Button size="icon" onClick={handleRedo} disabled={historyIndex >= history.length - 1} aria-label="Redo">
          <Redo className="h-4 w-4" />
        </Button>
        <Button size="icon" onClick={handleReset} aria-label="Reset">
          <RefreshCw className="h-4 w-4" />
        </Button>
        <Button size="icon" onClick={handleExport} aria-label="Export">
          <Download className="h-4 w-4" />
        </Button>
        <Button size="icon" aria-label="Import">
          <label htmlFor="import-file-input">
            <Upload className="h-4 w-4" />
          </label>
          <input
            id="import-file-input"
            type="file"
            accept=".json"
            style={{ display: 'none' }}
            onChange={handleImport}
          />
        </Button>
        <Button size="icon" onClick={handleClosePath} aria-label="Close Path">
          <Save className="h-4 w-4" />
        </Button>
      </div>
      <canvas
        ref={canvasRef}
        style={styles.canvas}
        width={1200}
        height={800}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      />
      <Model3DViewer model={model3D} />
    </div>
  );
};

export default InteractivePergolaCanvas;
