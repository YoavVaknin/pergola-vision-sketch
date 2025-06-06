
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
    tempPoints: Point[] = [], // Add temporary points parameter
    tolerance: number = 10
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

    // ADD TEMPORARY POINTS to alignment detection - this is the key enhancement!
    tempPoints.forEach((point, index) => {
      // Skip the current point being drawn and the previous point to avoid self-alignment
      if (index < tempPoints.length - 1) { // Don't include the last point (current drawing point)
        allPoints.push({
          point,
          elementType: 'temp',
          elementId: `temp-${index}`
        });
      }
    });

    console.log('All points for alignment (including temp):', allPoints);
    console.log('Temporary points:', tempPoints);
    console.log('Current point:', currentPoint);

    // ENHANCED: Collect ALL applicable point alignments instead of returning early
    const verticalAlignments: { point: Point; elementType: string }[] = [];
    const horizontalAlignments: { point: Point; elementType: string }[] = [];

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
        verticalAlignments.push({ point: targetPoint, elementType });
      }

      // HORIZONTAL ALIGNMENT: Check if current point Y is close to target point Y
      const yDiff = Math.abs(currentPoint.y - targetPoint.y);
      console.log(`Checking horizontal alignment: current Y=${currentPoint.y}, target Y=${targetPoint.y}, diff=${yDiff}`);
      
      if (yDiff <= tolerance) {
        console.log('HORIZONTAL ALIGNMENT DETECTED!');
        horizontalAlignments.push({ point: targetPoint, elementType });
      }
    });

    // Create vertical guides for all vertical alignments
    verticalAlignments.forEach(({ point: targetPoint }) => {
      const canvasHeight = 600;
      const extensionLength = 200;
      
      const minY = Math.min(currentPoint.y, targetPoint.y) - extensionLength;
      const maxY = Math.max(currentPoint.y, targetPoint.y) + extensionLength;
      
      guides.push({
        type: 'vertical',
        position: targetPoint.x,
        startPoint: { x: targetPoint.x, y: Math.max(0, minY) },
        endPoint: { x: targetPoint.x, y: Math.min(canvasHeight, maxY) },
        targetPoint: targetPoint,
        lineType: 'point-alignment'
      });
    });

    // Create horizontal guides for all horizontal alignments
    horizontalAlignments.forEach(({ point: targetPoint }) => {
      const canvasWidth = 800;
      const extensionLength = 200;
      
      const minX = Math.min(currentPoint.x, targetPoint.x) - extensionLength;
      const maxX = Math.max(currentPoint.x, targetPoint.x) + extensionLength;
      
      guides.push({
        type: 'horizontal',
        position: targetPoint.y,
        startPoint: { x: Math.max(0, minX), y: targetPoint.y },
        endPoint: { x: Math.min(canvasWidth, maxX), y: targetPoint.y },
        targetPoint: targetPoint,
        lineType: 'point-alignment'
      });
    });

    // ENHANCED: Check for line extensions from existing lines AND temporary lines
    const allLinesToCheck: { points: Point[]; isClosed: boolean; elementType: string }[] = [];
    
    // Add existing frame lines
    elements.forEach(element => {
      if (element.type === 'frame') {
        const frame = element as FrameElement;
        allLinesToCheck.push({
          points: frame.points,
          isClosed: frame.closed,
          elementType: 'frame'
        });
      }
    });
    
    // ADD TEMPORARY LINES - this is crucial for drawing mode!
    if (tempPoints.length >= 2) {
      allLinesToCheck.push({
        points: tempPoints,
        isClosed: false,
        elementType: 'temp'
      });
    }

    // ENHANCED: Collect ALL line extensions instead of returning early
    const verticalLineExtensions: { lineX: number; elementType: string }[] = [];
    const horizontalLineExtensions: { lineY: number; elementType: string }[] = [];

    allLinesToCheck.forEach(({ points, isClosed, elementType }) => {
      for (let i = 0; i < points.length; i++) {
        const p1 = points[i];
        const p2 = points[(i + 1) % points.length];
        
        // Skip if this is the last segment of an open frame/temp line
        if (!isClosed && i === points.length - 1) continue;
        
        // Check for vertical line extension
        if (Math.abs(p1.x - p2.x) < 5) { // Nearly vertical line
          const lineX = (p1.x + p2.x) / 2;
          const xDiff = Math.abs(currentPoint.x - lineX);
          
          if (xDiff <= tolerance) {
            console.log(`VERTICAL LINE EXTENSION DETECTED from ${elementType}!`);
            verticalLineExtensions.push({ lineX, elementType });
          }
        }
        
        // Check for horizontal line extension
        if (Math.abs(p1.y - p2.y) < 5) { // Nearly horizontal line
          const lineY = (p1.y + p2.y) / 2;
          const yDiff = Math.abs(currentPoint.y - lineY);
          
          if (yDiff <= tolerance) {
            console.log(`HORIZONTAL LINE EXTENSION DETECTED from ${elementType}!`);
            horizontalLineExtensions.push({ lineY, elementType });
          }
        }
      }
    });

    // Create vertical extension guides for all vertical line extensions
    verticalLineExtensions.forEach(({ lineX }) => {
      const canvasHeight = 600;
      const extendedMinY = currentPoint.y - 100;
      const extendedMaxY = currentPoint.y + 100;
      
      guides.push({
        type: 'vertical',
        position: lineX,
        startPoint: { x: lineX, y: Math.max(0, extendedMinY) },
        endPoint: { x: lineX, y: Math.min(canvasHeight, extendedMaxY) },
        targetPoint: { x: lineX, y: currentPoint.y },
        lineType: 'extension'
      });
    });

    // Create horizontal extension guides for all horizontal line extensions
    horizontalLineExtensions.forEach(({ lineY }) => {
      const canvasWidth = 800;
      const extendedMinX = currentPoint.x - 100;
      const extendedMaxX = currentPoint.x + 100;
      
      guides.push({
        type: 'horizontal',
        position: lineY,
        startPoint: { x: Math.max(0, extendedMinX), y: lineY },
        endPoint: { x: Math.min(canvasWidth, extendedMaxX), y: lineY },
        targetPoint: { x: currentPoint.x, y: lineY },
        lineType: 'extension'
      });
    });

    console.log('Generated alignment guides:', guides);

    // ENHANCED: Remove duplicate guides but allow both vertical AND horizontal extension guides
    const uniqueGuides = guides.filter((guide, index, array) => {
      return index === array.findIndex(g => 
        g.type === guide.type && 
        Math.abs(g.position - guide.position) < 3 &&
        g.lineType === guide.lineType
      );
    });

    // Sort guides by priority: extension first, then point-alignment
    return uniqueGuides.sort((a, b) => {
      if (a.lineType !== b.lineType) {
        const priority = { 'extension': 0, 'point-alignment': 1, 'parallel': 2 };
        return priority[a.lineType] - priority[b.lineType];
      }
      // Within the same line type, prefer vertical then horizontal
      if (a.type !== b.type) {
        return a.type === 'vertical' ? -1 : 1;
      }
      return 0;
    });
  }, []);

  const getSnapPoint = useCallback((
    currentPoint: Point,
    guides: AlignmentGuide[]
  ): Point | null => {
    // ENHANCED: Support multi-dimensional snapping for intersection points
    const extensionGuides = guides.filter(g => g.lineType === 'extension');
    const pointAlignmentGuides = guides.filter(g => g.lineType === 'point-alignment');
    
    // First priority: Extension line intersections
    if (extensionGuides.length >= 2) {
      const verticalGuide = extensionGuides.find(g => g.type === 'vertical');
      const horizontalGuide = extensionGuides.find(g => g.type === 'horizontal');
      
      if (verticalGuide && horizontalGuide) {
        console.log('EXTENSION INTERSECTION POINT DETECTED!');
        return { 
          x: verticalGuide.position, 
          y: horizontalGuide.position 
        };
      }
    }
    
    // Second priority: Point alignment intersections
    if (pointAlignmentGuides.length >= 2) {
      const verticalGuide = pointAlignmentGuides.find(g => g.type === 'vertical');
      const horizontalGuide = pointAlignmentGuides.find(g => g.type === 'horizontal');
      
      if (verticalGuide && horizontalGuide) {
        console.log('POINT ALIGNMENT INTERSECTION DETECTED!');
        return { 
          x: verticalGuide.position, 
          y: horizontalGuide.position 
        };
      }
    }
    
    // Third priority: Mixed intersection (extension + point alignment)
    if (extensionGuides.length >= 1 && pointAlignmentGuides.length >= 1) {
      const verticalGuide = extensionGuides.find(g => g.type === 'vertical') || pointAlignmentGuides.find(g => g.type === 'vertical');
      const horizontalGuide = extensionGuides.find(g => g.type === 'horizontal') || pointAlignmentGuides.find(g => g.type === 'horizontal');
      
      if (verticalGuide && horizontalGuide) {
        console.log('MIXED INTERSECTION DETECTED!');
        return { 
          x: verticalGuide.position, 
          y: horizontalGuide.position 
        };
      }
    }
    
    // Fallback to single guide snapping
    if (guides.length > 0) {
      const guide = guides[0]; // Take highest priority guide
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
