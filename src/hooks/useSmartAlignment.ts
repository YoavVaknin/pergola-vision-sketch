
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
    tolerance: number = 15
  ): AlignmentGuide[] => {
    const guides: AlignmentGuide[] = [];
    
    // Collect all points from existing elements (enhanced collection)
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

    // Primary alignment detection - this is the core functionality
    allPoints.forEach(({ point: targetPoint, elementType }) => {
      // Skip if it's too close to the previous point (avoid self-alignment)
      const distanceToPrevious = Math.sqrt(
        Math.pow(targetPoint.x - previousPoint.x, 2) + Math.pow(targetPoint.y - previousPoint.y, 2)
      );
      if (distanceToPrevious < 30) return; // Increased threshold to avoid self-alignment

      // Enhanced vertical alignment detection (same X coordinate)
      const xDiff = Math.abs(currentPoint.x - targetPoint.x);
      if (xDiff <= tolerance) {
        // Create a long vertical guide line that spans the canvas
        const canvasHeight = 600;
        const extendLength = 200;
        
        // Calculate the guide line bounds
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

      // Enhanced horizontal alignment detection (same Y coordinate)
      const yDiff = Math.abs(currentPoint.y - targetPoint.y);
      if (yDiff <= tolerance) {
        // Create a long horizontal guide line that spans the canvas
        const canvasWidth = 800;
        const extendLength = 200;
        
        // Calculate the guide line bounds
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

    // Find all line segments from existing frames and other elements
    const lineSegments: { start: Point; end: Point; type: string }[] = [];
    
    elements.forEach(element => {
      if (element.type === 'frame') {
        const frame = element as FrameElement;
        for (let i = 0; i < frame.points.length; i++) {
          const nextIndex = (i + 1) % frame.points.length;
          if (frame.closed || i < frame.points.length - 1) {
            lineSegments.push({
              start: frame.points[i],
              end: frame.points[nextIndex],
              type: 'frame'
            });
          }
        }
      } else if (element.type === 'shading' || element.type === 'division' || element.type === 'beam') {
        const lineElement = element as any;
        if (lineElement.start && lineElement.end) {
          lineSegments.push({
            start: lineElement.start,
            end: lineElement.end,
            type: element.type
          });
        }
      }
    });

    // Calculate current drawing direction
    const currentVector = {
      x: currentPoint.x - previousPoint.x,
      y: currentPoint.y - previousPoint.y
    };
    
    const currentLength = Math.sqrt(currentVector.x * currentVector.x + currentVector.y * currentVector.y);
    if (currentLength === 0) return guides;
    
    const normalizedCurrent = {
      x: currentVector.x / currentLength,
      y: currentVector.y / currentLength
    };

    // Enhanced extension and parallel alignment
    lineSegments.forEach(segment => {
      const segmentVector = {
        x: segment.end.x - segment.start.x,
        y: segment.end.y - segment.start.y
      };
      
      const segmentLength = Math.sqrt(segmentVector.x * segmentVector.x + segmentVector.y * segmentVector.y);
      if (segmentLength === 0) return;
      
      const normalizedSegment = {
        x: segmentVector.x / segmentLength,
        y: segmentVector.y / segmentLength
      };

      // Check if lines are parallel (dot product close to 1 or -1)
      const dotProduct = Math.abs(normalizedCurrent.x * normalizedSegment.x + normalizedCurrent.y * normalizedSegment.y);
      const isParallel = dotProduct > 0.85;

      if (isParallel) {
        // Determine if it's more horizontal or vertical
        const isMoreHorizontal = Math.abs(normalizedSegment.y) < 0.5;
        const isMoreVertical = Math.abs(normalizedSegment.x) < 0.5;

        if (isMoreHorizontal) {
          // For horizontal segments, check vertical alignment with endpoints
          [segment.start, segment.end].forEach(point => {
            if (Math.abs(currentPoint.x - point.x) <= tolerance) {
              const extendLength = 150;
              guides.push({
                type: 'vertical',
                position: point.x,
                startPoint: { x: point.x, y: Math.min(currentPoint.y, point.y, previousPoint.y) - extendLength },
                endPoint: { x: point.x, y: Math.max(currentPoint.y, point.y, previousPoint.y) + extendLength },
                targetPoint: point,
                lineType: 'extension'
              });
            }
          });
        }

        if (isMoreVertical) {
          // For vertical segments, check horizontal alignment with endpoints
          [segment.start, segment.end].forEach(point => {
            if (Math.abs(currentPoint.y - point.y) <= tolerance) {
              const extendLength = 150;
              guides.push({
                type: 'horizontal',
                position: point.y,
                startPoint: { x: Math.min(currentPoint.x, point.x, previousPoint.x) - extendLength, y: point.y },
                endPoint: { x: Math.max(currentPoint.x, point.x, previousPoint.x) + extendLength, y: point.y },
                targetPoint: point,
                lineType: 'extension'
              });
            }
          });
        }
      }
    });

    // Remove duplicate guides and prioritize point alignment
    const uniqueGuides = guides.filter((guide, index, array) => {
      return index === array.findIndex(g => 
        g.type === guide.type && 
        Math.abs(g.position - guide.position) < 5 &&
        g.lineType === guide.lineType
      );
    });

    // Sort guides by priority: point-alignment first, then extension, then parallel
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
    
    // Then try extension guides
    const extensionGuides = guides.filter(g => g.lineType === 'extension');
    if (extensionGuides.length > 0) {
      const guide = extensionGuides[0];
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
