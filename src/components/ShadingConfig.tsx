
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
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">הגדרות פרגולה</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Pergola Model Selection */}
        <div className="space-y-2">
          <Label>דגם פרגולה</Label>
          <Select
            value={config.pergolaModel}
            onValueChange={(value: any) => onConfigChange({ pergolaModel: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="bottom_shading">הצללה תחתונה</SelectItem>
              <SelectItem value="top_shading">הצללה עליונה</SelectItem>
              <SelectItem value="t_model">דגם טי</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Separator />

        {/* Frame Profile */}
        <div className="space-y-3">
          <Label className="font-medium">פרופיל מסגרת</Label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-sm">רוחב (ס"מ)</Label>
              <Input
                type="number"
                value={config.frameProfile.width}
                onChange={(e) => onConfigChange({
                  frameProfile: { ...config.frameProfile, width: Number(e.target.value) }
                })}
                min="1"
                step="0.1"
              />
            </div>
            <div>
              <Label className="text-sm">גובה (ס"מ)</Label>
              <Input
                type="number"
                value={config.frameProfile.height}
                onChange={(e) => onConfigChange({
                  frameProfile: { ...config.frameProfile, height: Number(e.target.value) }
                })}
                min="1"
                step="0.1"
              />
            </div>
          </div>
        </div>

        {/* Division Beams */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="font-medium">קורות חלוקה</Label>
            <Switch
              checked={config.divisionEnabled}
              onCheckedChange={(checked) => onConfigChange({ divisionEnabled: checked })}
            />
          </div>
          
          {config.divisionEnabled && (
            <>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-sm">רוחב (ס"מ)</Label>
                  <Input
                    type="number"
                    value={config.divisionProfile.width}
                    onChange={(e) => onConfigChange({
                      divisionProfile: { ...config.divisionProfile, width: Number(e.target.value) }
                    })}
                    min="1"
                    step="0.1"
                  />
                </div>
                <div>
                  <Label className="text-sm">גובה (ס"מ)</Label>
                  <Input
                    type="number"
                    value={config.divisionProfile.height}
                    onChange={(e) => onConfigChange({
                      divisionProfile: { ...config.divisionProfile, height: Number(e.target.value) }
                    })}
                    min="1"
                    step="0.1"
                  />
                </div>
              </div>
              
              <div>
                <Label className="text-sm">מרווח (ס"מ)</Label>
                <Input
                  type="number"
                  value={config.divisionSpacing}
                  onChange={(e) => onConfigChange({ divisionSpacing: Number(e.target.value) })}
                  min="10"
                  step="1"
                />
              </div>
              
              <div>
                <Label className="text-sm">כיוון</Label>
                <Select
                  value={config.divisionDirection}
                  onValueChange={(value: any) => onConfigChange({ divisionDirection: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="width">לרוחב</SelectItem>
                    <SelectItem value="length">לאורך</SelectItem>
                    <SelectItem value="both">שניהם</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label className="text-sm">צבע</Label>
                <Input
                  type="color"
                  value={config.divisionColor}
                  onChange={(e) => onConfigChange({ divisionColor: e.target.value })}
                />
              </div>
            </>
          )}
        </div>

        {/* Shading Slats */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="font-medium">קורות הצללה</Label>
            <Switch
              checked={config.enabled}
              onCheckedChange={(checked) => onConfigChange({ enabled: checked })}
            />
          </div>
          
          {config.enabled && (
            <>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-sm">רוחב (ס"מ)</Label>
                  <Input
                    type="number"
                    value={config.shadingProfile.width}
                    onChange={(e) => onConfigChange({
                      shadingProfile: { ...config.shadingProfile, width: Number(e.target.value) }
                    })}
                    min="1"
                    step="0.1"
                  />
                </div>
                <div>
                  <Label className="text-sm">גובה (ס"מ)</Label>
                  <Input
                    type="number"
                    value={config.shadingProfile.height}
                    onChange={(e) => onConfigChange({
                      shadingProfile: { ...config.shadingProfile, height: Number(e.target.value) }
                    })}
                    min="1"
                    step="0.1"
                  />
                </div>
              </div>
              
              <div>
                <Label className="text-sm">מרווח (ס"מ)</Label>
                <Input
                  type="number"
                  value={config.spacing}
                  onChange={(e) => onConfigChange({ spacing: Number(e.target.value) })}
                  min="1"
                  step="1"
                />
              </div>
              
              <div>
                <Label className="text-sm">כיוון</Label>
                <Select
                  value={config.shadingDirection}
                  onValueChange={(value: any) => onConfigChange({ shadingDirection: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="width">לרוחב</SelectItem>
                    <SelectItem value="length">לאורך</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label className="text-sm">צבע</Label>
                <Input
                  type="color"
                  value={config.color}
                  onChange={(e) => onConfigChange({ color: e.target.value })}
                />
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
