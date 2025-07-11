
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
    <div className="space-y-3">
      <h3 className="text-base font-semibold">כלי שרטוט</h3>
      
      <div className="grid grid-cols-3 gap-2">
        {tools.map(tool => (
          <Button
            key={tool.id}
            variant={mode === tool.id ? "default" : "outline"}
            size="sm"
            onClick={() => onModeChange(tool.id)}
            className="flex items-center gap-1 text-xs px-2 py-1"
          >
            <tool.icon className="w-3 h-3" />
            {tool.label}
          </Button>
        ))}
      </div>

      <div className="flex gap-2">
        {isDrawing && mode === 'frame' && (
          <Button 
            onClick={onFinishFrame}
            size="sm"
            className="bg-green-600 hover:bg-green-700 text-xs flex-1"
          >
            סיום מסגרת
          </Button>
        )}

        <Button 
          variant="destructive" 
          onClick={onClear}
          size="sm"
          className="flex items-center gap-1 text-xs"
        >
          <Trash2 className="w-3 h-3" />
          נקה
        </Button>
      </div>
    </div>
  );
};
