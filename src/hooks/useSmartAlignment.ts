
import { useCallback } from 'react';
import { Point, FrameElement, PergolaElementType } from '@/types/pergola';

export interface AlignmentGuide {
  type: 'vertical' | 'horizontal';
  position: number; // x for vertical, y for horizontal
  startPoint: Point;
  endPoint: Point;
  targetPoint: Point; // The point we're aligning to
  lineType: 'extension' | 'parallel' | 'point-alignment'; // Type of alignment guide
}

export const useSmartAlignment = () => {
  const findAlignmentGuides = useCallback((
    currentPoint: Point,
    previousPoint: Point,
    elements: PergolaElementType[],
    tolerance: number = 10 // Reduced tolerance for more precise detection
  ): AlignmentGuide[] => {
    const guides: AlignmentGuide[] = [];
    
    // Collect all points from existing elements
    const allPoints: { point: Point; elementType: string; elementId: string }[] = [];
    
    elements.forEach(element => {
      if (element.type === 'frame') {
        const frame = element as FrameElement;
        frame.points.forEach((point, index) => {
          allPoints.push({ 
            point, 
            elementType: 'frame', 
            elementId: `${element.id}-${index}` 
          });
        });
      } else if (element.type === 'shading' || element.type === 'division' || element.type === 'beam') {
        const lineElement = element as any;
        if (lineElement.start && lineElement.end) {
          allPoints.push({ 
            point: lineElement.start, 
            elementType: element.type, 
            elementId: `${element.id}-start` 
          });
          allPoints.push({ 
            point: lineElement.end, 
            elementType: element.type, 
            elementId: `${element.id}-end` 
          });
        }
      } else if (element.type === 'column') {
        const columnElement = element as any;
        if (columnElement.position) {
          allPoints.push({ 
            point: columnElement.position, 
            elementType: element.type, 
            elementId: element.id 
          });
        }
      }
    });

    console.log('All points for alignment:', allPoints);
    console.log('Current point:', currentPoint);

    // Primary alignment detection - check each existing point for vertical/horizontal alignment
    allPoints.forEach(({ point: targetPoint, elementType }) => {
      // Skip if it's the current temporary point being drawn
      const distanceToPrevious = Math.sqrt(
        Math.pow(targetPoint.x - previousPoint.x, 2) + Math.pow(targetPoint.y - previousPoint.y, 2)
      );
      if (distanceToPrevious < 20) return; // Skip points too close to avoid self-alignment

      // VERTICAL ALIGNMENT: Check if current point X is close to target point X
      const xDiff = Math.abs(currentPoint.x - targetPoint.x);
      console.log(`Checking vertical alignment: current X=${currentPoint.x}, target X=${targetPoint.x}, diff=${xDiff}`);
      
      if (xDiff <= tolerance) {
        console.log('VERTICAL ALIGNMENT DETECTED!');
        // Create vertical guide line spanning full canvas height
        const canvasHeight = 600;
        const extendLength = 300;
        
        const minY = Math.min(currentPoint.y, targetPoint.y) - extendLength;
        const maxY = Math.max(currentPoint.y, targetPoint.y) + extendLength;
        
        guides.push({
          type: 'vertical',
          position: targetPoint.x,
          startPoint: { x: targetPoint.x, y: Math.max(0, minY) },
          endPoint: { x: targetPoint.x, y: Math.min(canvasHeight, maxY) },
          targetPoint: targetPoint,
          lineType: 'point-alignment'
        });
      }

      // HORIZONTAL ALIGNMENT: Check if current point Y is close to target point Y
      const yDiff = Math.abs(currentPoint.y - targetPoint.y);
      console.log(`Checking horizontal alignment: current Y=${currentPoint.y}, target Y=${targetPoint.y}, diff=${yDiff}`);
      
      if (yDiff <= tolerance) {
        console.log('HORIZONTAL ALIGNMENT DETECTED!');
        // Create horizontal guide line spanning full canvas width
        const canvasWidth = 800;
        const extendLength = 300;
        
        const minX = Math.min(currentPoint.x, targetPoint.x) - extendLength;
        const maxX = Math.max(currentPoint.x, targetPoint.x) + extendLength;
        
        guides.push({
          type: 'horizontal',
          position: targetPoint.y,
          startPoint: { x: Math.max(0, minX), y: targetPoint.y },
          endPoint: { x: Math.min(canvasWidth, maxX), y: targetPoint.y },
          targetPoint: targetPoint,
          lineType: 'point-alignment'
        });
      }
    });

    console.log('Generated alignment guides:', guides);

    // Remove duplicate guides
    const uniqueGuides = guides.filter((guide, index, array) => {
      return index === array.findIndex(g => 
        g.type === guide.type && 
        Math.abs(g.position - guide.position) < 3 &&
        g.lineType === guide.lineType
      );
    });

    // Sort guides by priority: point-alignment first
    return uniqueGuides.sort((a, b) => {
      const priority = { 'point-alignment': 0, 'extension': 1, 'parallel': 2 };
      return priority[a.lineType] - priority[b.lineType];
    });
  }, []);

  const getSnapPoint = useCallback((
    currentPoint: Point,
    guides: AlignmentGuide[]
  ): Point | null => {
    // Prioritize point alignment guides first
    const pointAlignmentGuides = guides.filter(g => g.lineType === 'point-alignment');
    
    if (pointAlignmentGuides.length > 0) {
      const guide = pointAlignmentGuides[0];
      if (guide.type === 'vertical') {
        return { x: guide.position, y: currentPoint.y };
      } else if (guide.type === 'horizontal') {
        return { x: currentPoint.x, y: guide.position };
      }
    }
    
    return null;
  }, []);

  return {
    findAlignmentGuides,
    getSnapPoint
  };
};
