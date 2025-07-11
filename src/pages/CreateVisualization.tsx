import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Pen, ArrowLeft, Ruler, Maximize2, Box } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { FreeDrawingCanvas } from "@/components/FreeDrawingCanvas";
import { Model3DViewer } from "@/components/Model3DViewer";
import { usePergolaDrawing } from "@/hooks/usePergolaDrawing";
import { usePergolaAccessories } from "@/hooks/usePergolaAccessories";
import { use3DModel } from "@/hooks/use3DModel";

const CreateVisualization = () => {
  const navigate = useNavigate();
  const [model3DOpen, setModel3DOpen] = useState(false);
  const [savedDrawings, setSavedDrawings] = useState<string[]>([]);

  // Initialize drawing hooks for 3D model generation
  const { elements, measurementConfig, shadingConfig } = usePergolaDrawing();
  const { accessoryConfig } = usePergolaAccessories();
  const { currentModel, generateModel } = use3DModel();

  // Auto-generate 3D model when elements change
  useEffect(() => {
    if (elements.length > 0) {
      const hasCompleteFrame = elements.some(el => el.type === 'frame');
      if (hasCompleteFrame) {
        generateModel(elements, measurementConfig.pixelsPerCm, accessoryConfig.frameColor, shadingConfig);
      }
    }
  }, [elements, measurementConfig.pixelsPerCm, accessoryConfig.frameColor, shadingConfig, generateModel]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              חזור לדף הבית
            </Button>
            <div className="h-6 w-px bg-border"></div>
            <h1 className="text-2xl font-bold text-foreground">
              עיצוב פרגולה
            </h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 h-[calc(100vh-120px)]">
        <div className="grid lg:grid-cols-2 gap-8 h-full">
          {/* Left Column - Free Drawing */}
          <div className="h-full">
            <FreeDrawingCanvas />
          </div>

          {/* Right Column - Preview */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Ruler className="w-5 h-5" />
                  תצוגה מקדימה
                </CardTitle>
                <CardDescription>
                  הדמיה תלת־ממדית של הפרגולה שלך
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative h-64 bg-muted rounded-lg overflow-hidden">
                  <Model3DViewer 
                    model={currentModel} 
                    width={undefined} 
                    height={undefined}
                  />
                  <Button
                    size="sm"
                    variant="secondary"
                    className="absolute top-2 right-2 opacity-80 hover:opacity-100"
                    onClick={() => setModel3DOpen(true)}
                  >
                    <Maximize2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Saved Drawings */}
            {savedDrawings.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>שרטוטים שמורים</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    {savedDrawings.map((drawing, index) => (
                      <div key={index} className="p-4 border rounded-lg bg-white">
                        <div className="h-24 bg-gray-100 rounded mb-2 flex items-center justify-center">
                          <Pen className="w-6 h-6 text-gray-400" />
                        </div>
                        <p className="text-sm font-medium">{drawing}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Large 3D Model Popup */}
        <Dialog open={model3DOpen} onOpenChange={setModel3DOpen}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Box className="w-5 h-5" />
                הדמיה תלת־ממדית
              </DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-hidden">
              <div className="h-[600px]">
                <Model3DViewer 
                  model={currentModel} 
                  width={undefined} 
                  height={undefined}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setModel3DOpen(false)}>
                סגור
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default CreateVisualization;