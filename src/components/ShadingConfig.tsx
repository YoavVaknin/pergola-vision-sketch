
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
      <h4 className="font-semibold mb-3">הגדרות הצללה</h4>
      
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
              <Label htmlFor="spacing">מרווח קורות (ס״מ)</Label>
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
              <Label htmlFor="direction">כיוון קורות</Label>
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
              <Label htmlFor="shading-color">צבע קורות</Label>
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
      </div>
    </Card>
  );
};
