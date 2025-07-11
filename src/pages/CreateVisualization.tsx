
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Pen, Box, ArrowLeft, Ruler, Save } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { FreeDrawingCanvas } from "@/components/FreeDrawingCanvas";
import { Model3DViewer } from "@/components/Model3DViewer";
import { Generate3DButton } from "@/components/Generate3DButton";
import { AccessoriesMenu } from "@/components/AccessoriesMenu";
import { ShadingConfigComponent } from "@/components/ShadingConfig";
import { usePergolaDrawing } from "@/hooks/usePergolaDrawing";
import { usePergolaAccessories, AccessoryType } from "@/hooks/usePergolaAccessories";

const CreateVisualization = () => {
  const navigate = useNavigate();
  const [freeDrawingOpen, setFreeDrawingOpen] = useState(false);
  const [model3DOpen, setModel3DOpen] = useState(false);
  const [savedDrawings, setSavedDrawings] = useState<string[]>([]);
  const [saved3DModels, setSaved3DModels] = useState<string[]>([]);

  // Initialize drawing and accessories hooks
  const { elements, measurementConfig, updateMeasurementConfig, shadingConfig, updateShadingConfig } = usePergolaDrawing();
  const { 
    accessories, 
    accessoryConfig, 
    updateAccessoryConfig, 
    addAccessory 
  } = usePergolaAccessories();

  const handleAddAccessory = (type: AccessoryType) => {
    // For the popup version, we'll add accessories at a default position
    const defaultPosition = { x: 100, y: 100 };
    addAccessory(type, defaultPosition);
  };

  // Calculate accessory counts
  const accessoryCount = accessories.reduce((count, acc) => {
    count[acc.type] = (count[acc.type] || 0) + 1;
    return count;
  }, {} as Record<AccessoryType, number>);

  const handleSaveDrawing = () => {
    // Here you would implement the actual save logic
    // For now, just add a placeholder
    setSavedDrawings(prev => [...prev, `שרטוט ${prev.length + 1}`]);
    setFreeDrawingOpen(false);
  };

  const handleSave3DModel = () => {
    // Here you would implement the actual save logic
    // For now, just add a placeholder
    setSaved3DModels(prev => [...prev, `מודל ${prev.length + 1}`]);
    setModel3DOpen(false);
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

            {/* 3D Model Modal Trigger */}
            <Dialog open={model3DOpen} onOpenChange={setModel3DOpen}>
              <DialogTrigger asChild>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader className="text-center">
                    <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Box className="w-8 h-8 text-purple-600" />
                    </div>
                    <CardTitle className="text-xl">מודל תלת־ממדי</CardTitle>
                    <CardDescription>
                      צור והצג מודל תלת־ממדי של הפרגולה
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button className="w-full">
                      פתח חלון מודל 3D
                    </Button>
                  </CardContent>
                </Card>
              </DialogTrigger>
              <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Box className="w-5 h-5" />
                    הדמיה תלת־ממדית מתקדמת
                  </DialogTitle>
                </DialogHeader>
                <div className="flex-1 overflow-hidden">
                  <div className="flex gap-6 h-full">
                    {/* Left side - 3D Model Viewer */}
                    <div className="flex-1">
                      <div className="mb-4">
                        <Generate3DButton
                          elements={elements}
                          pixelsPerCm={measurementConfig.pixelsPerCm}
                          frameColor={accessoryConfig.frameColor}
                          shadingConfig={shadingConfig}
                          disabled={elements.length === 0}
                        />
                      </div>
                      
                      {/* Large 3D viewer */}
                      <div className="h-[500px]">
                        <Model3DViewer 
                          model={null} 
                          width={undefined} 
                          height={undefined}
                        />
                      </div>
                    </div>

                    {/* Right side - Settings */}
                    <div className="w-80 space-y-4 overflow-y-auto">
                      <AccessoriesMenu
                        onAddAccessory={handleAddAccessory}
                        accessoryConfig={accessoryConfig}
                        onConfigChange={updateAccessoryConfig}
                        accessoryCount={accessoryCount}
                      />
                      
                      <ShadingConfigComponent
                        config={shadingConfig}
                        onConfigChange={updateShadingConfig}
                      />

                      <div className="p-4 bg-muted rounded-lg">
                        <h4 className="font-semibold mb-2">הגדרות מדידה</h4>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <label className="text-sm">הצג אורכים</label>
                            <input
                              type="checkbox"
                              checked={measurementConfig.showLengths}
                              onChange={(e) => updateMeasurementConfig({ showLengths: e.target.checked })}
                              className="rounded"
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <label className="text-sm">הצג שטח</label>
                            <input
                              type="checkbox"
                              checked={measurementConfig.showArea}
                              onChange={(e) => updateMeasurementConfig({ showArea: e.target.checked })}
                              className="rounded"
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <label className="text-sm">הצג זוויות</label>
                            <input
                              type="checkbox"
                              checked={measurementConfig.showAngles}
                              onChange={(e) => updateMeasurementConfig({ showAngles: e.target.checked })}
                              className="rounded"
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <label className="text-sm">יחידת מדידה</label>
                            <select
                              value={measurementConfig.unit}
                              onChange={(e) => updateMeasurementConfig({ unit: e.target.value as any })}
                              className="text-sm border rounded px-2 py-1"
                            >
                              <option value="cm">ס״מ</option>
                              <option value="mm">מ״מ</option>
                              <option value="m">מטר</option>
                            </select>
                          </div>
                          <div className="flex items-center justify-between">
                            <label className="text-sm">סקלה (פיקסלים/ס״מ)</label>
                            <input
                              type="number"
                              value={measurementConfig.pixelsPerCm}
                              onChange={(e) => updateMeasurementConfig({ pixelsPerCm: parseFloat(e.target.value) || 2 })}
                              className="text-sm border rounded px-2 py-1 w-16"
                              min="0.1"
                              step="0.1"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button variant="outline" onClick={() => setModel3DOpen(false)}>
                    סגור
                  </Button>
                  <Button onClick={handleSave3DModel} className="flex items-center gap-2">
                    <Save className="w-4 h-4" />
                    שמור מודל
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
                <div className="h-64 bg-muted rounded-lg flex items-center justify-center">
                  <p className="text-muted-foreground">תצוגה מקדימה תופיע כאן</p>
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

            {/* Saved 3D Models */}
            {saved3DModels.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>מודלים תלת־ממדיים שמורים</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    {saved3DModels.map((model, index) => (
                      <div key={index} className="p-4 border rounded-lg bg-white">
                        <div className="h-24 bg-gray-100 rounded mb-2 flex items-center justify-center">
                          <Box className="w-6 h-6 text-gray-400" />
                        </div>
                        <p className="text-sm font-medium">{model}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateVisualization;
