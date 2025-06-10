
import { Button } from "@/components/ui/button";
import { Box, Download, BarChart3 } from "lucide-react";
import { useState } from "react";
import { use3DModel } from "@/hooks/use3DModel";
import { PergolaElementType } from "@/types/pergola";

interface Generate3DButtonProps {
  elements: PergolaElementType[];
  pixelsPerCm: number;
  frameColor: string;
  disabled?: boolean;
}

export const Generate3DButton = ({ 
  elements, 
  pixelsPerCm, 
  frameColor, 
  disabled = false 
}: Generate3DButtonProps) => {
  const [showStats, setShowStats] = useState(false);
  const { 
    currentModel, 
    isGenerating, 
    generationError, 
    generateModel, 
    exportModelJSON, 
    getStatistics 
  } = use3DModel();

  const handleGenerate = async () => {
    try {
      await generateModel(elements, pixelsPerCm, frameColor);
      console.log('3D model generated successfully!');
    } catch (error) {
      console.error('Failed to generate 3D model:', error);
    }
  };

  const handleExport = () => {
    try {
      const jsonData = exportModelJSON();
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'pergola-3d-model.json';
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export model:', error);
    }
  };

  const stats = getStatistics();

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <Button
          onClick={handleGenerate}
          disabled={disabled || isGenerating || elements.length === 0}
          className="flex items-center gap-2"
          variant="default"
        >
          <Box className="w-4 h-4" />
          {isGenerating ? 'מייצר מודל...' : 'ייצור מודל תלת־ממדי'}
        </Button>

        {currentModel && (
          <>
            <Button
              onClick={handleExport}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              ייצוא JSON
            </Button>

            <Button
              onClick={() => setShowStats(!showStats)}
              variant="outline"
              className="flex items-center gap-2"
            >
              <BarChart3 className="w-4 h-4" />
              סטטיסטיקות
            </Button>
          </>
        )}
      </div>

      {generationError && (
        <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
          שגיאה: {generationError}
        </div>
      )}

      {currentModel && showStats && stats && (
        <div className="bg-gray-50 p-3 rounded text-sm">
          <h4 className="font-semibold mb-2">סטטיסטיקות המודל:</h4>
          <div className="grid grid-cols-2 gap-2">
            <div>קורות מסגרת: {stats.beamCounts.frame}</div>
            <div>קורות חלוקה: {stats.beamCounts.division}</div>
            <div>קורות הצללה: {stats.beamCounts.shading}</div>
            <div>פאנלי הצללה: {stats.shadingPanels}</div>
            <div>אורך כולל: {stats.lengths.total.toFixed(1)} ס"מ</div>
            <div>נפח: {stats.volume.toFixed(1)} ס"מ³</div>
            <div>רוחב: {stats.dimensions.width.toFixed(1)} ס"מ</div>
            <div>עומק: {stats.dimensions.depth.toFixed(1)} ס"מ</div>
          </div>
        </div>
      )}
    </div>
  );
};
