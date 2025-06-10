
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, Fan, Square, Home, Palette } from "lucide-react";
import { AccessoryType, AccessoryConfig } from "@/hooks/usePergolaAccessories";

interface AccessoriesMenuProps {
  onAddAccessory: (type: AccessoryType) => void;
  accessoryConfig: AccessoryConfig;
  onConfigChange: (config: Partial<AccessoryConfig>) => void;
  accessoryCount: { [key in AccessoryType]: number };
}

export const AccessoriesMenu = ({ 
  onAddAccessory, 
  accessoryConfig, 
  onConfigChange,
  accessoryCount 
}: AccessoriesMenuProps) => {
  
  const accessories = [
    {
      type: 'column' as AccessoryType,
      name: 'עמודים',
      icon: Square,
      description: 'הוספת עמודי תמיכה',
      color: accessoryConfig.columns.color
    },
    {
      type: 'wall' as AccessoryType,
      name: 'קירות',
      icon: Home,
      description: 'הוספת קירות צד',
      color: accessoryConfig.walls.color
    },
    {
      type: 'light' as AccessoryType,
      name: 'תאורה',
      icon: Lightbulb,
      description: 'הוספת גופי תאורה',
      color: accessoryConfig.lights.color
    },
    {
      type: 'fan' as AccessoryType,
      name: 'מאווררים',
      icon: Fan,
      description: 'הוספת מאווררי תקרה',
      color: accessoryConfig.fans.color
    },
    {
      type: 'color' as AccessoryType,
      name: 'צבע פרופילים',
      icon: Palette,
      description: 'שינוי צבע המסגרת',
      color: accessoryConfig.frameColor
    }
  ];

  const handleColorChange = (type: AccessoryType, color: string) => {
    if (type === 'color') {
      onConfigChange({ frameColor: color });
    } else if (type === 'light') {
      onConfigChange({ lights: { ...accessoryConfig.lights, color } });
    } else if (type === 'fan') {
      onConfigChange({ fans: { ...accessoryConfig.fans, color } });
    } else if (type === 'column') {
      onConfigChange({ columns: { ...accessoryConfig.columns, color } });
    } else if (type === 'wall') {
      onConfigChange({ walls: { ...accessoryConfig.walls, color } });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">תוספות לפרגולה</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {accessories.map((accessory) => (
          <div key={accessory.type} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded" style={{ backgroundColor: accessory.color }}>
                <accessory.icon className="w-4 h-4" style={{ color: accessory.type === 'light' ? '#000' : '#fff' }} />
              </div>
              <div>
                <div className="font-medium">{accessory.name}</div>
                <div className="text-sm text-muted-foreground">{accessory.description}</div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {accessory.type !== 'color' && (
                <Badge variant="outline">
                  {accessoryCount[accessory.type] || 0}
                </Badge>
              )}
              
              <div className="flex items-center gap-1">
                <input
                  type="color"
                  value={accessory.color}
                  onChange={(e) => handleColorChange(accessory.type, e.target.value)}
                  className="w-6 h-6 rounded border cursor-pointer"
                  title="שינוי צבע"
                />
                
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onAddAccessory(accessory.type)}
                >
                  {accessory.type === 'color' ? 'החל' : 'הוסף'}
                </Button>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
