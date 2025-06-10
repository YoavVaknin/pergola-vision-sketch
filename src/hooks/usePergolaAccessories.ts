
import { useState, useCallback } from 'react';
import { Point } from '@/types/pergola';

export type AccessoryType = 'column' | 'wall' | 'light' | 'fan' | 'color';

export interface PergolaAccessory {
  id: string;
  type: AccessoryType;
  position: Point;
  color?: string;
  size?: number;
  orientation?: 'horizontal' | 'vertical';
}

export interface AccessoryConfig {
  lights: {
    color: string;
    size: number;
  };
  fans: {
    color: string;
    size: number;
  };
  columns: {
    color: string;
    size: number;
  };
  walls: {
    color: string;
    thickness: number;
  };
  frameColor: string;
}

const generateAccessoryId = (): string => {
  return `accessory_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export const usePergolaAccessories = () => {
  const [accessories, setAccessories] = useState<PergolaAccessory[]>([]);
  const [accessoryConfig, setAccessoryConfig] = useState<AccessoryConfig>({
    lights: {
      color: '#fbbf24',
      size: 12
    },
    fans: {
      color: '#6b7280',
      size: 20
    },
    columns: {
      color: '#374151',
      size: 8
    },
    walls: {
      color: '#111827',
      thickness: 6
    },
    frameColor: '#1f2937'
  });

  const addAccessory = useCallback((type: AccessoryType, position: Point) => {
    if (type === 'color') {
      // Color changes don't create accessories, they modify the frame color
      return;
    }

    const newAccessory: PergolaAccessory = {
      id: generateAccessoryId(),
      type,
      position,
      color: type === 'light' ? accessoryConfig.lights.color :
             type === 'fan' ? accessoryConfig.fans.color :
             type === 'column' ? accessoryConfig.columns.color :
             type === 'wall' ? accessoryConfig.walls.color : '#000000',
      size: type === 'light' ? accessoryConfig.lights.size :
            type === 'fan' ? accessoryConfig.fans.size :
            type === 'column' ? accessoryConfig.columns.size :
            type === 'wall' ? accessoryConfig.walls.thickness : 10
    };

    setAccessories(prev => [...prev, newAccessory]);
  }, [accessoryConfig]);

  const removeAccessory = useCallback((id: string) => {
    setAccessories(prev => prev.filter(acc => acc.id !== id));
  }, []);

  const updateAccessoryConfig = useCallback((newConfig: Partial<AccessoryConfig>) => {
    setAccessoryConfig(prev => ({ ...prev, ...newConfig }));
  }, []);

  const clearAllAccessories = useCallback(() => {
    setAccessories([]);
  }, []);

  const getDefaultPosition = useCallback((canvasWidth: number = 800, canvasHeight: number = 600): Point => {
    return {
      x: canvasWidth / 2,
      y: canvasHeight / 2
    };
  }, []);

  return {
    accessories,
    accessoryConfig,
    addAccessory,
    removeAccessory,
    updateAccessoryConfig,
    clearAllAccessories,
    getDefaultPosition
  };
};
