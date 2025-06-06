
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { FreeDrawingCanvas } from "@/components/FreeDrawingCanvas";

const FreeDrawing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/create')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              חזור לעיצוב פרמטרי
            </Button>
            <div className="h-6 w-px bg-border"></div>
            <h1 className="text-2xl font-bold text-foreground">
              שרטוט חופשי
            </h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <FreeDrawingCanvas />
      </div>
    </div>
  );
};

export default FreeDrawing;
