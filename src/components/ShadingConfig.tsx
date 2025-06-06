
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ShadingConfig } from "@/types/pergola";

interface ShadingConfigProps {
  config: ShadingConfig;
  onConfigChange: (config: Partial<ShadingConfig>) => void;
}

export const ShadingConfigComponent = ({ config, onConfigChange }: ShadingConfigProps) => {
  return (
    <Card className="p-4">
      <h4 className="font-semibold mb-3">הגדרות הצללה וחלוקה</h4>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="shading-enabled">הפעל הצללה</Label>
          <Switch
            id="shading-enabled"
            checked={config.enabled}
            onCheckedChange={(enabled) => onConfigChange({ enabled })}
          />
        </div>

        {config.enabled && (
          <>
            <div>
              <Label htmlFor="spacing">מרווח קורות הצללה (ס״מ)</Label>
              <Input
                id="spacing"
                type="number"
                min="20"
                max="200"
                step="10"
                value={config.spacing}
                onChange={(e) => onConfigChange({ spacing: Number(e.target.value) })}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="direction">כיוון קורות הצללה</Label>
              <Select 
                value={config.direction.toString()} 
                onValueChange={(value) => onConfigChange({ direction: Number(value) })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">אנכי</SelectItem>
                  <SelectItem value="90">אופקי</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="shading-color">צבע קורות הצללה</Label>
              <Select 
                value={config.color} 
                onValueChange={(value) => onConfigChange({ color: value })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="#8b4513">עץ כהה</SelectItem>
                  <SelectItem value="#6b7280">אפור גרפיט</SelectItem>
                  <SelectItem value="#1f2937">שחור</SelectItem>
                  <SelectItem value="#ffffff">לבן</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        )}

        <div className="border-t pt-4">
          <div className="flex items-center justify-between mb-3">
            <Label htmlFor="division-enabled">הפעל קורות חלוקה</Label>
            <Switch
              id="division-enabled"
              checked={config.divisionEnabled}
              onCheckedChange={(divisionEnabled) => onConfigChange({ divisionEnabled })}
            />
          </div>

          {config.divisionEnabled && (
            <>
              <div>
                <Label htmlFor="division-spacing">מרווח קורות חלוקה (ס״מ)</Label>
                <Input
                  id="division-spacing"
                  type="number"
                  min="50"
                  max="300"
                  step="25"
                  value={config.divisionSpacing}
                  onChange={(e) => onConfigChange({ divisionSpacing: Number(e.target.value) })}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="division-color">צבע קורות חלוקה</Label>
                <Select 
                  value={config.divisionColor} 
                  onValueChange={(value) => onConfigChange({ divisionColor: value })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="#f97316">כתום</SelectItem>
                    <SelectItem value="#6b7280">אפור גרפיט</SelectItem>
                    <SelectItem value="#dc2626">אדום</SelectItem>
                    <SelectItem value="#16a34a">ירוק</SelectItem>
                    <SelectItem value="#1d4ed8">כחול</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="text-xs text-muted-foreground mt-2">
                קורות החלוקה עוברות בכיוון הניצב לקורות הצללה
              </div>
            </>
          )}
        </div>
      </div>
    </Card>
  );
};
