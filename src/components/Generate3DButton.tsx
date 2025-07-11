
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Box, Download, BarChart3 } from 'lucide-react';
import { PergolaElementType, ShadingConfig } from '@/types/pergola';
import { use3DModel } from '@/hooks/use3DModel';
import { Model3DViewer } from './Model3DViewer';
import { toast } from 'sonner';

interface Generate3DButtonProps {
  elements: PergolaElementType[];
  pixelsPerCm: number;
  frameColor: string;
  shadingConfig: ShadingConfig;
  disabled?: boolean;
}

export const Generate3DButton: React.FC<Generate3DButtonProps> = ({
  elements,
  pixelsPerCm,
  frameColor,
  shadingConfig,
  disabled = false
}) => {
  const [showViewer, setShowViewer] = useState(false);
  const {
    currentModel,
    isGenerating,
    generationError,
    generationSuccess,
    generateModel,
    exportModelJSON,
    getStatistics,
    clearModel
  } = use3DModel();

  const handleGenerate = async () => {
    try {
      console.log('🎯 Generating 3D model with config:', {
        elements: elements.length,
        pixelsPerCm,
        frameColor,
        shadingConfig
      });
      
      await generateModel(elements, pixelsPerCm, frameColor, shadingConfig);
      toast.success('המודל התלת-ממדי נוצר בהצלחה!');
    } catch (error) {
      console.error('❌ Error generating model:', error);
      toast.error('שגיאה בייצור המודל התלת-ממדי');
    }
  };

  const handleExport = () => {
    try {
      const jsonData = exportModelJSON();
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pergola-model-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('המודל יוצא בהצלחה!');
    } catch (error) {
      toast.error('שגיאה בייצוא המודל');
    }
  };

  const statistics = getStatistics();
  const hasFrameElements = elements.some(el => el.type === 'frame');

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Box className="w-5 h-5" />
            ייצור מודל תלת-ממדי
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground">
            <p>דגם נוכחי: <span className="font-medium">
              {shadingConfig.pergolaModel === 'bottom_shading' ? 'הצללה תחתונה' :
               shadingConfig.pergolaModel === 'top_shading' ? 'הצללה עליונה' : 'דגם טי'}
            </span></p>
            {hasFrameElements && (
              <p>פרופילים: מסגרת {shadingConfig.frameProfile.width}×{shadingConfig.frameProfile.height}, 
                 חלוקה {shadingConfig.divisionProfile.width}×{shadingConfig.divisionProfile.height}, 
                 הצללה {shadingConfig.shadingProfile.width}×{shadingConfig.shadingProfile.height}</p>
            )}
          </div>

          <Button
            onClick={handleGenerate}
            disabled={disabled || !hasFrameElements || isGenerating}
            className="w-full"
            size="lg"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                מייצר מודל...
              </>
            ) : (
              <>
                <Box className="w-4 h-4 mr-2" />
                צור מודל תלת-ממדי
              </>
            )}
          </Button>

          {!hasFrameElements && (
            <p className="text-sm text-muted-foreground text-center">
              יש לצייר מסגרת לפני ייצור המודל התלת-ממדי
            </p>
          )}

          {generationError && (
            <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
              {generationError}
            </div>
          )}

          {generationSuccess && (
            <div className="text-sm text-green-600 bg-green-50 p-2 rounded">
              {generationSuccess}
            </div>
          )}

          {currentModel && (
            <div className="space-y-2">
              <div className="flex gap-2">
                <Button
                  onClick={() => setShowViewer(!showViewer)}
                  variant="outline"
                  size="sm"
                  className="flex-1"
                >
                  <Box className="w-4 h-4 mr-1" />
                  {showViewer ? 'הסתר הדמיה' : 'הצג הדמיה'}
                </Button>
                <Button
                  onClick={handleExport}
                  variant="outline"
                  size="sm"
                  className="flex-1"
                >
                  <Download className="w-4 h-4 mr-1" />
                  ייצוא JSON
                </Button>
                <Button
                  onClick={clearModel}
                  variant="outline"
                  size="sm"
                  className="flex-1"
                >
                  נקה מודל
                </Button>
              </div>

              {statistics && (
                <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
                  <div className="flex items-center gap-1 mb-1">
                    <BarChart3 className="w-3 h-3" />
                    <span className="font-medium">סטטיסטיקות:</span>
                  </div>
                  <p>קורות מסגרת: {statistics.meshCounts.frameBeams}</p>
                  <p>קורות חלוקה: {statistics.meshCounts.divisionBeams}</p>
                  <p>רצועות הצללה: {statistics.meshCounts.shadingSlats}</p>
                  <p>עמודים: {statistics.meshCounts.columns}</p>
                  <p>סה"כ רכיבים: {statistics.meshCounts.total}</p>
                  <p>מימדים: {statistics.dimensions.width.toFixed(1)}×{statistics.dimensions.depth.toFixed(1)}×{statistics.dimensions.height.toFixed(1)} ס"מ</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {currentModel && showViewer && (
        <Model3DViewer model={currentModel} width={400} height={300} />
      )}
    </div>
  );
};
