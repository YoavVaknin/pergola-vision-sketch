
import { useCallback } from 'react';
import { Point, FrameElement, PergolaElementType } from '@/types/pergola';

export interface AlignmentGuide {
  type: 'vertical' | 'horizontal';
  position: number; // x for vertical, y for horizontal
  startPoint: Point;
  endPoint: Point;
  targetPoint: Point; // The point we're aligning to
  lineType: 'extension' | 'parallel'; // Type of alignment guide
}

export const useSmartAlignment = () => {
  const findAlignmentGuides = useCallback((
    currentPoint: Point,
    previousPoint: Point,
    elements: PergolaElementType[],
    tolerance: number = 15
  ): AlignmentGuide[] => {
    const guides: AlignmentGuide[] = [];
    
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

    // Check for parallel alignment and extensions
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
      const isParallel = dotProduct > 0.9; // More sensitive parallel detection

      if (isParallel) {
        // Determine if it's more horizontal or vertical
        const isHorizontal = Math.abs(normalizedSegment.y) < 0.3;
        const isVertical = Math.abs(normalizedSegment.x) < 0.3;

        if (isHorizontal) {
          // Check alignment with segment endpoints for vertical guides
          [segment.start, segment.end].forEach(point => {
            if (Math.abs(currentPoint.x - point.x) <= tolerance) {
              guides.push({
                type: 'vertical',
                position: point.x,
                startPoint: { x: point.x, y: Math.min(currentPoint.y, point.y, previousPoint.y) - 30 },
                endPoint: { x: point.x, y: Math.max(currentPoint.y, point.y, previousPoint.y) + 30 },
                targetPoint: point,
                lineType: 'extension'
              });
            }
          });
          
          // Check for parallel line alignment (same Y level)
          const segmentY = (segment.start.y + segment.end.y) / 2;
          if (Math.abs(currentPoint.y - segmentY) <= tolerance) {
            guides.push({
              type: 'horizontal',
              position: segmentY,
              startPoint: { x: Math.min(currentPoint.x, segment.start.x, segment.end.x) - 30, y: segmentY },
              endPoint: { x: Math.max(currentPoint.x, segment.start.x, segment.end.x) + 30, y: segmentY },
              targetPoint: { x: segmentY, y: segmentY },
              lineType: 'parallel'
            });
          }
        }

        if (isVertical) {
          // Check alignment with segment endpoints for horizontal guides
          [segment.start, segment.end].forEach(point => {
            if (Math.abs(currentPoint.y - point.y) <= tolerance) {
              guides.push({
                type: 'horizontal',
                position: point.y,
                startPoint: { x: Math.min(currentPoint.x, point.x, previousPoint.x) - 30, y: point.y },
                endPoint: { x: Math.max(currentPoint.x, point.x, previousPoint.x) + 30, y: point.y },
                targetPoint: point,
                lineType: 'extension'
              });
            }
          });
          
          // Check for parallel line alignment (same X level)
          const segmentX = (segment.start.x + segment.end.x) / 2;
          if (Math.abs(currentPoint.x - segmentX) <= tolerance) {
            guides.push({
              type: 'vertical',
              position: segmentX,
              startPoint: { x: segmentX, y: Math.min(currentPoint.y, segment.start.y, segment.end.y) - 30 },
              endPoint: { x: segmentX, y: Math.max(currentPoint.y, segment.start.y, segment.end.y) + 30 },
              targetPoint: { x: segmentX, y: segmentX },
              lineType: 'parallel'
            });
          }
        }
      }
    });

    return guides;
  }, []);

  const getSnapPoint = useCallback((
    currentPoint: Point,
    guides: AlignmentGuide[]
  ): Point | null => {
    // Prioritize extension guides over parallel guides
    const extensionGuides = guides.filter(g => g.lineType === 'extension');
    const parallelGuides = guides.filter(g => g.lineType === 'parallel');
    
    const prioritizedGuides = [...extensionGuides, ...parallelGuides];
    
    for (const guide of prioritizedGuides) {
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
