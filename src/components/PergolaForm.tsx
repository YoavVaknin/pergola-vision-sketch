
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { PergolaConfig } from "@/pages/CreateVisualization";

interface PergolaFormProps {
  config: PergolaConfig;
  onConfigChange: (newConfig: Partial<PergolaConfig>) => void;
}

export const PergolaForm = ({ config, onConfigChange }: PergolaFormProps) => {
  const profileOptions = [
    { value: "4/2", label: "4/2 ס״מ" },
    { value: "5/2.5", label: "5/2.5 ס״מ" },
    { value: "6/3", label: "6/3 ס״מ" },
    { value: "8/4", label: "8/4 ס״מ" },
    { value: "10/5", label: "10/5 ס״מ" }
  ];

  return (
    <div className="space-y-6">
      {/* ממדים כלליים */}
      <div>
        <h3 className="font-medium mb-4 text-foreground">ממדים כלליים</h3>
        <div className="space-y-4">
          <div>
            <Label htmlFor="width" className="text-sm font-medium">
              רוחב הפרגולה (ס״מ)
            </Label>
            <Input
              id="width"
              type="number"
              value={config.width}
              onChange={(e) => onConfigChange({ width: parseInt(e.target.value) || 0 })}
              className="mt-1"
              min="100"
              max="1000"
              step="10"
            />
          </div>
          <div>
            <Label htmlFor="length" className="text-sm font-medium">
              אורך הפרגולה (ס״מ)
            </Label>
            <Input
              id="length"
              type="number"
              value={config.length}
              onChange={(e) => onConfigChange({ length: parseInt(e.target.value) || 0 })}
              className="mt-1"
              min="100"
              max="1000"
              step="10"
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* קורות צללה */}
      <div>
        <h3 className="font-medium mb-4 text-foreground">קורות צללה</h3>
        <div className="space-y-4">
          <div>
            <Label htmlFor="spacing" className="text-sm font-medium">
              מרווח בין קורות (ס״מ)
            </Label>
            <Input
              id="spacing"
              type="number"
              value={config.beamSpacing}
              onChange={(e) => onConfigChange({ beamSpacing: parseInt(e.target.value) || 0 })}
              className="mt-1"
              min="10"
              max="100"
              step="5"
            />
          </div>
          <div>
            <Label htmlFor="profile" className="text-sm font-medium">
              סוג פרופיל הצללה
            </Label>
            <Select 
              value={config.profileType} 
              onValueChange={(value) => onConfigChange({ profileType: value })}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="בחר פרופיל" />
              </SelectTrigger>
              <SelectContent>
                {profileOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <Separator />

      {/* מידע חישובי */}
      <Card className="bg-muted/30">
        <CardContent className="pt-4">
          <h4 className="font-medium mb-3 text-sm text-foreground">מידע חישובי</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">שטח כולל:</span>
              <span className="font-medium">{((config.width * config.length) / 10000).toFixed(2)} מ״ר</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">מספר קורות:</span>
              <span className="font-medium">{Math.floor(config.width / config.beamSpacing) + 1}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">אורך קורה בודדת:</span>
              <span className="font-medium">{config.length} ס״מ</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
