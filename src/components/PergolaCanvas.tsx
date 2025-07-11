import React, { useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { PergolaConfig } from '@/types/pergolaConfig';

interface PergolaCanvasProps {
  config: PergolaConfig;
  onDrawingChange: (drawingData: any) => void;
}

export const PergolaCanvas: React.FC<PergolaCanvasProps> = ({ config, onDrawingChange }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingDataRef = useRef<any>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions based on config
    canvas.width = config.width;
    canvas.height = config.height;

    // Initial drawing data
    drawingDataRef.current = {
      elements: [],
      pixelsPerCm: 10,
      frameColor: 'green',
      shadingConfig: {
        enabled: true,
        shadingDirection: 'width',
        spacing: 20,
        color: 'red',
        shadingProfile: { width: 2, height: 5 },
        divisionEnabled: true,
        divisionDirection: 'length',
        divisionSpacing: 30,
        divisionColor: 'blue',
        divisionProfile: { width: 3, height: 8 }
      }
    };

    // Example drawing
    ctx.fillStyle = 'lightgrey';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Notify parent component
    onDrawingChange(drawingDataRef.current);

  }, [config, onDrawingChange]);

  const handleExport = () => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const dataURL = canvas.toDataURL('image/png');

    // Create a temporary link element
    const link = document.createElement('a');
    link.href = dataURL;
    link.download = 'pergola_design.png'; // Set the filename
    document.body.appendChild(link);

    // Programmatically click the link to trigger the download
    link.click();

    // Remove the link from the document
    document.body.removeChild(link);
  };

  return (
    <div>
      <canvas ref={canvasRef} />
      <Button onClick={handleExport}>Export to PNG</Button>
    </div>
  );
};
