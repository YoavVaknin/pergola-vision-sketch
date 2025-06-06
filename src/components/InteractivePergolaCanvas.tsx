
import { useEffect, useRef } from "react";
import { PergolaConfig } from "@/pages/CreateVisualization";

interface InteractivePergolaCanvasProps {
  config: PergolaConfig;
}

export const InteractivePergolaCanvas = ({ config }: InteractivePergolaCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // ניקוי הקנבס
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // הגדרות קנבס
    const canvasWidth = 800;
    const canvasHeight = 600;
    const padding = 60;

    // חישוב קנה מידה
    const availableWidth = canvasWidth - (padding * 2);
    const availableHeight = canvasHeight - (padding * 2);
    
    const scaleX = availableWidth / config.width;
    const scaleY = availableHeight / config.length;
    const scale = Math.min(scaleX, scaleY, 1);

    // מידות הפרגולה המוצגת
    const displayWidth = config.width * scale;
    const displayHeight = config.length * scale;
    
    // מיקום מרכזי
    const startX = (canvasWidth - displayWidth) / 2;
    const startY = (canvasHeight - displayHeight) / 2;

    // ציור רקע
    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // ציור רשת
    ctx.strokeStyle = '#e9ecef';
    ctx.lineWidth = 1;
    for (let i = 0; i <= canvasWidth; i += 20) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, canvasHeight);
      ctx.stroke();
    }
    for (let i = 0; i <= canvasHeight; i += 20) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(canvasWidth, i);
      ctx.stroke();
    }

    // ציור צל למלבן
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.fillRect(startX + 3, startY + 3, displayWidth, displayHeight);

    // ציור מלבן הפרגולה
    ctx.fillStyle = 'rgba(59, 130, 246, 0.05)';
    ctx.fillRect(startX, startY, displayWidth, displayHeight);

    // מסגרת המלבן
    ctx.strokeStyle = '#1f2937';
    ctx.lineWidth = 4;
    ctx.strokeRect(startX, startY, displayWidth, displayHeight);

    console.log(`Drawing pergola: ${config.width}x${config.length} cm, scale: ${scale.toFixed(2)}`);
  }, [config.width, config.length]);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-white rounded-lg border">
      {/* כותרת */}
      <div className="mb-4 text-center">
        <h3 className="text-lg font-semibold text-foreground">
          פרגולה {config.width}×{config.length} ס״מ
        </h3>
        <p className="text-sm text-muted-foreground">
          מסגרת {config.profile_frame}
        </p>
      </div>

      {/* אזור השרטוט */}
      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        className="border rounded-lg shadow-sm bg-white"
      />

      {/* מידע נוסף */}
      <div className="mt-4 text-center text-sm text-muted-foreground">
        <p>שטח כולל: {((config.width * config.length) / 10000).toFixed(2)} מ״ר</p>
      </div>
    </div>
  );
};
