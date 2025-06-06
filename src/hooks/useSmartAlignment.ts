
import { useCallback } from 'react';
import { Point, FrameElement, PergolaElementType } from '@/types/pergola';

export interface AlignmentGuide {
  type: 'vertical' | 'horizontal';
  position: number; // x for vertical, y for horizontal
  startPoint: Point;
  endPoint: Point;
  targetPoint: Point; // The point we're aligning to
}

export const useSmartAlignment = () => {
  const findAlignmentGuides = useCallback((
    currentPoint: Point,
    previousPoint: Point,
    elements: PergolaElementType[],
    tolerance: number = 10
  ): AlignmentGuide[] => {
    const guides: AlignmentGuide[] = [];
    
    // Find all line segments from existing frames
    const lineSegments: { start: Point; end: Point }[] = [];
    
    elements.forEach(element => {
      if (element.type === 'frame') {
        const frame = element as FrameElement;
        for (let i = 0; i < frame.points.length; i++) {
          const nextIndex = (i + 1) % frame.points.length;
          if (frame.closed || i < frame.points.length - 1) {
            lineSegments.push({
              start: frame.points[i],
              end: frame.points[nextIndex]
            });
          }
        }
      }
    });

    // Check for parallel alignment
    lineSegments.forEach(segment => {
      const segmentVector = {
        x: segment.end.x - segment.start.x,
        y: segment.end.y - segment.start.y
      };
      
      const currentVector = {
        x: currentPoint.x - previousPoint.x,
        y: currentPoint.y - previousPoint.y
      };

      // Check if lines are roughly parallel (horizontal or vertical)
      const isHorizontalParallel = Math.abs(segmentVector.y) < 5 && Math.abs(currentVector.y) < 5;
      const isVerticalParallel = Math.abs(segmentVector.x) < 5 && Math.abs(currentVector.x) < 5;

      if (isHorizontalParallel) {
        // Check alignment with segment endpoints
        [segment.start, segment.end].forEach(point => {
          if (Math.abs(currentPoint.x - point.x) <= tolerance) {
            guides.push({
              type: 'vertical',
              position: point.x,
              startPoint: { x: point.x, y: Math.min(currentPoint.y, point.y) - 20 },
              endPoint: { x: point.x, y: Math.max(currentPoint.y, point.y) + 20 },
              targetPoint: point
            });
          }
        });
      }

      if (isVerticalParallel) {
        // Check alignment with segment endpoints
        [segment.start, segment.end].forEach(point => {
          if (Math.abs(currentPoint.y - point.y) <= tolerance) {
            guides.push({
              type: 'horizontal',
              position: point.y,
              startPoint: { x: Math.min(currentPoint.x, point.x) - 20, y: point.y },
              endPoint: { x: Math.max(currentPoint.x, point.x) + 20, y: point.y },
              targetPoint: point
            });
          }
        });
      }
    });

    return guides;
  }, []);

  const getSnapPoint = useCallback((
    currentPoint: Point,
    guides: AlignmentGuide[]
  ): Point | null => {
    for (const guide of guides) {
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
