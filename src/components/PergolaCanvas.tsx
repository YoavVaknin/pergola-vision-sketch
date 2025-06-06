
import { useEffect, useRef } from "react";
import { PergolaConfig } from "@/pages/CreateVisualization";

interface PergolaCanvasProps {
  config: PergolaConfig;
}

export const PergolaCanvas = ({ config }: PergolaCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // ניקוי הקנבס
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // חישוב קנה מידה
    const padding = 60;
    const availableWidth = canvas.width - (padding * 2);
    const availableHeight = canvas.height - (padding * 2);
    
    const scaleX = availableWidth / config.width;
    const scaleY = availableHeight / config.length;
    const scale = Math.min(scaleX, scaleY, 1); // מקסימום קנה מידה 1:1

    // מיקום מרכזי
    const scaledWidth = config.width * scale;
    const scaledLength = config.length * scale;
    const startX = (canvas.width - scaledWidth) / 2;
    const startY = (canvas.height - scaledLength) / 2;

    // רקע
    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // משבצות רקע (רשת)
    ctx.strokeStyle = '#e9ecef';
    ctx.lineWidth = 1;
    const gridSize = 20;
    for (let x = 0; x <= canvas.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y <= canvas.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // מסגרת הפרגולה
    ctx.strokeStyle = '#1f2937';
    ctx.lineWidth = 4;
    ctx.strokeRect(startX, startY, scaledWidth, scaledLength);

    // צללה למסגרת
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.fillRect(startX + 3, startY + 3, scaledWidth, scaledLength);

    // מילוי פנימי של המסגרת
    ctx.fillStyle = 'rgba(59, 130, 246, 0.05)';
    ctx.fillRect(startX, startY, scaledWidth, scaledLength);

    // קורות הצללה
    ctx.strokeStyle = '#f97316';
    ctx.lineWidth = 3;
    
    const numBeams = Math.floor(config.width / config.beamSpacing) + 1;
    const actualSpacing = config.width / (numBeams - 1);

    for (let i = 0; i < numBeams; i++) {
      const x = startX + (i * actualSpacing * scale);
      
      // קורה
      ctx.beginPath();
      ctx.moveTo(x, startY);
      ctx.lineTo(x, startY + scaledLength);
      ctx.stroke();

      // צללה לקורה
      ctx.strokeStyle = 'rgba(249, 115, 22, 0.3)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x + 2, startY);
      ctx.lineTo(x + 2, startY + scaledLength);
      ctx.stroke();
      
      ctx.strokeStyle = '#f97316';
      ctx.lineWidth = 3;
    }

    // מידות וחץ מדידה - רוחב
    ctx.fillStyle = '#374151';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    
    // חץ עליון - רוחב
    const arrowY = startY - 30;
    drawArrow(ctx, startX, arrowY, startX + scaledWidth, arrowY);
    ctx.fillText(`${config.width} ס״מ`, startX + scaledWidth / 2, arrowY - 8);

    // חץ צדדי - אורך
    const arrowX = startX + scaledWidth + 30;
    drawArrow(ctx, arrowX, startY, arrowX, startY + scaledLength);
    ctx.save();
    ctx.translate(arrowX + 15, startY + scaledLength / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.fillText(`${config.length} ס״מ`, 0, 0);
    ctx.restore();

    // כותרת
    ctx.fillStyle = '#1f2937';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`פרגולה ${config.width}×${config.length} ס״מ`, canvas.width / 2, 25);
    
    // פרטים נוספים
    ctx.font = '12px Arial';
    ctx.fillText(`${numBeams} קורות | מרווח ${config.beamSpacing} ס״מ | פרופיל ${config.profileType}`, canvas.width / 2, 45);

  }, [config]);

  // פונקציה לציור חץ
  const drawArrow = (ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number) => {
    const arrowLength = 8;
    const angle = Math.atan2(y2 - y1, x2 - x1);

    // קו מרכזי
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    // חץ התחלה
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x1 + arrowLength * Math.cos(angle - Math.PI / 6), y1 + arrowLength * Math.sin(angle - Math.PI / 6));
    ctx.moveTo(x1, y1);
    ctx.lineTo(x1 + arrowLength * Math.cos(angle + Math.PI / 6), y1 + arrowLength * Math.sin(angle + Math.PI / 6));
    ctx.stroke();

    // חץ סיום
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - arrowLength * Math.cos(angle - Math.PI / 6), y2 - arrowLength * Math.sin(angle - Math.PI / 6));
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - arrowLength * Math.cos(angle + Math.PI / 6), y2 - arrowLength * Math.sin(angle + Math.PI / 6));
    ctx.stroke();
  };

  return (
    <div className="w-full h-full flex items-center justify-center bg-white rounded-lg border">
      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        className="max-w-full max-h-full border rounded-lg shadow-sm"
        style={{ background: 'white' }}
      />
    </div>
  );
};
