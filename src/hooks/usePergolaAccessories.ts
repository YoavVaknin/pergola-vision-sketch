
import { useState, useCallback, useRef } from 'react';
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

export interface DragState {
  isDragging: boolean;
  draggedAccessoryId: string | null;
  dragOffset: Point | null;
  startPosition: Point | null;
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

  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    draggedAccessoryId: null,
    dragOffset: null,
    startPosition: null
  });

  const [hoveredAccessoryId, setHoveredAccessoryId] = useState<string | null>(null);

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

  // Find accessory at given point
  const findAccessoryAtPoint = useCallback((point: Point): PergolaAccessory | null => {
    for (let i = accessories.length - 1; i >= 0; i--) {
      const accessory = accessories[i];
      const distance = Math.sqrt(
        Math.pow(point.x - accessory.position.x, 2) + 
        Math.pow(point.y - accessory.position.y, 2)
      );
      
      let hitRadius = 15; // Default hit radius
      
      switch (accessory.type) {
        case 'light':
          hitRadius = (accessory.size || 12) / 2 + 5;
          break;
        case 'fan':
          hitRadius = (accessory.size || 20) / 2 + 5;
          break;
        case 'column':
          hitRadius = (accessory.size || 8) / 2 + 5;
          break;
        case 'wall':
          hitRadius = 30; // Wall is longer, so larger hit area
          break;
      }
      
      if (distance <= hitRadius) {
        return accessory;
      }
    }
    return null;
  }, [accessories]);

  // Start dragging an accessory
  const startDragging = useCallback((accessoryId: string, mousePos: Point, accessoryPos: Point) => {
    setDragState({
      isDragging: true,
      draggedAccessoryId: accessoryId,
      dragOffset: {
        x: mousePos.x - accessoryPos.x,
        y: mousePos.y - accessoryPos.y
      },
      startPosition: accessoryPos
    });
  }, []);

  // Update accessory position during drag
  const updateDragPosition = useCallback((mousePos: Point) => {
    if (!dragState.isDragging || !dragState.draggedAccessoryId || !dragState.dragOffset) {
      return;
    }

    const newPosition: Point = {
      x: mousePos.x - dragState.dragOffset.x,
      y: mousePos.y - dragState.dragOffset.y
    };

    setAccessories(prev => prev.map(accessory => 
      accessory.id === dragState.draggedAccessoryId 
        ? { ...accessory, position: newPosition }
        : accessory
    ));
  }, [dragState]);

  // Stop dragging
  const stopDragging = useCallback(() => {
    setDragState({
      isDragging: false,
      draggedAccessoryId: null,
      dragOffset: null,
      startPosition: null
    });
  }, []);

  // Set hovered accessory for cursor change
  const setHoveredAccessory = useCallback((accessoryId: string | null) => {
    setHoveredAccessoryId(accessoryId);
  }, []);

  return {
    accessories,
    accessoryConfig,
    dragState,
    hoveredAccessoryId,
    addAccessory,
    removeAccessory,
    updateAccessoryConfig,
    clearAllAccessories,
    getDefaultPosition,
    findAccessoryAtPoint,
    startDragging,
    updateDragPosition,
    stopDragging,
    setHoveredAccessory
  };
};
