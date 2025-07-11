
import React from 'react';
import { ShadingConfig } from '@/types/pergola';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';

interface ShadingConfigProps {
  config: ShadingConfig;
  onConfigChange: (newConfig: Partial<ShadingConfig>) => void;
}

export const ShadingConfigComponent: React.FC<ShadingConfigProps> = ({ config, onConfigChange }) => {
  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl font-bold text-primary">הגדרות פרגולה</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Pergola Model Selection */}
        <div className="space-y-3">
          <Label className="text-base font-semibold">דגם פרגולה</Label>
          <Select
            value={config.pergolaModel}
            onValueChange={(value: any) => onConfigChange({ pergolaModel: value })}
          >
            <SelectTrigger className="h-11">
              <SelectValue placeholder="בחר דגם פרגולה" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="bottom_shading">הצללה תחתונה</SelectItem>
              <SelectItem value="top_shading">הצללה עליונה</SelectItem>
              <SelectItem value="t_model">דגם טי</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Separator className="my-4" />

        {/* Frame Profile */}
        <div className="space-y-4">
          <Label className="text-base font-semibold">פרופיל מסגרת</Label>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">רוחב (ס"מ)</Label>
              <Input
                type="number"
                value={config.frameProfile.width}
                onChange={(e) => onConfigChange({
                  frameProfile: { ...config.frameProfile, width: Number(e.target.value) }
                })}
                min="1"
                max="50"
                step="0.5"
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">גובה (ס"מ)</Label>
              <Input
                type="number"
                value={config.frameProfile.height}
                onChange={(e) => onConfigChange({
                  frameProfile: { ...config.frameProfile, height: Number(e.target.value) }
                })}
                min="1"
                max="50"
                step="0.5"
                className="h-10"
              />
            </div>
          </div>
        </div>

        <Separator className="my-4" />

        {/* Division Beams */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-base font-semibold">קורות חלוקה</Label>
            <Switch
              checked={config.divisionEnabled}
              onCheckedChange={(checked) => onConfigChange({ divisionEnabled: checked })}
            />
          </div>
          
          {config.divisionEnabled && (
            <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">רוחב (ס"מ)</Label>
                  <Input
                    type="number"
                    value={config.divisionProfile.width}
                    onChange={(e) => onConfigChange({
                      divisionProfile: { ...config.divisionProfile, width: Number(e.target.value) }
                    })}
                    min="1"
                    max="30"
                    step="0.5"
                    className="h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">גובה (ס"מ)</Label>
                  <Input
                    type="number"
                    value={config.divisionProfile.height}
                    onChange={(e) => onConfigChange({
                      divisionProfile: { ...config.divisionProfile, height: Number(e.target.value) }
                    })}
                    min="1"
                    max="30"
                    step="0.5"
                    className="h-10"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium">מרווח בין קורות (ס"מ)</Label>
                <Input
                  type="number"
                  value={config.divisionSpacing}
                  onChange={(e) => onConfigChange({ divisionSpacing: Number(e.target.value) })}
                  min="10"
                  max="200"
                  step="5"
                  className="h-10"
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium">כיוון הקורות</Label>
                <Select
                  value={config.divisionDirection}
                  onValueChange={(value: any) => onConfigChange({ divisionDirection: value })}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="width">לרוחב</SelectItem>
                    <SelectItem value="length">לאורך</SelectItem>
                    <SelectItem value="both">שני הכיוונים</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium">צבע הקורות</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={config.divisionColor}
                    onChange={(e) => onConfigChange({ divisionColor: e.target.value })}
                    className="w-16 h-10 p-1"
                  />
                  <Input
                    type="text"
                    value={config.divisionColor}
                    onChange={(e) => onConfigChange({ divisionColor: e.target.value })}
                    className="h-10"
                    placeholder="#000000"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <Separator className="my-4" />

        {/* Shading Slats */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-base font-semibold">קורות הצללה</Label>
            <Switch
              checked={config.enabled}
              onCheckedChange={(checked) => onConfigChange({ enabled: checked })}
            />
          </div>
          
          {config.enabled && (
            <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">רוחב (ס"מ)</Label>
                  <Input
                    type="number"
                    value={config.shadingProfile.width}
                    onChange={(e) => onConfigChange({
                      shadingProfile: { ...config.shadingProfile, width: Number(e.target.value) }
                    })}
                    min="1"
                    max="20"
                    step="0.5"
                    className="h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">גובה (ס"מ)</Label>
                  <Input
                    type="number"
                    value={config.shadingProfile.height}
                    onChange={(e) => onConfigChange({
                      shadingProfile: { ...config.shadingProfile, height: Number(e.target.value) }
                    })}
                    min="1"
                    max="20"
                    step="0.5"
                    className="h-10"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium">מרווח בין קורות (ס"מ)</Label>
                <Input
                  type="number"
                  value={config.spacing}
                  onChange={(e) => onConfigChange({ spacing: Number(e.target.value) })}
                  min="1"
                  max="100"
                  step="1"
                  className="h-10"
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium">כיוון הקורות</Label>
                <Select
                  value={config.shadingDirection}
                  onValueChange={(value: any) => onConfigChange({ shadingDirection: value })}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="width">לרוחב</SelectItem>
                    <SelectItem value="length">לאורך</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium">צבע הקורות</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={config.color}
                    onChange={(e) => onConfigChange({ color: e.target.value })}
                    className="w-16 h-10 p-1"
                  />
                  <Input
                    type="text"
                    value={config.color}
                    onChange={(e) => onConfigChange({ color: e.target.value })}
                    className="h-10"
                    placeholder="#000000"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
