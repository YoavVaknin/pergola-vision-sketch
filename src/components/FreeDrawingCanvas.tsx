import { useRef, useEffect, useState, useCallback } from 'react';
import { Point, PergolaElementType, FrameElement, BeamElement, ColumnElement, WallElement, ShadingElement, DivisionElement } from '@/types/pergola';
import { usePergolaDrawing } from '@/hooks/usePergolaDrawing';
import { useSmartAlignment, AlignmentGuide } from '@/hooks/useSmartAlignment';
import { useCornerEditing } from '@/hooks/useCornerEditing';
import { usePergolaAccessories, AccessoryType, PergolaAccessory } from '@/hooks/usePergolaAccessories';
import { DrawingToolbar } from './DrawingToolbar';
import { ShadingConfigComponent } from './ShadingConfig';
import { AccessoriesMenu } from './AccessoriesMenu';
import { LengthInput } from './LengthInput';
import { DimensionEditor } from './DimensionEditor';
import { getMidpoint, getPolygonCentroid, formatMeasurement, formatArea, calculateRealDistance } from '@/utils/measurementUtils';
import { Lightbulb, Fan } from 'lucide-react';

export const FreeDrawingCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<Point | null>(null);
  const [mousePosition, setMousePosition] = useState<Point | null>(null);
  const [isNearFirstPoint, setIsNearFirstPoint] = useState(false);
  const [snapPoint, setSnapPoint] = useState<Point | null>(null);
  const [angleSnapPoint, setAngleSnapPoint] = useState<Point | null>(null);
  const [isAngleSnapped, setIsAngleSnapped] = useState(false);
  const [alignmentGuides, setAlignmentGuides] = useState<AlignmentGuide[]>([]);
  const [alignmentSnapPoint, setAlignmentSnapPoint] = useState<Point | null>(null);
  const [hoveredCorner, setHoveredCorner] = useState<{ elementId: string; cornerIndex: number } | null>(null);
  
  const {
    elements,
    drawingState,
    shadingConfig,
    measurementConfig,
    lengthInputState,
    dimensionEditState,
    addPoint,
    finishFrame,
    addBeam,
    addColumn,
    addWall,
    removeElement,
    setMode,
    selectElement,
    clearAll,
    updateShadingConfig,
    updateMeasurementConfig,
    showLengthInput,
    hideLengthInput,
    handleLengthSubmit,
    calculatePointByLength,
    showDimensionEditor,
    hideDimensionEditor,
    handleDimensionEdit,
    updateCornerPosition
  } = usePergolaDrawing();

  const { findAlignmentGuides, getSnapPoint } = useSmartAlignment();
  const { 
    editState, 
    findNearestCorner, 
    startCornerEdit, 
    updateCornerPosition: getUpdatedCornerPosition, 
    stopCornerEdit 
  } = useCornerEditing();

  // Add accessories functionality
  const {
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
  } = usePergolaAccessories();

  // Calculate accessory counts
  const accessoryCount = accessories.reduce((acc, accessory) => {
    acc[accessory.type] = (acc[accessory.type] || 0) + 1;
    return acc;
  }, {} as { [key in AccessoryType]: number });

  // Handle adding accessories
  const handleAddAccessory = useCallback((type: AccessoryType) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (type === 'color') {
      // Color change is handled by the AccessoriesMenu component
      return;
    }

    const defaultPosition = getDefaultPosition(canvas.width, canvas.height);
    addAccessory(type, defaultPosition);
  }, [addAccessory, getDefaultPosition]);

  const getCanvasPoint = useCallback((clientX: number, clientY: number): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  }, []);

  const calculateDistance = useCallback((point1: Point, point2: Point): number => {
    const dx = point1.x - point2.x;
    const dy = point1.y - point2.y;
    return Math.sqrt(dx * dx + dy * dy);
  }, []);

  const calculateAngle = useCallback((point1: Point, point2: Point): number => {
    const dx = point2.x - point1.x;
    const dy = point2.y - point1.y;
    const angleRad = Math.atan2(dy, dx);
    const angleDeg = (angleRad * 180) / Math.PI;
    return angleDeg;
  }, []);

  const calculateSnappedAnglePoint = useCallback((startPoint: Point, endPoint: Point): { point: Point; snapped: boolean } => {
    const distance = calculateDistance(startPoint, endPoint);
    const currentAngle = calculateAngle(startPoint, endPoint);
    
    const targetAngles = [0, 45, 90, 135, 180, -135, -90, -45];
    const tolerance = 5;
    
    for (const targetAngle of targetAngles) {
      const angleDiff = Math.abs(currentAngle - targetAngle);
      const angleDiff360 = Math.abs(currentAngle - targetAngle + 360);
      const angleDiffNeg360 = Math.abs(currentAngle - targetAngle - 360);
      
      if (angleDiff <= tolerance || angleDiff360 <= tolerance || angleDiffNeg360 <= tolerance) {
        const targetAngleRad = (targetAngle * Math.PI) / 180;
        const snappedPoint: Point = {
          x: startPoint.x + distance * Math.cos(targetAngleRad),
          y: startPoint.y + distance * Math.sin(targetAngleRad)
        };
        return { point: snappedPoint, snapped: true };
      }
    }
    
    return { point: endPoint, snapped: false };
  }, [calculateDistance, calculateAngle]);

  const findSnapPoint = useCallback((mousePos: Point): Point | null => {
    if (drawingState.mode !== 'frame') return null;
    
    const SNAP_DISTANCE = 10;
    
    if (drawingState.tempPoints.length >= 3) {
      const firstPoint = drawingState.tempPoints[0];
      const distance = calculateDistance(mousePos, firstPoint);
      if (distance <= SNAP_DISTANCE) {
        return firstPoint;
      }
    }
    
    for (const element of elements) {
      if (element.type === 'frame') {
        const frameElement = element as FrameElement;
        for (const point of frameElement.points) {
          const distance = calculateDistance(mousePos, point);
          if (distance <= SNAP_DISTANCE) {
            return point;
          }
        }
      }
    }
    
    return null;
  }, [drawingState.mode, drawingState.tempPoints, elements, calculateDistance]);

  const checkNearFirstPoint = useCallback((mousePos: Point): boolean => {
    if (drawingState.mode !== 'frame' || drawingState.tempPoints.length < 3) {
      return false;
    }
    
    const firstPoint = drawingState.tempPoints[0];
    const distance = calculateDistance(mousePos, firstPoint);
    return distance <= 10;
  }, [drawingState.mode, drawingState.tempPoints, calculateDistance]);

  const checkDimensionClick = useCallback((mousePos: Point): { elementId: string; segmentIndex: number; position: Point; length: number } | null => {
    for (const element of elements) {
      if (element.type === 'frame') {
        const frame = element as FrameElement;
        if (frame.measurements) {
          for (let i = 0; i < frame.measurements.segmentLengths.length; i++) {
            const point1 = frame.points[i];
            const point2 = frame.points[(i + 1) % frame.points.length];
            
            if (!frame.closed && i === frame.points.length - 1) continue;
            
            const midpoint = getMidpoint(point1, point2);
            
            const distance = Math.sqrt(
              Math.pow(mousePos.x - midpoint.x, 2) + Math.pow(mousePos.y - midpoint.y, 2)
            );
            
            if (distance <= 20) {
              return {
                elementId: element.id,
                segmentIndex: i,
                position: midpoint,
                length: frame.measurements.segmentLengths[i]
              };
            }
          }
        }
      }
    }
    return null;
  }, [elements]);

  const drawMeasurementText = useCallback((ctx: CanvasRenderingContext2D, text: string, x: number, y: number, options: {
    fontSize?: number;
    color?: string;
    background?: boolean;
    align?: 'center' | 'left' | 'right';
    clickable?: boolean;
  } = {}) => {
    const {
      fontSize = 12,
      color = '#374151',
      background = true,
      align = 'center',
      clickable = false
    } = options;

    ctx.font = `${fontSize}px Arial`;
    ctx.textAlign = align;
    ctx.textBaseline = 'middle';

    if (background) {
      const metrics = ctx.measureText(text);
      const padding = clickable ? 6 : 4;
      const bgWidth = metrics.width + padding * 2;
      const bgHeight = fontSize + padding * 2;
      
      ctx.fillStyle = clickable ? 'rgba(59, 130, 246, 0.1)' : 'rgba(255, 255, 255, 0.9)';
      ctx.fillRect(x - bgWidth / 2, y - bgHeight / 2, bgWidth, bgHeight);
      
      ctx.strokeStyle = clickable ? '#3b82f6' : '#e5e7eb';
      ctx.lineWidth = 1;
      ctx.strokeRect(x - bgWidth / 2, y - bgHeight / 2, bgWidth, bgHeight);
    }

    ctx.fillStyle = clickable ? '#3b82f6' : color;
    ctx.fillText(text, x, y);
  }, []);

  const drawAccessories = useCallback((ctx: CanvasRenderingContext2D) => {
    accessories.forEach(accessory => {
      const isHovered = hoveredAccessoryId === accessory.id;
      const isDragged = dragState.isDragging && dragState.draggedAccessoryId === accessory.id;
      
      // Apply shadow effect during drag
      if (isDragged) {
        ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        ctx.shadowBlur = 8;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
      }
      
      // Slightly transparent during drag
      ctx.globalAlpha = isDragged ? 0.7 : 1;
      
      ctx.fillStyle = accessory.color || '#000000';
      ctx.strokeStyle = accessory.color || '#000000';
      
      switch (accessory.type) {
        case 'light':
          ctx.fillStyle = accessory.color || '#fbbf24';
          ctx.beginPath();
          ctx.arc(accessory.position.x, accessory.position.y, (accessory.size || 12) / 2, 0, 2 * Math.PI);
          ctx.fill();
          
          ctx.strokeStyle = accessory.color || '#fbbf24';
          ctx.lineWidth = 2;
          for (let i = 0; i < 8; i++) {
            const angle = (i * Math.PI) / 4;
            const startRadius = (accessory.size || 12) / 2 + 2;
            const endRadius = (accessory.size || 12) / 2 + 6;
            ctx.beginPath();
            ctx.moveTo(
              accessory.position.x + Math.cos(angle) * startRadius,
              accessory.position.y + Math.sin(angle) * startRadius
            );
            ctx.lineTo(
              accessory.position.x + Math.cos(angle) * endRadius,
              accessory.position.y + Math.sin(angle) * endRadius
            );
            ctx.stroke();
          }
          break;
          
        case 'fan':
          ctx.fillStyle = accessory.color || '#6b7280';
          ctx.beginPath();
          ctx.arc(accessory.position.x, accessory.position.y, 4, 0, 2 * Math.PI);
          ctx.fill();
          
          ctx.strokeStyle = accessory.color || '#6b7280';
          ctx.lineWidth = 3;
          for (let i = 0; i < 4; i++) {
            const angle = (i * Math.PI) / 2;
            const bladeLength = (accessory.size || 20) / 2;
            ctx.beginPath();
            ctx.moveTo(accessory.position.x, accessory.position.y);
            ctx.lineTo(
              accessory.position.x + Math.cos(angle) * bladeLength,
              accessory.position.y + Math.sin(angle) * bladeLength
            );
            ctx.stroke();
          }
          break;
          
        case 'column':
          const columnSize = accessory.size || 8;
          ctx.fillStyle = accessory.color || '#374151';
          ctx.fillRect(
            accessory.position.x - columnSize / 2,
            accessory.position.y - columnSize / 2,
            columnSize,
            columnSize
          );
          break;
          
        case 'wall':
          ctx.strokeStyle = accessory.color || '#111827';
          ctx.lineWidth = accessory.size || 6;
          const wallLength = 60;
          ctx.beginPath();
          ctx.moveTo(accessory.position.x - wallLength / 2, accessory.position.y);
          ctx.lineTo(accessory.position.x + wallLength / 2, accessory.position.y);
          ctx.stroke();
          
          ctx.strokeStyle = '#9ca3af';
          ctx.lineWidth = 1;
          for (let i = -wallLength / 2; i < wallLength / 2; i += 10) {
            ctx.beginPath();
            ctx.moveTo(accessory.position.x + i, accessory.position.y - 3);
            ctx.lineTo(accessory.position.x + i, accessory.position.y + 3);
            ctx.stroke();
          }
          break;
      }
      
      // Draw hover outline
      if (isHovered && !isDragged) {
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 2;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        
        let hoverRadius = 20;
        switch (accessory.type) {
          case 'light':
            hoverRadius = (accessory.size || 12) / 2 + 8;
            break;
          case 'fan':
            hoverRadius = (accessory.size || 20) / 2 + 8;
            break;
          case 'column':
            hoverRadius = (accessory.size || 8) / 2 + 8;
            break;
          case 'wall':
            hoverRadius = 35;
            break;
        }
        
        ctx.arc(accessory.position.x, accessory.position.y, hoverRadius, 0, 2 * Math.PI);
        ctx.stroke();
        ctx.setLineDash([]);
      }
      
      // Reset shadow and alpha
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
      ctx.globalAlpha = 1;
    });
  }, [accessories, hoveredAccessoryId, dragState]);

  const drawElements = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    ctx.strokeStyle = '#f3f4f6';
    ctx.lineWidth = 1;
    for (let i = 0; i <= canvas.width; i += 20) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, canvas.height);
      ctx.stroke();
    }
    for (let i = 0; i <= canvas.height; i += 20) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(canvas.width, i);
      ctx.stroke();
    }

    alignmentGuides.forEach(guide => {
      if (guide.lineType === 'extension') {
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
      } else {
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 2]);
      }
      
      ctx.beginPath();
      ctx.moveTo(guide.startPoint.x, guide.startPoint.y);
      ctx.lineTo(guide.endPoint.x, guide.endPoint.y);
      ctx.stroke();
      ctx.setLineDash([]);
      
      ctx.fillStyle = guide.lineType === 'extension' ? '#3b82f6' : '#10b981';
      ctx.beginPath();
      ctx.arc(guide.targetPoint.x, guide.targetPoint.y, 3, 0, 2 * Math.PI);
      ctx.fill();
    });

    elements.forEach(element => {
      ctx.strokeStyle = element.type === 'frame' ? accessoryConfig.frameColor : (element.color || '#000000');
      
      switch (element.type) {
        case 'frame':
          const frame = element as FrameElement;
          if (frame.points.length > 1) {
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(frame.points[0].x, frame.points[0].y);
            frame.points.slice(1).forEach(point => {
              ctx.lineTo(point.x, point.y);
            });
            if (frame.closed && frame.points.length > 2) {
              ctx.closePath();
            }
            ctx.stroke();

            if (measurementConfig.showLengths && frame.measurements) {
              frame.measurements.segmentLengths.forEach((length, index) => {
                const point1 = frame.points[index];
                const point2 = frame.points[(index + 1) % frame.points.length];
                
                if (!frame.closed && index === frame.points.length - 1) return;
                
                const midpoint = getMidpoint(point1, point2);
                const lengthText = formatMeasurement(length, measurementConfig.unit);
                
                drawMeasurementText(ctx, lengthText, midpoint.x, midpoint.y, {
                  fontSize: 11,
                  color: '#6b7280',
                  clickable: true
                });
              });
            }

            if (measurementConfig.showAngles && frame.measurements && frame.measurements.angles && frame.closed) {
              frame.measurements.angles.forEach((angle, index) => {
                const point = frame.points[index];
                const angleText = `${angle.toFixed(0)}°`;
                
                const offset = 15;
                drawMeasurementText(ctx, angleText, point.x + offset, point.y - offset, {
                  fontSize: 10,
                  color: '#059669'
                });
              });
            }

            if (measurementConfig.showArea && frame.measurements && frame.measurements.area && frame.closed) {
              const centroid = getPolygonCentroid(frame.points);
              const areaText = `שטח: ${formatArea(frame.measurements.area)}`;
              
              drawMeasurementText(ctx, areaText, centroid.x, centroid.y, {
                fontSize: 14,
                color: '#dc2626',
                background: true
              });
            }
          }
          frame.points.forEach((point, index) => {
            const isHovered = hoveredCorner?.elementId === frame.id && hoveredCorner?.cornerIndex === index;
            const isBeingEdited = editState.isEditing && editState.elementId === frame.id && editState.cornerIndex === index;
            
            ctx.fillStyle = isBeingEdited ? '#f59e0b' : (isHovered ? '#10b981' : '#ef4444');
            ctx.beginPath();
            ctx.arc(point.x, point.y, isHovered || isBeingEdited ? 6 : 4, 0, 2 * Math.PI);
            ctx.fill();
            
            if (isHovered || isBeingEdited) {
              ctx.strokeStyle = isBeingEdited ? '#d97706' : '#059669';
              ctx.lineWidth = 2;
              ctx.stroke();
            }
          });
          break;
          
        case 'beam':
          const beam = element as BeamElement;
          ctx.lineWidth = beam.width;
          ctx.beginPath();
          ctx.moveTo(beam.start.x, beam.start.y);
          ctx.lineTo(beam.end.x, beam.end.y);
          ctx.stroke();
          break;

        case 'shading':
          const shading = element as ShadingElement;
          ctx.strokeStyle = shading.color || '#8b4513';
          ctx.lineWidth = shading.width || 2;
          ctx.setLineDash([]);
          ctx.beginPath();
          ctx.moveTo(shading.start.x, shading.start.y);
          ctx.lineTo(shading.end.x, shading.end.y);
          ctx.stroke();
          break;

        case 'division':
          const division = element as DivisionElement;
          ctx.strokeStyle = division.color || '#f97316';
          ctx.lineWidth = division.width || 3;
          ctx.setLineDash([]);
          ctx.beginPath();
          ctx.moveTo(division.start.x, division.start.y);
          ctx.lineTo(division.end.x, division.end.y);
          ctx.stroke();
          break;
          
        case 'column':
          const column = element as ColumnElement;
          ctx.fillStyle = element.color || '#374151';
          ctx.fillRect(
            column.position.x - column.size / 2,
            column.position.y - column.size / 2,
            column.size,
            column.size
          );
          break;
          
        case 'wall':
          const wall = element as WallElement;
          ctx.lineWidth = wall.height;
          ctx.beginPath();
          ctx.moveTo(wall.start.x, wall.start.y);
          ctx.lineTo(wall.end.x, wall.end.y);
          ctx.stroke();
          break;
      }
    });

    drawAccessories(ctx);

    if (snapPoint && drawingState.mode === 'frame') {
      ctx.strokeStyle = '#22c55e';
      ctx.fillStyle = 'rgba(34, 197, 94, 0.2)';
      ctx.lineWidth = 2;
      
      ctx.beginPath();
      ctx.arc(snapPoint.x, snapPoint.y, 8, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();
      
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.arc(snapPoint.x, snapPoint.y, 12, 0, 2 * Math.PI);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    if (alignmentSnapPoint) {
      ctx.strokeStyle = '#3b82f6';
      ctx.fillStyle = 'rgba(59, 130, 246, 0.3)';
      ctx.lineWidth = 2;
      
      ctx.beginPath();
      ctx.arc(alignmentSnapPoint.x, alignmentSnapPoint.y, 6, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();
    }

    if (drawingState.mode === 'frame' && drawingState.tempPoints.length > 0) {
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      
      if (drawingState.tempPoints.length > 1) {
        ctx.beginPath();
        ctx.moveTo(drawingState.tempPoints[0].x, drawingState.tempPoints[0].y);
        drawingState.tempPoints.slice(1).forEach(point => {
          ctx.lineTo(point.x, point.y);
        });
        ctx.stroke();
      }
      
      ctx.setLineDash([]);
      drawingState.tempPoints.forEach((point, index) => {
        if (index === 0) {
          if (isNearFirstPoint) {
            ctx.fillStyle = '#22c55e';
            ctx.strokeStyle = '#16a34a';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(point.x, point.y, 8, 0, 2 * Math.PI);
            ctx.fill();
            ctx.stroke();
            
            ctx.strokeStyle = '#22c55e';
            ctx.lineWidth = 1;
            ctx.setLineDash([3, 3]);
            ctx.beginPath();
            ctx.arc(point.x, point.y, 12, 0, 2 * Math.PI);
            ctx.stroke();
            ctx.setLineDash([]);
          } else {
            ctx.fillStyle = '#10b981';
            ctx.beginPath();
            ctx.arc(point.x, point.y, 6, 0, 2 * Math.PI);
            ctx.fill();
          }
        } else {
          ctx.fillStyle = '#10b981';
          ctx.beginPath();
          ctx.arc(point.x, point.y, 6, 0, 2 * Math.PI);
          ctx.fill();
        }
      });
      
      if (mousePosition && drawingState.tempPoints.length > 0) {
        const lastPoint = drawingState.tempPoints[drawingState.tempPoints.length - 1];
        let targetPoint = alignmentSnapPoint || snapPoint || mousePosition;
        let lineColor = alignmentSnapPoint ? '#3b82f6' : (snapPoint ? '#22c55e' : '#94a3b8');
        let lineWidth = (alignmentSnapPoint || snapPoint) ? 2 : 1;
        let lineDash: number[] = [3, 3];
        
        if (!snapPoint && !alignmentSnapPoint) {
          const { point: anglePoint, snapped } = calculateSnappedAnglePoint(lastPoint, mousePosition);
          if (snapped) {
            targetPoint = anglePoint;
            lineColor = '#f59e0b';
            lineWidth = 2;
            lineDash = [5, 2];
            setAngleSnapPoint(anglePoint);
            setIsAngleSnapped(true);
          } else {
            setAngleSnapPoint(null);
            setIsAngleSnapped(false);
          }
        } else {
          setAngleSnapPoint(null);
          setIsAngleSnapped(false);
        }
        
        ctx.strokeStyle = lineColor;
        ctx.lineWidth = lineWidth;
        ctx.setLineDash(lineDash);
        ctx.beginPath();
        ctx.moveTo(lastPoint.x, lastPoint.y);
        ctx.lineTo(targetPoint.x, targetPoint.y);
        ctx.stroke();
        ctx.setLineDash([]);
        
        if (targetPoint && measurementConfig.showLengths) {
          const currentLength = calculateRealDistance(lastPoint, targetPoint, measurementConfig.pixelsPerCm);
          const lengthText = formatMeasurement(currentLength, measurementConfig.unit);
          const midpoint = getMidpoint(lastPoint, targetPoint);
          
          drawMeasurementText(ctx, lengthText, midpoint.x, midpoint.y - 15, {
            fontSize: 12,
            color: '#059669',
            background: true
          });
        }
        
        if (isAngleSnapped && angleSnapPoint) {
          ctx.fillStyle = '#f59e0b';
          ctx.strokeStyle = '#d97706';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(angleSnapPoint.x, angleSnapPoint.y, 4, 0, 2 * Math.PI);
          ctx.fill();
          ctx.stroke();
        }
      }
    }
  }, [elements, drawingState, mousePosition, isNearFirstPoint, snapPoint, angleSnapPoint, isAngleSnapped, alignmentGuides, alignmentSnapPoint, hoveredCorner, editState, calculateSnappedAnglePoint, measurementConfig, drawMeasurementText, accessories, accessoryConfig, drawAccessories]);

  useEffect(() => {
    drawElements();
  }, [drawElements]);

  const handleMouseMove = (e: React.MouseEvent) => {
    const point = getCanvasPoint(e.clientX, e.clientY);
    setMousePosition(point);
    
    // Handle accessory dragging
    if (dragState.isDragging) {
      updateDragPosition(point);
      return;
    }
    
    // Check for accessory hover
    const accessoryAtPoint = findAccessoryAtPoint(point);
    setHoveredAccessory(accessoryAtPoint?.id || null);
    
    if (!editState.isEditing && drawingState.mode === 'select') {
      const nearestCorner = findNearestCorner(point, elements);
      setHoveredCorner(nearestCorner);
    }
    
    if (editState.isEditing) {
      const newPosition = getUpdatedCornerPosition(point);
      if (newPosition && editState.elementId && editState.cornerIndex !== null) {
        updateCornerPosition(editState.elementId, editState.cornerIndex, newPosition);
      }
      return;
    }
    
    const nearFirst = checkNearFirstPoint(point);
    setIsNearFirstPoint(nearFirst);
    
    const foundSnapPoint = findSnapPoint(point);
    setSnapPoint(foundSnapPoint);

    if (drawingState.mode === 'frame' && drawingState.tempPoints.length > 0) {
      const lastPoint = drawingState.tempPoints[drawingState.tempPoints.length - 1];
      const guides = findAlignmentGuides(point, lastPoint, elements, 15);
      setAlignmentGuides(guides);
      
      const alignSnap = getSnapPoint(point, guides);
      setAlignmentSnapPoint(alignSnap);
    } else {
      setAlignmentGuides([]);
      setAlignmentSnapPoint(null);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const point = getCanvasPoint(e.clientX, e.clientY);
    
    // Check if clicking on an accessory first
    const accessoryAtPoint = findAccessoryAtPoint(point);
    if (accessoryAtPoint) {
      startDragging(accessoryAtPoint.id, point, accessoryAtPoint.position);
      return;
    }
    
    const dimensionClick = checkDimensionClick(point);
    if (dimensionClick) {
      showDimensionEditor(
        dimensionClick.elementId,
        dimensionClick.segmentIndex,
        dimensionClick.position,
        dimensionClick.length
      );
      return;
    }
    
    if (drawingState.mode === 'select') {
      const nearestCorner = findNearestCorner(point, elements);
      if (nearestCorner) {
        const element = elements.find(el => el.id === nearestCorner.elementId);
        if (element && element.type === 'frame') {
          const frame = element as FrameElement;
          const cornerPoint = frame.points[nearestCorner.cornerIndex];
          startCornerEdit(nearestCorner.elementId, nearestCorner.cornerIndex, point, cornerPoint);
          return;
        }
      }
    }
    
    switch (drawingState.mode) {
      case 'frame':
        let pointToAdd = point;
        
        if (alignmentSnapPoint) {
          pointToAdd = alignmentSnapPoint;
        } else if (snapPoint) {
          pointToAdd = snapPoint;
          if (drawingState.tempPoints.length >= 3 && 
              snapPoint === drawingState.tempPoints[0]) {
            console.log('Auto-closing frame - snapped to first point');
            finishFrame();
            return;
          }
        } else if (isAngleSnapped && angleSnapPoint) {
          pointToAdd = angleSnapPoint;
        }
        
        addPoint(pointToAdd);
        break;
        
      case 'beam':
      case 'wall':
        setIsDragging(true);
        setDragStart(point);
        break;
        
      case 'column':
        addColumn(point);
        break;
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    // Handle accessory drag end
    if (dragState.isDragging) {
      stopDragging();
      return;
    }
    
    const point = getCanvasPoint(e.clientX, e.clientY);
    
    switch (drawingState.mode) {
      case 'beam':
        addBeam(dragStart, point);
        break;
        
      case 'wall':
        addWall(dragStart, point);
        break;
    }
    
    setIsDragging(false);
    setDragStart(null);
  };

  // Touch event handlers for mobile support
  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    const touch = e.touches[0];
    const point = getCanvasPoint(touch.clientX, touch.clientY);
    
    const accessoryAtPoint = findAccessoryAtPoint(point);
    if (accessoryAtPoint) {
      startDragging(accessoryAtPoint.id, point, accessoryAtPoint.position);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    if (dragState.isDragging && e.touches.length === 1) {
      const touch = e.touches[0];
      const point = getCanvasPoint(touch.clientX, touch.clientY);
      updateDragPosition(point);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    if (dragState.isDragging) {
      stopDragging();
    }
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    if (drawingState.mode === 'frame' && drawingState.tempPoints.length >= 3) {
      finishFrame();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Tab' && drawingState.mode === 'frame' && drawingState.tempPoints.length > 0 && mousePosition) {
      e.preventDefault();
      const lastPoint = drawingState.tempPoints[drawingState.tempPoints.length - 1];
      showLengthInput(lastPoint, mousePosition);
    }
  };

  const handleClearAll = () => {
    clearAll();
    clearAllAccessories();
  };

  // Dynamic cursor based on hover state
  const getCursor = () => {
    if (dragState.isDragging) return 'grabbing';
    if (hoveredAccessoryId) return 'grab';
    if (hoveredCorner) return 'move';
    if (editState.isEditing) return 'grabbing';
    return 'crosshair';
  };

  return (
    <div className="grid lg:grid-cols-4 gap-6 h-full" onKeyDown={handleKeyDown} tabIndex={0}>
      <div className="lg:col-span-1 space-y-4">
        <DrawingToolbar
          mode={drawingState.mode}
          onModeChange={setMode}
          onClear={handleClearAll}
          isDrawing={drawingState.isDrawing}
          onFinishFrame={finishFrame}
        />
        
        <AccessoriesMenu
          onAddAccessory={handleAddAccessory}
          accessoryConfig={accessoryConfig}
          onConfigChange={updateAccessoryConfig}
          accessoryCount={accessoryCount}
        />
        
        <ShadingConfigComponent
          config={shadingConfig}
          onConfigChange={updateShadingConfig}
        />

        <div className="p-4 bg-muted rounded-lg">
          <h4 className="font-semibold mb-2">הגדרות מדידה</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm">הצג אורכים</label>
              <input
                type="checkbox"
                checked={measurementConfig.showLengths}
                onChange={(e) => updateMeasurementConfig({ showLengths: e.target.checked })}
                className="rounded"
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm">הצג שטח</label>
              <input
                type="checkbox"
                checked={measurementConfig.showArea}
                onChange={(e) => updateMeasurementConfig({ showArea: e.target.checked })}
                className="rounded"
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm">הצג זוויות</label>
              <input
                type="checkbox"
                checked={measurementConfig.showAngles}
                onChange={(e) => updateMeasurementConfig({ showAngles: e.target.checked })}
                className="rounded"
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm">יחידת מדידה</label>
              <select
                value={measurementConfig.unit}
                onChange={(e) => updateMeasurementConfig({ unit: e.target.value as any })}
                className="text-sm border rounded px-2 py-1"
              >
                <option value="cm">ס״מ</option>
                <option value="mm">מ״מ</option>
                <option value="m">מטר</option>
              </select>
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm">סקלה (פיקסלים/ס״מ)</label>
              <input
                type="number"
                value={measurementConfig.pixelsPerCm}
                onChange={(e) => updateMeasurementConfig({ pixelsPerCm: parseFloat(e.target.value) || 2 })}
                className="text-sm border rounded px-2 py-1 w-16"
                min="0.1"
                step="0.1"
              />
            </div>
          </div>
        </div>
        
        <div className="p-4 bg-muted rounded-lg">
          <h4 className="font-semibold mb-2">סטטistikות</h4>
          <div className="text-sm space-y-1">
            <p>מסגרות: {elements.filter(e => e.type === 'frame').length}</p>
            <p>קורות: {elements.filter(e => e.type === 'beam').length}</p>
            <p>הצללה: {elements.filter(e => e.type === 'shading').length}</p>
            <p>חלוקה: {elements.filter(e => e.type === 'division').length}</p>
            <p>עמודים: {elements.filter(e => e.type === 'column').length + (accessoryCount.column || 0)}</p>
            <p>קירות: {elements.filter(e => e.type === 'wall').length + (accessoryCount.wall || 0)}</p>
            <p>תאורה: {accessoryCount.light || 0}</p>
            <p>מאווררים: {accessoryCount.fan || 0}</p>
          </div>
        </div>
      </div>
      
      <div className="lg:col-span-3">
        <div className="border rounded-lg shadow-sm bg-white p-4">
          <h3 className="text-lg font-semibold mb-4">שרטוט חופשי עם מדידות ותוספות</h3>
          <div className="relative">
            <canvas
              ref={canvasRef}
              width={800}
              height={600}
              className="border rounded cursor-crosshair bg-white"
              onMouseDown={handleMouseDown}
              onMouseUp={handleMouseUp}
              onMouseMove={handleMouseMove}
              onDoubleClick={handleDoubleClick}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              style={{ 
                cursor: getCursor(),
                touchAction: 'none' // Prevent default touch behaviors
              }}
            />
            
            <LengthInput
              visible={lengthInputState.visible}
              position={lengthInputState.position}
              currentLength={lengthInputState.targetLength}
              unit={measurementConfig.unit}
              onSubmit={handleLengthSubmit}
              onCancel={hideLengthInput}
            />
            
            <DimensionEditor
              visible={dimensionEditState.visible}
              position={dimensionEditState.position}
              currentValue={dimensionEditState.currentLength}
              unit={measurementConfig.unit}
              onSubmit={handleDimensionEdit}
              onCancel={hideDimensionEditor}
            />
          </div>
          
          <div className="mt-4 text-sm text-muted-foreground">
            <p><strong>הוראות:</strong></p>
            <p>• מסגרת: לחץ לסימון נקודות, הקרב לנקודה קיימת לסנאפ אוטומטי</p>
            <p>• <span className="text-amber-600">יישור זווית:</span> קווים בזווית נעולה (0°, 45°, 90°) בכתום מקווקו</p>
            <p>• <span className="text-blue-600">יישור הרחבה:</span> קווי עזר כחולים מיישרים לקצות קווים קיימים</p>
            <p>• <span className="text-green-600">ישור מקביל:</span> קווי עזר ירוקים מיישרים למרכז קווים מקבילים</p>
            <p>• <strong>תוספות:</strong> בחר תוספות מהתפריט השמאלי להוספה למרכז הפרגולה</p>
            <p>• <strong>גרירת תוספות:</strong> לחץ וגרור תוספות לשינוי מיקום (תמיכה במסכי מגע)</p>
            <p>• <strong>עריכת פינות:</strong> במצב בחירה, לחץ וגרור פינות לשינוי מיקום</p>
            <p>• <strong>עריכת מידות:</strong> לחץ על מספר המידה בכחול לשינוי אורך הקו</p>
            <p>• <strong>Tab:</strong> פתח קלט לאורך מדויק במהלך השרטוט</p>
          </div>
        </div>
      </div>
    </div>
  );
};
