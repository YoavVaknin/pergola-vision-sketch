
import { Button } from "@/components/ui/button";
import { Box, Download, BarChart3, CheckCircle, Eye } from "lucide-react";
import { useState } from "react";
import { use3DModel } from "@/hooks/use3DModel";
import { PergolaElementType } from "@/types/pergola";
import { Model3DViewer } from "./Model3DViewer";

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
  const [showViewer, setShowViewer] = useState(true); // Show viewer by default
  const { 
    currentModel, 
    isGenerating, 
    generationError, 
    generationSuccess,
    generateModel, 
    exportModelJSON, 
    getStatistics 
  } = use3DModel();

  const handleGenerate = async () => {
    try {
      console.log('🚀 User clicked generate 3D model');
      console.log('📋 Current elements:', elements);
      console.log('⚙️ Settings:', { pixelsPerCm, frameColor });
      
      await generateModel(elements, pixelsPerCm, frameColor);
      console.log('✅ 3D model generated successfully!');
      
      // Auto-show viewer when model is generated
      setShowViewer(true);
    } catch (error) {
      console.error('❌ Failed to generate 3D model:', error);
    }
  };

  const handleExport = () => {
    try {
      console.log('💾 Exporting 3D model...');
      const jsonData = exportModelJSON();
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pergola-3d-model-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      console.log('✅ Model exported successfully');
    } catch (error) {
      console.error('❌ Failed to export model:', error);
    }
  };

  const stats = getStatistics();
  const hasElements = elements.length > 0;

  return (
    <div className="flex flex-col gap-4">
      {/* Control Panel */}
      <div className="flex flex-col gap-3 p-4 bg-gray-50 rounded-lg border">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <Box className="w-4 h-4" />
          מודל תלת־ממדי
        </div>
        
        {/* Status Messages */}
        {generationError && (
          <div className="text-sm text-red-600 bg-red-50 p-3 rounded border border-red-200">
            <strong>שגיאה:</strong> {generationError}
          </div>
        )}
        
        {generationSuccess && (
          <div className="text-sm text-green-600 bg-green-50 p-3 rounded border border-green-200 flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            <span>{generationSuccess}</span>
          </div>
        )}
        
        {!hasElements && (
          <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded border border-amber-200">
            יש לצייר מסגרת לפני יצירת מודל תלת־ממדי
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 flex-wrap">
          <Button
            onClick={handleGenerate}
            disabled={disabled || isGenerating || !hasElements}
            className="flex items-center gap-2"
            variant="default"
          >
            <Box className="w-4 h-4" />
            {isGenerating ? 'מייצר מודל...' : 'ייצור מודל תלת־ממדי'}
          </Button>

          {currentModel && (
            <>
              <Button
                onClick={() => setShowViewer(!showViewer)}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Eye className="w-4 h-4" />
                {showViewer ? 'הסתר תצוגה' : 'הצג תצוגה'}
              </Button>

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

        {/* Statistics Display */}
        {currentModel && showStats && stats && (
          <div className="bg-white p-4 rounded border">
            <h4 className="font-semibold mb-3 text-gray-800">סטטיסטיקות המודל:</h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">קורות מסגרת:</span>
                <span className="font-medium">{stats.meshCounts.frame}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">קורות חלוקה:</span>
                <span className="font-medium">{stats.meshCounts.division}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">קורות הצללה:</span>
                <span className="font-medium">{stats.meshCounts.shading}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">סה"כ meshes:</span>
                <span className="font-medium">{stats.meshCounts.total}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">רוחב:</span>
                <span className="font-medium">{stats.dimensions.width.toFixed(1)} ס"מ</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">עומק:</span>
                <span className="font-medium">{stats.dimensions.depth.toFixed(1)} ס"מ</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">גובה:</span>
                <span className="font-medium">{stats.dimensions.height.toFixed(1)} ס"מ</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">נפח:</span>
                <span className="font-medium">{(stats.volume / 1000000).toFixed(2)} מ"ק</span>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t text-xs text-gray-500">
              נוצר: {new Date(stats.generatedAt).toLocaleString('he-IL')}
            </div>
          </div>
        )}
        
        {/* Debug Info */}
        <div className="text-xs text-gray-500 bg-gray-100 p-2 rounded">
          אלמנטים זמינים: {elements.length} | קנה מידה: {pixelsPerCm} פיקסלים/ס"מ
        </div>
      </div>

      {/* 3D Viewer */}
      {currentModel && showViewer && (
        <div className="bg-white rounded-lg border shadow-sm">
          <Model3DViewer model={currentModel} width={600} height={400} />
        </div>
      )}
    </div>
  );
};
