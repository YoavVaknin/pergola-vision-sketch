
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft, 
  Box, 
  Wrench, 
  FileText, 
  Download, 
  HelpCircle,
  Save,
  Layers,
  Settings
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { FreeDrawingCanvas } from "@/components/FreeDrawingCanvas";
import { Model3DViewer } from "@/components/Model3DViewer";
import { DrawingToolbar } from "@/components/DrawingToolbar";
import { DrawingState } from "@/types/pergola";

const CreateVisualization = () => {
  const navigate = useNavigate();
  const [drawingToolsOpen, setDrawingToolsOpen] = useState(false);
  const [model3DOpen, setModel3DOpen] = useState(false);
  
  // Drawing state for toolbar
  const [drawingMode, setDrawingMode] = useState<DrawingState['mode']>('select');
  const [isDrawing, setIsDrawing] = useState(false);

  const handleExportJSON = () => {
    // TODO: Implement JSON export logic
    console.log("Exporting JSON...");
  };

  const handleExportPDF = () => {
    // TODO: Implement PDF export logic
    console.log("Exporting PDF...");
  };

  const handleModeChange = (mode: DrawingState['mode']) => {
    setDrawingMode(mode);
  };

  const handleClear = () => {
    // TODO: Implement clear functionality
    console.log("Clearing drawing...");
  };

  const handleFinishFrame = () => {
    setIsDrawing(false);
    // TODO: Implement finish frame functionality
    console.log("Finishing frame...");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
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
              שרטוט פרגולה
            </h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Main Drawing Area */}
        <div className="bg-white rounded-lg shadow-lg mb-6 relative">
          <div className="h-[70vh]">
            <FreeDrawingCanvas />
          </div>
          
          {/* Drawing Tools Button - Floating */}
          <Dialog open={drawingToolsOpen} onOpenChange={setDrawingToolsOpen}>
            <DialogTrigger asChild>
              <Button 
                size="lg" 
                className="absolute top-4 right-4 z-10 shadow-lg"
              >
                <Wrench className="w-5 h-5 mr-2" />
                כלי שרטוט
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Wrench className="w-5 h-5" />
                  כלי שרטוט וקירות
                </DialogTitle>
              </DialogHeader>
              <div className="flex-1 overflow-auto">
                <div className="space-y-6 p-4">
                  <DrawingToolbar 
                    mode={drawingMode}
                    onModeChange={handleModeChange}
                    onClear={handleClear}
                    isDrawing={isDrawing}
                    onFinishFrame={handleFinishFrame}
                  />
                  
                  {/* Additional tools will be added here */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Layers className="w-4 h-4" />
                          שכבות
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">
                          ניהול שכבות השרטוט יתווסף בקרוב
                        </p>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Settings className="w-4 h-4" />
                          הגדרות
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">
                          הגדרות נוספות יתווספו בקרוב
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setDrawingToolsOpen(false)}>
                  סגור
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Bottom Tabs */}
        <Tabs defaultValue="3d-model" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="3d-model" className="flex items-center gap-2">
              <Box className="w-4 h-4" />
              מודל תלת־ממד
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              דוחות / JSON
            </TabsTrigger>
            <TabsTrigger value="instructions" className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4" />
              הוראות
            </TabsTrigger>
          </TabsList>

          <TabsContent value="3d-model" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Box className="w-5 h-5" />
                  צפייה במודל תלת־ממדי
                </CardTitle>
                <CardDescription>
                  לחץ לפתיחת חלון מודל תלת־ממדי מלא
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Dialog open={model3DOpen} onOpenChange={setModel3DOpen}>
                  <DialogTrigger asChild>
                    <Button size="lg" className="w-full">
                      <Box className="w-5 h-5 mr-2" />
                      פתח חלון תלת־ממד
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <Box className="w-5 h-5" />
                        מודל תלת־ממדי
                      </DialogTitle>
                    </DialogHeader>
                    <div className="flex-1 overflow-hidden">
                      <div className="h-[600px]">
                        <Model3DViewer model={null} />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-4 border-t">
                      <Button variant="outline" onClick={() => setModel3DOpen(false)}>
                        סגור
                      </Button>
                      <Button className="flex items-center gap-2">
                        <Save className="w-4 h-4" />
                        שמור מודל
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  יצוא דוחות
                </CardTitle>
                <CardDescription>
                  ייצא את השרטוט בפורמטים שונים
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <Button onClick={handleExportJSON} className="flex items-center gap-2">
                    <Download className="w-4 h-4" />
                    ייצא JSON
                  </Button>
                  <Button onClick={handleExportPDF} className="flex items-center gap-2">
                    <Download className="w-4 h-4" />
                    ייצא PDF
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="instructions" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HelpCircle className="w-5 h-5" />
                  הוראות שימוש
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <h4 className="font-medium">שרטוט:</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    <li>לחץ לבחירת נקודות השרטוט</li>
                    <li>השתמש בכפתור "כלי שרטוט" לפתיחת אפשרויות נוספות</li>
                    <li>גרור לתזוזה, השתמש בגלגלת העכבר לזום</li>
                  </ul>
                  
                  <h4 className="font-medium">מודל תלת־ממד:</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    <li>לחץ על "פתח חלון תלת־ממד" לצפייה במודל</li>
                    <li>המודל מתעדכן אוטומטית על פי השרטוט</li>
                  </ul>
                  
                  <h4 className="font-medium">ייצא:</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    <li>השתמש בלשונית "דוחות / JSON" לייצא את העבודה</li>
                    <li>זמין ייצוא ב־JSON ו־PDF</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default CreateVisualization;
