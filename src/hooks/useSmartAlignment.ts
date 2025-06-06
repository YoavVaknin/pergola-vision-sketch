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
    
    // Collect all points from existing elements
    const allPoints: { point: Point; elementType: string }[] = [];
    
    elements.forEach(element => {
      if (element.type === 'frame') {
        const frame = element as FrameElement;
        frame.points.forEach(point => {
          allPoints.push({ point, elementType: 'frame' });
        });
      } else if (element.type === 'shading' || element.type === 'division' || element.type === 'beam') {
        const lineElement = element as any;
        if (lineElement.start && lineElement.end) {
          allPoints.push({ point: lineElement.start, elementType: element.type });
          allPoints.push({ point: lineElement.end, elementType: element.type });
        }
      } else if (element.type === 'column') {
        const columnElement = element as any;
        if (columnElement.position) {
          allPoints.push({ point: columnElement.position, elementType: element.type });
        }
      }
    });

    // Check for point alignment (vertical and horizontal alignment with existing points)
    allPoints.forEach(({ point: targetPoint, elementType }) => {
      // Skip if it's too close to the previous point (avoid self-alignment)
      const distanceToPrevious = Math.sqrt(
        Math.pow(targetPoint.x - previousPoint.x, 2) + Math.pow(targetPoint.y - previousPoint.y, 2)
      );
      if (distanceToPrevious < 10) return;

      // Vertical alignment (same X coordinate) - Blue line
      if (Math.abs(currentPoint.x - targetPoint.x) <= tolerance) {
        const canvasHeight = 600; // Canvas height
        guides.push({
          type: 'vertical',
          position: targetPoint.x,
          startPoint: { x: targetPoint.x, y: 0 },
          endPoint: { x: targetPoint.x, y: canvasHeight },
          targetPoint: targetPoint,
          lineType: 'point-alignment'
        });
      }

      // Horizontal alignment (same Y coordinate) - Orange line
      if (Math.abs(currentPoint.y - targetPoint.y) <= tolerance) {
        const canvasWidth = 800; // Canvas width
        guides.push({
          type: 'horizontal',
          position: targetPoint.y,
          startPoint: { x: 0, y: targetPoint.y },
          endPoint: { x: canvasWidth, y: targetPoint.y },
          targetPoint: targetPoint,
          lineType: 'point-alignment'
        });
      }
    });

    // Find all line segments from existing frames and other elements for extension guides
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

    // Calculate current drawing direction for extension guides
    const currentVector = {
      x: currentPoint.x - previousPoint.x,
      y: currentPoint.y - previousPoint.y
    };
    
    const currentLength = Math.sqrt(currentVector.x * currentVector.x + currentVector.y * currentVector.y);
    if (currentLength > 0) {
      const normalizedCurrent = {
        x: currentVector.x / currentLength,
        y: currentVector.y / currentLength
      };

      // Check for extension alignment from line endpoints
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
        const isParallel = dotProduct > 0.9;

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
                  startPoint: { x: point.x, y: Math.min(currentPoint.y, point.y, previousPoint.y) - 50 },
                  endPoint: { x: point.x, y: Math.max(currentPoint.y, point.y, previousPoint.y) + 50 },
                  targetPoint: point,
                  lineType: 'extension'
                });
              }
            });
          }

          if (isVertical) {
            // Check alignment with segment endpoints for horizontal guides
            [segment.start, segment.end].forEach(point => {
              if (Math.abs(currentPoint.y - point.y) <= tolerance) {
                guides.push({
                  type: 'horizontal',
                  position: point.y,
                  startPoint: { x: Math.min(currentPoint.x, point.x, previousPoint.x) - 50, y: point.y },
                  endPoint: { x: Math.max(currentPoint.x, point.x, previousPoint.x) + 50, y: point.y },
                  targetPoint: point,
                  lineType: 'extension'
                });
              }
            });
          }
        }
      });
    }

    // Remove duplicate guides (same type and position)
    const uniqueGuides = guides.filter((guide, index, array) => {
      return index === array.findIndex(g => 
        g.type === guide.type && 
        Math.abs(g.position - guide.position) < 2 &&
        g.lineType === guide.lineType
      );
    });

    return uniqueGuides;
  }, []);

  const getSnapPoint = useCallback((
    currentPoint: Point,
    guides: AlignmentGuide[]
  ): Point | null => {
    // Check if we have both vertical and horizontal guides for intersection snapping
    const verticalGuides = guides.filter(g => g.type === 'vertical');
    const horizontalGuides = guides.filter(g => g.type === 'horizontal');
    
    // If we have both vertical and horizontal guides, create intersection snap point
    if (verticalGuides.length > 0 && horizontalGuides.length > 0) {
      // Use the first guide of each type for intersection
      const verticalPos = verticalGuides[0].position;
      const horizontalPos = horizontalGuides[0].position;
      
      return { x: verticalPos, y: horizontalPos };
    }
    
    // Otherwise, prioritize point alignment, then extension guides
    const pointAlignmentGuides = guides.filter(g => g.lineType === 'point-alignment');
    const extensionGuides = guides.filter(g => g.lineType === 'extension');
    
    const prioritizedGuides = [...pointAlignmentGuides, ...extensionGuides];
    
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
