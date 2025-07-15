import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Pen, Box, ArrowLeft, Ruler, Save } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { FreeDrawingCanvas } from "@/components/FreeDrawingCanvas";
import { Model3DViewer } from "@/components/Model3DViewer";
const CreateVisualization = () => {
  const navigate = useNavigate();
  const [freeDrawingOpen, setFreeDrawingOpen] = useState(false);
  const [model3DOpen, setModel3DOpen] = useState(false);
  const [savedDrawings, setSavedDrawings] = useState<string[]>([]);
  const [saved3DModels, setSaved3DModels] = useState<string[]>([]);
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
  return <div className="min-h-screen bg-white">
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/')} className="flex items-center gap-2">
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
        {/* Free Drawing Canvas - Full Width */}
        <div className="w-full">
          <FreeDrawingCanvas />
        </div>
      </div>
    </div>;
};
export default CreateVisualization;