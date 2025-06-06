
import { useEffect, useRef } from "react";
import { Stage, Layer, Rect, Line } from "react-konva";
import { PergolaConfig } from "@/pages/CreateVisualization";

interface InteractivePergolaCanvasProps {
  config: PergolaConfig;
}

export const InteractivePergolaCanvas = ({ config }: InteractivePergolaCanvasProps) => {
  const stageRef = useRef(null);

  // חישוב קנה מידה לפי גודל הקנבס
  const canvasWidth = 800;
  const canvasHeight = 600;
  const padding = 60;
  
  const availableWidth = canvasWidth - (padding * 2);
  const availableHeight = canvasHeight - (padding * 2);
  
  const scaleX = availableWidth / config.width;
  const scaleY = availableHeight / config.length;
  const scale = Math.min(scaleX, scaleY, 1); // מקסימום קנה מידה 1:1

  // מידות הפרגולה המוצגת
  const displayWidth = config.width * scale;
  const displayHeight = config.length * scale;
  
  // מיקום מרכזי
  const startX = (canvasWidth - displayWidth) / 2;
  const startY = (canvasHeight - displayHeight) / 2;

  // חישוב קורות הצללה
  const isVertical = config.beamSpacing > 0;
  const spacing = config.beamSpacing * scale;
  const beamCount = Math.floor(config.width / config.beamSpacing) + 1;

  const beams = [];
  for (let i = 0; i < beamCount; i++) {
    const pos = startX + (i * config.beamSpacing * scale);
    if (pos <= startX + displayWidth) {
      beams.push({
        key: i,
        points: [pos, startY, pos, startY + displayHeight]
      });
    }
  }

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-white rounded-lg border">
      {/* כותרת */}
      <div className="mb-4 text-center">
        <h3 className="text-lg font-semibold text-foreground">
          פרגולה {config.width}×{config.length} ס״מ
        </h3>
        <p className="text-sm text-muted-foreground">
          {beamCount} קורות | מרווח {config.beamSpacing} ס״מ | מסגרת {config.profile_frame}
        </p>
      </div>

      {/* אזור השרטוט */}
      <Stage 
        width={canvasWidth} 
        height={canvasHeight}
        ref={stageRef}
        className="border rounded-lg shadow-sm"
      >
        <Layer>
          {/* רקע עם רשת */}
          <Rect
            x={0}
            y={0}
            width={canvasWidth}
            height={canvasHeight}
            fill="#f8f9fa"
          />
          
          {/* רשת רקע */}
          {Array.from({ length: Math.floor(canvasWidth / 20) }, (_, i) => (
            <Line
              key={`grid-v-${i}`}
              points={[i * 20, 0, i * 20, canvasHeight]}
              stroke="#e9ecef"
              strokeWidth={1}
            />
          ))}
          {Array.from({ length: Math.floor(canvasHeight / 20) }, (_, i) => (
            <Line
              key={`grid-h-${i}`}
              points={[0, i * 20, canvasWidth, i * 20]}
              stroke="#e9ecef"
              strokeWidth={1}
            />
          ))}

          {/* צללה למסגרת */}
          <Rect
            x={startX + 3}
            y={startY + 3}
            width={displayWidth}
            height={displayHeight}
            fill="rgba(0, 0, 0, 0.1)"
          />

          {/* מילוי פנימי של המסגרת */}
          <Rect
            x={startX}
            y={startY}
            width={displayWidth}
            height={displayHeight}
            fill="rgba(59, 130, 246, 0.05)"
          />

          {/* מסגרת הפרגולה */}
          <Rect
            x={startX}
            y={startY}
            width={displayWidth}
            height={displayHeight}
            stroke="#1f2937"
            strokeWidth={4}
            fill="transparent"
          />

          {/* קורות הצללה */}
          {beams.map((beam) => (
            <Line
              key={beam.key}
              points={beam.points}
              stroke="#f97316"
              strokeWidth={3}
            />
          ))}

          {/* צללות לקורות */}
          {beams.map((beam) => (
            <Line
              key={`shadow-${beam.key}`}
              points={[beam.points[0] + 2, beam.points[1], beam.points[2] + 2, beam.points[3]]}
              stroke="rgba(249, 115, 22, 0.3)"
              strokeWidth={1}
            />
          ))}
        </Layer>
      </Stage>

      {/* מידע נוסף */}
      <div className="mt-4 text-center text-sm text-muted-foreground">
        <p>שטח כולל: {((config.width * config.length) / 10000).toFixed(2)} מ״ר</p>
      </div>
    </div>
  );
};
