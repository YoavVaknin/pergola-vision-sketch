
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ArrowLeft, Maximize2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { FreeDrawingCanvas } from "@/components/FreeDrawingCanvas";
import { Model3DViewer } from "@/components/Model3DViewer";
import { use3DModel } from "@/hooks/use3DModel";

const CreateVisualization = () => {
  const navigate = useNavigate();
  const [model3DOpen, setModel3DOpen] = useState(false);
  const { currentModel } = use3DModel();

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
        <div className="grid lg:grid-cols-2 gap-8 h-[calc(100vh-200px)]">
          {/* Left Column - Free Drawing */}
          <div className="space-y-6">
            <Card className="h-full">
              <CardHeader>
                <CardTitle>שרטוט חופשי</CardTitle>
                <CardDescription>
                  שרטט בצורה חופשית את הפרגולה שלך
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[calc(100%-80px)]">
                <div className="h-full">
                  <FreeDrawingCanvas />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - 3D Preview */}
          <div className="space-y-6">
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>תצוגה תלת ממדית</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setModel3DOpen(true)}
                    className="flex items-center gap-2"
                  >
                    <Maximize2 className="w-4 h-4" />
                    הצג בגדול
                  </Button>
                </CardTitle>
                <CardDescription>
                  הדמיה תלת ממדית של הפרגולה
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[calc(100%-120px)]">
                <div className="h-full bg-muted rounded-lg overflow-hidden">
                  <Model3DViewer model={currentModel} />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* 3D Model Full Size Dialog */}
        <Dialog open={model3DOpen} onOpenChange={setModel3DOpen}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
            <DialogHeader>
              <DialogTitle>הדמיה תלת ממדית - תצוגה מלאה</DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-hidden">
              <div className="h-[600px]">
                <Model3DViewer model={currentModel} />
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
