import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PergolaConfig, PergolaFormProps } from '@/types/pergolaConfig';

export const PergolaForm: React.FC<PergolaFormProps> = ({ config, onConfigChange }) => {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    const parsedValue = type === 'number' ? parseInt(value, 10) : type === 'checkbox' ? checked : value;

    onConfigChange({
      ...config,
      [name]: parsedValue,
    });
  };

  const handleSelectChange = (name: string, value: string) => {
    onConfigChange({
      ...config,
      [name]: value,
    });
  };

  return (
    <div className="grid gap-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="width">רוחב (ס"מ)</Label>
          <Input
            type="number"
            id="width"
            name="width"
            value={config.width}
            onChange={handleInputChange}
          />
        </div>
        <div>
          <Label htmlFor="height">גובה (ס"מ)</Label>
          <Input
            type="number"
            id="height"
            name="height"
            value={config.height}
            onChange={handleInputChange}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="depth">עומק (ס"מ)</Label>
        <Input
          type="number"
          id="depth"
          name="depth"
          value={config.depth}
          onChange={handleInputChange}
        />
      </div>

      <div>
        <Label htmlFor="beamDirection">כיוון קורות</Label>
        <Select onValueChange={(value) => handleSelectChange('beamDirection', value)}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="בחר כיוון" defaultValue={config.beamDirection} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="width">רוחב</SelectItem>
            <SelectItem value="depth">עומק</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="beamSpacing">מרווח בין קורות (ס"מ)</Label>
        <Input
          type="number"
          id="beamSpacing"
          name="beamSpacing"
          value={config.beamSpacing}
          onChange={handleInputChange}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="profileFrame">פרופיל מסגרת</Label>
          <Input
            type="text"
            id="profileFrame"
            name="profileFrame"
            value={config.profileFrame}
            onChange={handleInputChange}
          />
        </div>
        <div>
          <Label htmlFor="profileShading">פרופיל הצללה</Label>
          <Input
            type="text"
            id="profileShading"
            name="profileShading"
            value={config.profileShading}
            onChange={handleInputChange}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="profileDivision">פרופיל חלוקה</Label>
        <Input
          type="text"
          id="profileDivision"
          name="profileDivision"
          value={config.profileDivision}
          onChange={handleInputChange}
        />
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="wallLeft"
          name="wallLeft"
          checked={config.wallLeft}
          onCheckedChange={(checked) => handleInputChange({ target: { name: 'wallLeft', type: 'checkbox', value: checked, checked } } as any)}
        />
        <Label htmlFor="wallLeft">קיר שמאלי</Label>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="wallRight"
          name="wallRight"
          checked={config.wallRight}
          onCheckedChange={(checked) => handleInputChange({ target: { name: 'wallRight', type: 'checkbox', value: checked, checked } } as any)}
        />
        <Label htmlFor="wallRight">קיר ימני</Label>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="wallFront"
          name="wallFront"
          checked={config.wallFront}
          onCheckedChange={(checked) => handleInputChange({ target: { name: 'wallFront', type: 'checkbox', value: checked, checked } } as any)}
        />
        <Label htmlFor="wallFront">קיר קדמי</Label>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="wallBack"
          name="wallBack"
          checked={config.wallBack}
          onCheckedChange={(checked) => handleInputChange({ target: { name: 'wallBack', type: 'checkbox', value: checked, checked } } as any)}
        />
        <Label htmlFor="wallBack">קיר אחורי</Label>
      </div>
    </div>
  );
};
