
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Square, Minus, Circle, Zap, MousePointer, Trash2 } from "lucide-react";
import { DrawingState } from "@/types/pergola";

interface DrawingToolbarProps {
  mode: DrawingState['mode'];
  onModeChange: (mode: DrawingState['mode']) => void;
  onClear: () => void;
  isDrawing: boolean;
  onFinishFrame: () => void;
}

export const DrawingToolbar = ({ 
  mode, 
  onModeChange, 
  onClear, 
  isDrawing, 
  onFinishFrame 
}: DrawingToolbarProps) => {
  const tools = [
    { id: 'select' as const, icon: MousePointer, label: 'בחירה', color: 'bg-blue-500' },
    { id: 'frame' as const, icon: Square, label: 'מסגרת', color: 'bg-green-500' },
    { id: 'beam' as const, icon: Minus, label: 'קורה', color: 'bg-yellow-500' },
    { id: 'column' as const, icon: Circle, label: 'עמוד', color: 'bg-purple-500' },
    { id: 'wall' as const, icon: Zap, label: 'קיר', color: 'bg-red-500' },
  ];

  return (
    <Card className="p-4">
      <div className="flex flex-col gap-4">
        <h3 className="text-lg font-semibold">כלי שרטוט</h3>
        
        <div className="grid grid-cols-2 gap-2">
          {tools.map(tool => (
            <Button
              key={tool.id}
              variant={mode === tool.id ? "default" : "outline"}
              size="sm"
              onClick={() => onModeChange(tool.id)}
              className="flex items-center gap-2"
            >
              <tool.icon className="w-4 h-4" />
              {tool.label}
            </Button>
          ))}
        </div>

        {isDrawing && mode === 'frame' && (
          <Button 
            onClick={onFinishFrame}
            className="bg-green-600 hover:bg-green-700"
          >
            סיום מסגרת
          </Button>
        )}

        <Button 
          variant="destructive" 
          onClick={onClear}
          className="flex items-center gap-2"
        >
          <Trash2 className="w-4 h-4" />
          נקה הכל
        </Button>

        <div className="text-xs text-muted-foreground">
          <p><strong>מסגרת:</strong> לחץ לסימון נקודות</p>
          <p><strong>קורה:</strong> לחץ + גרור</p>
          <p><strong>עמוד:</strong> לחץ למיקום</p>
          <p><strong>קיר:</strong> לחץ + גרור</p>
        </div>
      </div>
    </Card>
  );
};
