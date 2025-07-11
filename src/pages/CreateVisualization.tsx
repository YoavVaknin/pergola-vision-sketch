
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Pen, ArrowLeft, Ruler, Save, Maximize2, Box } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { FreeDrawingCanvas } from "@/components/FreeDrawingCanvas";
import { Model3DViewer } from "@/components/Model3DViewer";
import { usePergolaDrawing } from "@/hooks/usePergolaDrawing";
import { usePergolaAccessories } from "@/hooks/usePergolaAccessories";
import { use3DModel } from "@/hooks/use3DModel";

const CreateVisualization = () => {
  const navigate = useNavigate();
  const [freeDrawingOpen, setFreeDrawingOpen] = useState(false);
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

  const handleSaveDrawing = () => {
    // Here you would implement the actual save logic
    // For now, just add a placeholder
    setSavedDrawings(prev => [...prev, `שרטוט ${prev.length + 1}`]);
    setFreeDrawingOpen(false);
  };

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

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Column - Drawing Tools */}
          <div className="space-y-6">
            {/* Free Drawing Modal Trigger */}
            <Dialog open={freeDrawingOpen} onOpenChange={setFreeDrawingOpen}>
              <DialogTrigger asChild>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader className="text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Pen className="w-8 h-8 text-green-600" />
                    </div>
                    <CardTitle className="text-xl">שרטוט חופשי</CardTitle>
                    <CardDescription>
                      שרטט בצורה חופשית את הפרגולה שלך
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button className="w-full">
                      פתח חלון שרטוט
                    </Button>
                  </CardContent>
                </Card>
              </DialogTrigger>
              <DialogContent className="max-w-7xl max-h-[90vh] overflow-hidden">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Pen className="w-5 h-5" />
                    שרטוט חופשי
                  </DialogTitle>
                </DialogHeader>
                  <div className="flex-1 overflow-hidden">
                    <FreeDrawingCanvas />
                  </div>
                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button variant="outline" onClick={() => setFreeDrawingOpen(false)}>
                    סגור
                  </Button>
                  <Button onClick={handleSaveDrawing} className="flex items-center gap-2">
                    <Save className="w-4 h-4" />
                    שמור שרטוט
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Right Column - Saved Items */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Ruler className="w-5 h-5" />
                  תצוגה מקדימה
                </CardTitle>
                <CardDescription>
                  כאן תוצג התצוגה המקדימה של הפרגולה
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
    </div>
  );
};

export default CreateVisualization;
