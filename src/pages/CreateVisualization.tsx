
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Home } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PergolaForm } from "@/components/PergolaForm";
import { PergolaCanvas } from "@/components/PergolaCanvas";

export interface PergolaConfig {
  width: number;
  length: number;
  beamSpacing: number;
  profileType: string;
}

const CreateVisualization = () => {
  const navigate = useNavigate();
  const [config, setConfig] = useState<PergolaConfig>({
    width: 400,
    length: 300,
    beamSpacing: 50,
    profileType: "4/2"
  });

  const handleConfigChange = (newConfig: Partial<PergolaConfig>) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* כותרת עליונה */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate('/')}
                className="flex items-center gap-2"
              >
                <Home className="w-4 h-4" />
                חזור לדף הבית
              </Button>
              <div className="h-6 w-px bg-border"></div>
              <h1 className="text-2xl font-bold text-foreground">
                יצירת הדמיה חדשה
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">שלב 1 מתוך 3</span>
              <div className="flex gap-1">
                <div className="w-8 h-2 bg-primary rounded-full"></div>
                <div className="w-8 h-2 bg-muted rounded-full"></div>
                <div className="w-8 h-2 bg-muted rounded-full"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* תוכן ראשי */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-3 gap-6 h-full">
          {/* טופס פרמטרים */}
          <div className="lg:col-span-1">
            <Card className="p-6 h-fit">
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-2">פרמטרי הפרגולה</h2>
                <p className="text-sm text-muted-foreground">
                  הזן את המידות והמפרט של הפרגולה לקבלת הדמיה מדויקת
                </p>
              </div>
              <PergolaForm config={config} onConfigChange={handleConfigChange} />
            </Card>
          </div>

          {/* אזור השרטוט */}
          <div className="lg:col-span-2">
            <Card className="p-6 h-full">
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-2">תצוגה מקדימה</h2>
                <p className="text-sm text-muted-foreground">
                  הדמיה חיה של הפרגולה בהתאם לפרמטרים שהוזנו
                </p>
              </div>
              <PergolaCanvas config={config} />
            </Card>
          </div>
        </div>

        {/* כפתורי פעולה */}
        <div className="flex justify-between mt-6">
          <Button variant="outline" onClick={() => navigate('/')}>
            ביטול
          </Button>
          <Button className="flex items-center gap-2">
            המשך לשלב הבא
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CreateVisualization;
