
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, Layers, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* כותרת ראשית */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            מערכת עיצוב פרגולות
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            צרו הדמיות מקצועיות לפרגולות בקלות - מהתכנון ועד לביצוע
          </p>
        </div>

        {/* כרטיסי פעולות */}
        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {/* יצירת הדמיה חדשה */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/create')}>
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <PlusCircle className="w-8 h-8 text-primary" />
              </div>
              <CardTitle className="text-xl">יצירת הדמיה חדשה</CardTitle>
              <CardDescription>
                התחל בעיצוב פרגולה חדשה עם כלי השרטוט האינטראקטיביים שלנו
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" onClick={() => navigate('/create')}>
                התחל עכשיו
              </Button>
            </CardContent>
          </Card>

          {/* הדמיות קיימות */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Layers className="w-8 h-8 text-secondary-foreground" />
              </div>
              <CardTitle className="text-xl">הדמיות קיימות</CardTitle>
              <CardDescription>
                גש לפרויקטים קיימים ומשך לערוך את ההדמיות שלך
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full" disabled>
                בקרוב
              </Button>
            </CardContent>
          </Card>

          {/* הגדרות */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Settings className="w-8 h-8 text-accent-foreground" />
              </div>
              <CardTitle className="text-xl">הגדרות</CardTitle>
              <CardDescription>
                התאם אישית את המערכת לצרכים שלך
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full" disabled>
                בקרוב
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* תכונות מרכזיות */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-center mb-8 text-foreground">
            תכונות מרכזיות
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <div className="w-6 h-6 bg-blue-500 rounded"></div>
              </div>
              <h3 className="font-semibold mb-2">עיצוב אינטראקטיבי</h3>
              <p className="text-sm text-muted-foreground">שרטוט חי ועדכון מיידי של הפרמטרים</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <div className="w-6 h-6 bg-green-500 rounded"></div>
              </div>
              <h3 className="font-semibold mb-2">מדידות מדויקות</h3>
              <p className="text-sm text-muted-foreground">חישוב אוטומטי של כמויות וממדים</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <div className="w-6 h-6 bg-purple-500 rounded"></div>
              </div>
              <h3 className="font-semibold mb-2">פרופילים מגוונים</h3>
              <p className="text-sm text-muted-foreground">תמיכה בסוגי פרופילים שונים</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <div className="w-6 h-6 bg-orange-500 rounded"></div>
              </div>
              <h3 className="font-semibold mb-2">יצוא והדפסה</h3>
              <p className="text-sm text-muted-foreground">שמירה ויצוא של ההדמיות</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
