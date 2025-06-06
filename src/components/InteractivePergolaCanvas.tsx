
import { useEffect, useRef } from "react";
import { PergolaConfig } from "@/pages/CreateVisualization";

interface InteractivePergolaCanvasProps {
  config: PergolaConfig;
}

export const InteractivePergolaCanvas = ({ config }: InteractivePergolaCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // פונקציה להמרת שמות צבעים לקודי צבע
  const getColorCode = (colorName: string): string => {
    const colorMap: { [key: string]: string } = {
      "שחור": "#1f2937",
      "לבן": "#ffffff", 
      "אפור גרפיט": "#6b7280",
      "עץ כהה": "#8b4513",
      "שמנת": "#f5f5dc"
    };
    return colorMap[colorName] || "#1f2937";
  };

  // פונקציה לחישוב מיקומי עמודים
  const getColumnPositions = () => {
    const positions = [];
    const columnSize = 8; // גודל העמוד בפיקסלים

    if (config.column_placement === "corners") {
      // 4 עמודים בפינות
      positions.push(
        { x: 0, y: 0 },
        { x: config.width, y: 0 },
        { x: 0, y: config.length },
        { x: config.width, y: config.length }
      );
    } else if (config.column_placement === "perimeter") {
      // עמודים לאורך היקף - כל 200 ס״מ
      const spacing = 200;
      
      // עמודים לאורך הרוחב העליון
      for (let x = 0; x <= config.width; x += spacing) {
        positions.push({ x: Math.min(x, config.width), y: 0 });
      }
      
      // עמודים לאורך הרוחב התחתון
      for (let x = 0; x <= config.width; x += spacing) {
        positions.push({ x: Math.min(x, config.width), y: config.length });
      }
      
      // עמודים לאורך האורך השמאלי (ללא פינות)
      for (let y = spacing; y < config.length; y += spacing) {
        positions.push({ x: 0, y });
      }
      
      // עמודים לאורך האורך הימני (ללא פינות)
      for (let y = spacing; y < config.length; y += spacing) {
        positions.push({ x: config.width, y });
      }
    }

    return positions;
  };

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

    // מסגרת המלבן בצבע שנבחר
    ctx.strokeStyle = getColorCode(config.color_frame);
    ctx.lineWidth = 4;
    ctx.strokeRect(startX, startY, displayWidth, displayHeight);

    // ציור קירות
    ctx.strokeStyle = '#374151'; // אפור כהה לקירות
    ctx.lineWidth = 6;

    if (config.wall_front) {
      // קיר קדמי (עליון)
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(startX + displayWidth, startY);
      ctx.stroke();
    }

    if (config.wall_back) {
      // קיר אחורי (תחתון)
      ctx.beginPath();
      ctx.moveTo(startX, startY + displayHeight);
      ctx.lineTo(startX + displayWidth, startY + displayHeight);
      ctx.stroke();
    }

    if (config.wall_left) {
      // קיר שמאלי
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(startX, startY + displayHeight);
      ctx.stroke();
    }

    if (config.wall_right) {
      // קיר ימני
      ctx.beginPath();
      ctx.moveTo(startX + displayWidth, startY);
      ctx.lineTo(startX + displayWidth, startY + displayHeight);
      ctx.stroke();
    }

    // ציור קורות הצללה בצבע שנבחר
    ctx.strokeStyle = getColorCode(config.color_shading);
    ctx.lineWidth = 2;

    const spacingInPixels = config.beamSpacing * scale;

    if (config.beamSpacing > 0) {
      if (config.beamDirection === 0) {
        // קורות אנכיות (מקבילות לגובה)
        for (let x = spacingInPixels; x < displayWidth; x += spacingInPixels) {
          ctx.beginPath();
          ctx.moveTo(startX + x, startY);
          ctx.lineTo(startX + x, startY + displayHeight);
          ctx.stroke();
        }
      } else if (config.beamDirection === 90) {
        // קורות אופקיות (מקבילות לרוחב)
        for (let y = spacingInPixels; y < displayHeight; y += spacingInPixels) {
          ctx.beginPath();
          ctx.moveTo(startX, startY + y);
          ctx.lineTo(startX + displayWidth, startY + y);
          ctx.stroke();
        }
      }
    }

    // ציור עמודים
    const columnPositions = getColumnPositions();
    ctx.fillStyle = '#374151'; // אפור כהה לעמודים
    ctx.strokeStyle = '#111827'; // מסגרת כהה יותר לעמודים
    ctx.lineWidth = 1;

    columnPositions.forEach(pos => {
      const columnX = startX + (pos.x * scale) - 4; // מרכז העמוד
      const columnY = startY + (pos.y * scale) - 4;
      const columnSize = 8;

      // ציור עמוד כמלבן קטן
      ctx.fillRect(columnX, columnY, columnSize, columnSize);
      ctx.strokeRect(columnX, columnY, columnSize, columnSize);
    });

    console.log(`Drawing pergola: ${config.width}x${config.length} cm, scale: ${scale.toFixed(2)}, beams: ${config.beamSpacing}cm spacing, direction: ${config.beamDirection}°, frame color: ${config.color_frame}, shading color: ${config.color_shading}, columns: ${columnPositions.length} (${config.column_placement}), walls: front=${config.wall_front}, back=${config.wall_back}, left=${config.wall_left}, right=${config.wall_right}`);
  }, [config.width, config.length, config.beamSpacing, config.beamDirection, config.color_frame, config.color_shading, config.columns, config.column_placement, config.wall_front, config.wall_back, config.wall_left, config.wall_right]);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-white rounded-lg border">
      {/* כותרת */}
      <div className="mb-4 text-center">
        <h3 className="text-lg font-semibold text-foreground">
          פרגולה {config.width}×{config.length} ס״מ
        </h3>
        <p className="text-sm text-muted-foreground">
          מסגרת {config.profile_frame} ({config.color_frame}) | מרווח קורות {config.beamSpacing} ס״מ ({config.color_shading}) | עמודים: {config.column_placement === "corners" ? "4 בפינות" : config.columns} | קירות: {[config.wall_front, config.wall_back, config.wall_left, config.wall_right].filter(Boolean).length}
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
