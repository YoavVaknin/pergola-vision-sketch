
import { useState, useCallback } from 'react';
import { Point, FrameElement } from '@/types/pergola';

export interface CornerEditState {
  isEditing: boolean;
  elementId: string | null;
  cornerIndex: number | null;
  dragOffset: Point | null;
}

export const useCornerEditing = () => {
  const [editState, setEditState] = useState<CornerEditState>({
    isEditing: false,
    elementId: null,
    cornerIndex: null,
    dragOffset: null
  });

  const findNearestCorner = useCallback((
    mousePoint: Point,
    elements: any[],
    tolerance: number = 8
  ): { elementId: string; cornerIndex: number } | null => {
    for (const element of elements) {
      if (element.type === 'frame') {
        const frame = element as FrameElement;
        for (let i = 0; i < frame.points.length; i++) {
          const corner = frame.points[i];
          const distance = Math.sqrt(
            Math.pow(mousePoint.x - corner.x, 2) + Math.pow(mousePoint.y - corner.y, 2)
          );
          
          if (distance <= tolerance) {
            return { elementId: element.id, cornerIndex: i };
          }
        }
      }
    }
    return null;
  }, []);

  const startCornerEdit = useCallback((elementId: string, cornerIndex: number, mousePoint: Point, cornerPoint: Point) => {
    setEditState({
      isEditing: true,
      elementId,
      cornerIndex,
      dragOffset: {
        x: mousePoint.x - cornerPoint.x,
        y: mousePoint.y - cornerPoint.y
      }
    });
  }, []);

  const updateCornerPosition = useCallback((mousePoint: Point): Point | null => {
    if (!editState.isEditing || !editState.dragOffset) return null;
    
    return {
      x: mousePoint.x - editState.dragOffset.x,
      y: mousePoint.y - editState.dragOffset.y
    };
  }, [editState]);

  const stopCornerEdit = useCallback(() => {
    setEditState({
      isEditing: false,
      elementId: null,
      cornerIndex: null,
      dragOffset: null
    });
  }, []);

  return {
    editState,
    findNearestCorner,
    startCornerEdit,
    updateCornerPosition,
    stopCornerEdit
  };
};
