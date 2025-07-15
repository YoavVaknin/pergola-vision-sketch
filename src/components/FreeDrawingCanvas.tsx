import { useRef, useEffect, useState, useCallback } from 'react';
import { Point, PergolaElementType, FrameElement, BeamElement, ColumnElement, WallElement, ShadingElement, DivisionElement } from '@/types/pergola';
import { usePergolaDrawing } from '@/hooks/usePergolaDrawing';
import { useSmartAlignment, AlignmentGuide } from '@/hooks/useSmartAlignment';
import { useCornerEditing } from '@/hooks/useCornerEditing';
import { usePergolaAccessories, AccessoryType, PergolaAccessory } from '@/hooks/usePergolaAccessories';
import { useCanvasZoom } from '@/hooks/useCanvasZoom';
import { DrawingToolbar } from './DrawingToolbar';
import { ShadingConfigComponent } from './ShadingConfig';
import { AccessoriesMenu } from './AccessoriesMenu';
import { LengthInput } from './LengthInput';
import { DimensionEditor } from './DimensionEditor';
import { getMidpoint, getPolygonCentroid, formatMeasurement, formatArea, calculateRealDistance } from '@/utils/measurementUtils';
import { Lightbulb, Fan, Box, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { Generate3DButton } from './Generate3DButton';
import { Model3DViewer } from './Model3DViewer';
import { Button } from '@/components/ui/button';
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
  const [hoveredCorner, setHoveredCorner] = useState<{
    elementId: string;
    cornerIndex: number;
  } | null>(null);
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
  const {
    findAlignmentGuides,
    getSnapPoint
  } = useSmartAlignment();
  const {
    editState,
    findNearestCorner,
    startCornerEdit,
    updateCornerPosition: getUpdatedCornerPosition,
    stopCornerEdit
  } = useCornerEditing();
  const {
    accessories,
    accessoryConfig,
    dragState,
    hoveredAccessoryId,
    snapPoint: accessorySnapPoint,
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

  // Canvas zoom and pan functionality
  const canvasTransform = useCanvasZoom(canvasRef, 1, 0.1, 10);

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
      return;
    }
    const defaultPosition = getDefaultPosition(canvas.width, canvas.height);
    addAccessory(type, defaultPosition);
  }, [addAccessory, getDefaultPosition]);

  // Fixed coordinate transformation function
  const getCanvasPoint = useCallback((clientX: number, clientY: number): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return {
      x: 0,
      y: 0
    };
    const rect = canvas.getBoundingClientRect();

    // Calculate the proper scaling ratios to account for canvas scaling
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    // Get screen coordinates relative to canvas element
    const screenX = (clientX - rect.left) * scaleX;
    const screenY = (clientY - rect.top) * scaleY;

    // Transform screen coordinates to canvas coordinates accounting for zoom and pan
    return canvasTransform.inverseTransformPoint(screenX, screenY);
  }, [canvasTransform]);
  const calculateDistance = useCallback((point1: Point, point2: Point): number => {
    const dx = point1.x - point2.x;
    const dy = point1.y - point2.y;
    return Math.sqrt(dx * dx + dy * dy);
  }, []);
  const calculateAngle = useCallback((point1: Point, point2: Point): number => {
    const dx = point2.x - point1.x;
    const dy = point2.y - point1.y;
    const angleRad = Math.atan2(dy, dx);
    const angleDeg = angleRad * 180 / Math.PI;
    return angleDeg;
  }, []);
  const calculateSnappedAnglePoint = useCallback((startPoint: Point, endPoint: Point): {
    point: Point;
    snapped: boolean;
  } => {
    const distance = calculateDistance(startPoint, endPoint);
    const currentAngle = calculateAngle(startPoint, endPoint);
    const targetAngles = [0, 45, 90, 135, 180, -135, -90, -45];
    const tolerance = 5;
    for (const targetAngle of targetAngles) {
      const angleDiff = Math.abs(currentAngle - targetAngle);
      const angleDiff360 = Math.abs(currentAngle - targetAngle + 360);
      const angleDiffNeg360 = Math.abs(currentAngle - targetAngle - 360);
      if (angleDiff <= tolerance || angleDiff360 <= tolerance || angleDiffNeg360 <= tolerance) {
        const targetAngleRad = targetAngle * Math.PI / 180;
        const snappedPoint: Point = {
          x: startPoint.x + distance * Math.cos(targetAngleRad),
          y: startPoint.y + distance * Math.sin(targetAngleRad)
        };
        return {
          point: snappedPoint,
          snapped: true
        };
      }
    }
    return {
      point: endPoint,
      snapped: false
    };
  }, [calculateDistance, calculateAngle]);
  const findSnapPoint = useCallback((canvasPos: Point): Point | null => {
    if (drawingState.mode !== 'frame') return null;
    const SNAP_DISTANCE = 15 / canvasTransform.scale; // Adjust snap distance based on zoom

    if (drawingState.tempPoints.length >= 3) {
      const firstPoint = drawingState.tempPoints[0];
      const distance = calculateDistance(canvasPos, firstPoint);
      if (distance <= SNAP_DISTANCE) {
        return firstPoint;
      }
    }
    for (const element of elements) {
      if (element.type === 'frame') {
        const frameElement = element as FrameElement;
        for (const point of frameElement.points) {
          const distance = calculateDistance(canvasPos, point);
          if (distance <= SNAP_DISTANCE) {
            return point;
          }
        }
      }
    }
    return null;
  }, [drawingState.mode, drawingState.tempPoints, elements, calculateDistance, canvasTransform.scale]);
  const checkNearFirstPoint = useCallback((canvasPos: Point): boolean => {
    if (drawingState.mode !== 'frame' || drawingState.tempPoints.length < 3) {
      return false;
    }
    const firstPoint = drawingState.tempPoints[0];
    const distance = calculateDistance(canvasPos, firstPoint);
    return distance <= 15 / canvasTransform.scale;
  }, [drawingState.mode, drawingState.tempPoints, calculateDistance, canvasTransform.scale]);
  const checkDimensionClick = useCallback((canvasPos: Point): {
    elementId: string;
    segmentIndex: number;
    position: Point;
    length: number;
  } | null => {
    const CLICK_DISTANCE = 20 / canvasTransform.scale;
    for (const element of elements) {
      if (element.type === 'frame') {
        const frame = element as FrameElement;
        if (frame.measurements) {
          for (let i = 0; i < frame.measurements.segmentLengths.length; i++) {
            const point1 = frame.points[i];
            const point2 = frame.points[(i + 1) % frame.points.length];
            if (!frame.closed && i === frame.points.length - 1) continue;
            const midpoint = getMidpoint(point1, point2);
            const distance = Math.sqrt(Math.pow(canvasPos.x - midpoint.x, 2) + Math.pow(canvasPos.y - midpoint.y, 2));
            if (distance <= CLICK_DISTANCE) {
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
  }, [elements, canvasTransform.scale]);
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
    const scaledFontSize = fontSize / canvasTransform.scale;
    ctx.font = `${scaledFontSize}px Arial`;
    ctx.textAlign = align;
    ctx.textBaseline = 'middle';
    if (background) {
      const metrics = ctx.measureText(text);
      const padding = (clickable ? 6 : 4) / canvasTransform.scale;
      const bgWidth = metrics.width + padding * 2;
      const bgHeight = scaledFontSize + padding * 2;
      ctx.fillStyle = clickable ? 'rgba(59, 130, 246, 0.1)' : 'rgba(255, 255, 255, 0.9)';
      ctx.fillRect(x - bgWidth / 2, y - bgHeight / 2, bgWidth, bgHeight);
      ctx.strokeStyle = clickable ? '#3b82f6' : '#e5e7eb';
      ctx.lineWidth = 1 / canvasTransform.scale;
      ctx.strokeRect(x - bgWidth / 2, y - bgHeight / 2, bgWidth, bgHeight);
    }
    ctx.fillStyle = clickable ? '#3b82f6' : color;
    ctx.fillText(text, x, y);
  }, [canvasTransform.scale]);
  const drawAccessories = useCallback((ctx: CanvasRenderingContext2D) => {
    accessories.forEach(accessory => {
      const isHovered = hoveredAccessoryId === accessory.id;
      const isDragged = dragState.isDragging && dragState.draggedAccessoryId === accessory.id;
      if (isDragged) {
        ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        ctx.shadowBlur = 8 / canvasTransform.scale;
        ctx.shadowOffsetX = 2 / canvasTransform.scale;
        ctx.shadowOffsetY = 2 / canvasTransform.scale;
      }
      ctx.globalAlpha = isDragged ? 0.7 : 1;
      ctx.fillStyle = accessory.color || '#000000';
      ctx.strokeStyle = accessory.color || '#000000';
      const scaledSize = (accessory.size || 12) / canvasTransform.scale;
      switch (accessory.type) {
        case 'light':
          ctx.fillStyle = accessory.color || '#fbbf24';
          ctx.beginPath();
          ctx.arc(accessory.position.x, accessory.position.y, scaledSize / 2, 0, 2 * Math.PI);
          ctx.fill();
          ctx.strokeStyle = accessory.color || '#fbbf24';
          ctx.lineWidth = 2 / canvasTransform.scale;
          for (let i = 0; i < 8; i++) {
            const angle = i * Math.PI / 4;
            const startRadius = scaledSize / 2 + 2 / canvasTransform.scale;
            const endRadius = scaledSize / 2 + 6 / canvasTransform.scale;
            ctx.beginPath();
            ctx.moveTo(accessory.position.x + Math.cos(angle) * startRadius, accessory.position.y + Math.sin(angle) * startRadius);
            ctx.lineTo(accessory.position.x + Math.cos(angle) * endRadius, accessory.position.y + Math.sin(angle) * endRadius);
            ctx.stroke();
          }
          break;
        case 'fan':
          ctx.fillStyle = accessory.color || '#6b7280';
          ctx.beginPath();
          ctx.arc(accessory.position.x, accessory.position.y, 4 / canvasTransform.scale, 0, 2 * Math.PI);
          ctx.fill();
          ctx.strokeStyle = accessory.color || '#6b7280';
          ctx.lineWidth = 3 / canvasTransform.scale;
          for (let i = 0; i < 4; i++) {
            const angle = i * Math.PI / 2;
            const bladeLength = scaledSize / 2;
            ctx.beginPath();
            ctx.moveTo(accessory.position.x, accessory.position.y);
            ctx.lineTo(accessory.position.x + Math.cos(angle) * bladeLength, accessory.position.y + Math.sin(angle) * bladeLength);
            ctx.stroke();
          }
          break;
        case 'column':
          const columnSize = scaledSize;
          ctx.fillStyle = accessory.color || '#374151';
          ctx.fillRect(accessory.position.x - columnSize / 2, accessory.position.y - columnSize / 2, columnSize, columnSize);
          break;
        case 'wall':
          ctx.strokeStyle = accessory.color || '#111827';
          ctx.lineWidth = scaledSize;
          const wallLength = 60 / canvasTransform.scale;
          ctx.beginPath();
          ctx.moveTo(accessory.position.x - wallLength / 2, accessory.position.y);
          ctx.lineTo(accessory.position.x + wallLength / 2, accessory.position.y);
          ctx.stroke();
          ctx.strokeStyle = '#9ca3af';
          ctx.lineWidth = 1 / canvasTransform.scale;
          for (let i = -wallLength / 2; i < wallLength / 2; i += 10 / canvasTransform.scale) {
            ctx.beginPath();
            ctx.moveTo(accessory.position.x + i, accessory.position.y - 3 / canvasTransform.scale);
            ctx.lineTo(accessory.position.x + i, accessory.position.y + 3 / canvasTransform.scale);
            ctx.stroke();
          }
          break;
      }
      if (isHovered && !isDragged) {
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 2 / canvasTransform.scale;
        ctx.setLineDash([3 / canvasTransform.scale, 3 / canvasTransform.scale]);
        ctx.beginPath();
        let hoverRadius = 20 / canvasTransform.scale;
        switch (accessory.type) {
          case 'light':
            hoverRadius = scaledSize / 2 + 8 / canvasTransform.scale;
            break;
          case 'fan':
            hoverRadius = scaledSize / 2 + 8 / canvasTransform.scale;
            break;
          case 'column':
            hoverRadius = scaledSize / 2 + 8 / canvasTransform.scale;
            break;
          case 'wall':
            hoverRadius = 35 / canvasTransform.scale;
            break;
        }
        ctx.arc(accessory.position.x, accessory.position.y, hoverRadius, 0, 2 * Math.PI);
        ctx.stroke();
        ctx.setLineDash([]);
      }
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
      ctx.globalAlpha = 1;
    });
  }, [accessories, hoveredAccessoryId, dragState, canvasTransform.scale]);
  const drawElements = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Save the current context state
    ctx.save();

    // Apply zoom and pan transformations
    ctx.scale(canvasTransform.scale, canvasTransform.scale);
    ctx.translate(canvasTransform.offsetX / canvasTransform.scale, canvasTransform.offsetY / canvasTransform.scale);

    // Clear with transformed coordinates
    const inverseScale = 1 / canvasTransform.scale;
    ctx.clearRect(-canvasTransform.offsetX * inverseScale, -canvasTransform.offsetY * inverseScale, canvas.width * inverseScale, canvas.height * inverseScale);

    // Grid with zoom-adjusted spacing
    const gridSize = 20;
    const adjustedGridSize = gridSize / canvasTransform.scale;
    ctx.strokeStyle = '#f3f4f6';
    ctx.lineWidth = 1 / canvasTransform.scale;
    const startX = Math.floor(-canvasTransform.offsetX / canvasTransform.scale / adjustedGridSize) * adjustedGridSize;
    const endX = startX + canvas.width / canvasTransform.scale + adjustedGridSize;
    const startY = Math.floor(-canvasTransform.offsetY / canvasTransform.scale / adjustedGridSize) * adjustedGridSize;
    const endY = startY + canvas.height / canvasTransform.scale + adjustedGridSize;
    for (let i = startX; i <= endX; i += adjustedGridSize) {
      ctx.beginPath();
      ctx.moveTo(i, startY);
      ctx.lineTo(i, endY);
      ctx.stroke();
    }
    for (let i = startY; i <= endY; i += adjustedGridSize) {
      ctx.beginPath();
      ctx.moveTo(startX, i);
      ctx.lineTo(endX, i);
      ctx.stroke();
    }
    alignmentGuides.forEach(guide => {
      if (guide.lineType === 'extension') {
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 1 / canvasTransform.scale;
        ctx.setLineDash([3 / canvasTransform.scale, 3 / canvasTransform.scale]);
      } else {
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 1 / canvasTransform.scale;
        ctx.setLineDash([5 / canvasTransform.scale, 2 / canvasTransform.scale]);
      }
      ctx.beginPath();
      ctx.moveTo(guide.startPoint.x, guide.startPoint.y);
      ctx.lineTo(guide.endPoint.x, guide.endPoint.y);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = guide.lineType === 'extension' ? '#3b82f6' : '#10b981';
      ctx.beginPath();
      ctx.arc(guide.targetPoint.x, guide.targetPoint.y, 3 / canvasTransform.scale, 0, 2 * Math.PI);
      ctx.fill();
    });
    elements.forEach(element => {
      ctx.strokeStyle = element.type === 'frame' ? accessoryConfig.frameColor : element.color || '#000000';
      switch (element.type) {
        case 'frame':
          const frame = element as FrameElement;
          if (frame.points.length > 1) {
            ctx.lineWidth = 3 / canvasTransform.scale;
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
                const offset = 15 / canvasTransform.scale;
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
            ctx.fillStyle = isBeingEdited ? '#f59e0b' : isHovered ? '#10b981' : '#ef4444';
            ctx.beginPath();
            const pointRadius = (isHovered || isBeingEdited ? 6 : 4) / canvasTransform.scale;
            ctx.arc(point.x, point.y, pointRadius, 0, 2 * Math.PI);
            ctx.fill();
            if (isHovered || isBeingEdited) {
              ctx.strokeStyle = isBeingEdited ? '#d97706' : '#059669';
              ctx.lineWidth = 2 / canvasTransform.scale;
              ctx.stroke();
            }
          });
          break;
        case 'beam':
          const beam = element as BeamElement;
          ctx.lineWidth = beam.width / canvasTransform.scale;
          ctx.beginPath();
          ctx.moveTo(beam.start.x, beam.start.y);
          ctx.lineTo(beam.end.x, beam.end.y);
          ctx.stroke();
          break;
        case 'shading':
          const shading = element as ShadingElement;
          ctx.strokeStyle = shading.color || '#8b4513';
          ctx.lineWidth = (shading.width || 2) / canvasTransform.scale;
          ctx.setLineDash([]);
          ctx.beginPath();
          ctx.moveTo(shading.start.x, shading.start.y);
          ctx.lineTo(shading.end.x, shading.end.y);
          ctx.stroke();
          break;
        case 'division':
          const division = element as DivisionElement;
          ctx.strokeStyle = division.color || '#f97316';
          ctx.lineWidth = (division.width || 3) / canvasTransform.scale;
          ctx.setLineDash([]);
          ctx.beginPath();
          ctx.moveTo(division.start.x, division.start.y);
          ctx.lineTo(division.end.x, division.end.y);
          ctx.stroke();
          break;
        case 'column':
          const column = element as ColumnElement;
          ctx.fillStyle = element.color || '#374151';
          const columnSize = column.size / canvasTransform.scale;
          ctx.fillRect(column.position.x - columnSize / 2, column.position.y - columnSize / 2, columnSize, columnSize);
          break;
        case 'wall':
          const wall = element as WallElement;
          ctx.lineWidth = wall.height / canvasTransform.scale;
          ctx.beginPath();
          ctx.moveTo(wall.start.x, wall.start.y);
          ctx.lineTo(wall.end.x, wall.end.y);
          ctx.stroke();
          break;
      }
    });
    drawAccessories(ctx);
    if (accessorySnapPoint && dragState.isDragging) {
      ctx.strokeStyle = accessorySnapPoint.type === 'corner' ? '#10b981' : accessorySnapPoint.type === 'midpoint' ? '#3b82f6' : '#f59e0b';
      ctx.fillStyle = accessorySnapPoint.type === 'corner' ? 'rgba(16, 185, 129, 0.2)' : accessorySnapPoint.type === 'midpoint' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(245, 158, 11, 0.2)';
      ctx.lineWidth = 2 / canvasTransform.scale;
      ctx.beginPath();
      ctx.arc(accessorySnapPoint.position.x, accessorySnapPoint.position.y, 8 / canvasTransform.scale, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();
      ctx.setLineDash([3 / canvasTransform.scale, 3 / canvasTransform.scale]);
      ctx.lineWidth = 1 / canvasTransform.scale;
      ctx.beginPath();
      const crossSize = 15 / canvasTransform.scale;
      ctx.moveTo(accessorySnapPoint.position.x - crossSize, accessorySnapPoint.position.y);
      ctx.lineTo(accessorySnapPoint.position.x + crossSize, accessorySnapPoint.position.y);
      ctx.moveTo(accessorySnapPoint.position.x, accessorySnapPoint.position.y - crossSize);
      ctx.lineTo(accessorySnapPoint.position.x, accessorySnapPoint.position.y + crossSize);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = accessorySnapPoint.type === 'corner' ? '#10b981' : accessorySnapPoint.type === 'midpoint' ? '#3b82f6' : '#f59e0b';
      ctx.font = `${10 / canvasTransform.scale}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const snapText = accessorySnapPoint.type === 'corner' ? 'פינה' : accessorySnapPoint.type === 'midpoint' ? 'אמצע' : 'מרכז';
      ctx.fillText(snapText, accessorySnapPoint.position.x, accessorySnapPoint.position.y - 20 / canvasTransform.scale);
    }
    if (snapPoint && drawingState.mode === 'frame') {
      ctx.strokeStyle = '#22c55e';
      ctx.fillStyle = 'rgba(34, 197, 94, 0.2)';
      ctx.lineWidth = 2 / canvasTransform.scale;
      ctx.beginPath();
      ctx.arc(snapPoint.x, snapPoint.y, 8 / canvasTransform.scale, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 1 / canvasTransform.scale;
      ctx.setLineDash([3 / canvasTransform.scale, 3 / canvasTransform.scale]);
      ctx.beginPath();
      ctx.arc(snapPoint.x, snapPoint.y, 12 / canvasTransform.scale, 0, 2 * Math.PI);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    if (alignmentSnapPoint) {
      ctx.strokeStyle = '#3b82f6';
      ctx.fillStyle = 'rgba(59, 130, 246, 0.3)';
      ctx.lineWidth = 2 / canvasTransform.scale;
      ctx.beginPath();
      ctx.arc(alignmentSnapPoint.x, alignmentSnapPoint.y, 6 / canvasTransform.scale, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();
    }
    if (drawingState.mode === 'frame' && drawingState.tempPoints.length > 0) {
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 2 / canvasTransform.scale;
      ctx.setLineDash([5 / canvasTransform.scale, 5 / canvasTransform.scale]);
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
            ctx.lineWidth = 2 / canvasTransform.scale;
            ctx.beginPath();
            ctx.arc(point.x, point.y, 8 / canvasTransform.scale, 0, 2 * Math.PI);
            ctx.fill();
            ctx.stroke();
            ctx.strokeStyle = '#22c55e';
            ctx.lineWidth = 1 / canvasTransform.scale;
            ctx.setLineDash([3 / canvasTransform.scale, 3 / canvasTransform.scale]);
            ctx.beginPath();
            ctx.arc(point.x, point.y, 12 / canvasTransform.scale, 0, 2 * Math.PI);
            ctx.stroke();
            ctx.setLineDash([]);
          } else {
            ctx.fillStyle = '#10b981';
            ctx.beginPath();
            ctx.arc(point.x, point.y, 6 / canvasTransform.scale, 0, 2 * Math.PI);
            ctx.fill();
          }
        } else {
          ctx.fillStyle = '#10b981';
          ctx.beginPath();
          ctx.arc(point.x, point.y, 6 / canvasTransform.scale, 0, 2 * Math.PI);
          ctx.fill();
        }
      });
      if (mousePosition && drawingState.tempPoints.length > 0) {
        const lastPoint = drawingState.tempPoints[drawingState.tempPoints.length - 1];
        let targetPoint = alignmentSnapPoint || snapPoint || mousePosition;
        let lineColor = alignmentSnapPoint ? '#3b82f6' : snapPoint ? '#22c55e' : '#94a3b8';
        let lineWidth = alignmentSnapPoint || snapPoint ? 2 : 1;
        let lineDash: number[] = [3, 3];
        if (!snapPoint && !alignmentSnapPoint) {
          const {
            point: anglePoint,
            snapped
          } = calculateSnappedAnglePoint(lastPoint, mousePosition);
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
        ctx.lineWidth = lineWidth / canvasTransform.scale;
        ctx.setLineDash(lineDash.map(d => d / canvasTransform.scale));
        ctx.beginPath();
        ctx.moveTo(lastPoint.x, lastPoint.y);
        ctx.lineTo(targetPoint.x, targetPoint.y);
        ctx.stroke();
        ctx.setLineDash([]);
        if (targetPoint && measurementConfig.showLengths) {
          const currentLength = calculateRealDistance(lastPoint, targetPoint, measurementConfig.pixelsPerCm);
          const lengthText = formatMeasurement(currentLength, measurementConfig.unit);
          const midpoint = getMidpoint(lastPoint, targetPoint);
          drawMeasurementText(ctx, lengthText, midpoint.x, midpoint.y - 15 / canvasTransform.scale, {
            fontSize: 12,
            color: '#059669',
            background: true
          });
        }
        if (isAngleSnapped && angleSnapPoint) {
          ctx.fillStyle = '#f59e0b';
          ctx.strokeStyle = '#d97706';
          ctx.lineWidth = 1 / canvasTransform.scale;
          ctx.beginPath();
          ctx.arc(angleSnapPoint.x, angleSnapPoint.y, 4 / canvasTransform.scale, 0, 2 * Math.PI);
          ctx.fill();
          ctx.stroke();
        }
      }
    }

    // Restore the context state
    ctx.restore();
  }, [elements, drawingState, mousePosition, snapPoint, angleSnapPoint, isAngleSnapped, alignmentGuides, alignmentSnapPoint, hoveredCorner, editState, measurementConfig, accessoryConfig, drawMeasurementText, drawAccessories, accessorySnapPoint, dragState, canvasTransform]);
  useEffect(() => {
    drawElements();
  }, [drawElements]);
  const handleMouseMove = (e: React.MouseEvent) => {
    const canvasPoint = getCanvasPoint(e.clientX, e.clientY);
    setMousePosition(canvasPoint);
    if (dragState.isDragging) {
      updateDragPosition(canvasPoint, elements);
      return;
    }
    const accessoryAtPoint = findAccessoryAtPoint(canvasPoint);
    setHoveredAccessory(accessoryAtPoint?.id || null);
    if (!editState.isEditing && drawingState.mode === 'select') {
      const nearestCorner = findNearestCorner(canvasPoint, elements);
      setHoveredCorner(nearestCorner);
    }
    if (editState.isEditing) {
      const newPosition = getUpdatedCornerPosition(canvasPoint);
      if (newPosition && editState.elementId && editState.cornerIndex !== null) {
        updateCornerPosition(editState.elementId, editState.cornerIndex, newPosition);
      }
      return;
    }
    const nearFirst = checkNearFirstPoint(canvasPoint);
    setIsNearFirstPoint(nearFirst);
    const foundSnapPoint = findSnapPoint(canvasPoint);
    setSnapPoint(foundSnapPoint);
    if (drawingState.mode === 'frame' && drawingState.tempPoints.length > 0) {
      const lastPoint = drawingState.tempPoints[drawingState.tempPoints.length - 1];
      const guides = findAlignmentGuides(canvasPoint, lastPoint, elements, 15 / canvasTransform.scale);
      setAlignmentGuides(guides);
      const alignSnap = getSnapPoint(canvasPoint, guides);
      setAlignmentSnapPoint(alignSnap);
    } else {
      setAlignmentGuides([]);
      setAlignmentSnapPoint(null);
    }
  };
  const handleMouseDown = (e: React.MouseEvent) => {
    // Skip if this is a pan operation (middle mouse or ctrl+click)
    if (e.button === 1 || e.button === 0 && e.ctrlKey) {
      return;
    }
    const canvasPoint = getCanvasPoint(e.clientX, e.clientY);
    const accessoryAtPoint = findAccessoryAtPoint(canvasPoint);
    if (accessoryAtPoint) {
      startDragging(accessoryAtPoint.id, canvasPoint, accessoryAtPoint.position);
      return;
    }
    const dimensionClick = checkDimensionClick(canvasPoint);
    if (dimensionClick) {
      showDimensionEditor(dimensionClick.elementId, dimensionClick.segmentIndex, dimensionClick.position, dimensionClick.length);
      return;
    }
    if (drawingState.mode === 'select') {
      const nearestCorner = findNearestCorner(canvasPoint, elements);
      if (nearestCorner) {
        const element = elements.find(el => el.id === nearestCorner.elementId);
        if (element && element.type === 'frame') {
          const frame = element as FrameElement;
          const cornerPoint = frame.points[nearestCorner.cornerIndex];
          startCornerEdit(nearestCorner.elementId, nearestCorner.cornerIndex, canvasPoint, cornerPoint);
          return;
        }
      }
    }
    switch (drawingState.mode) {
      case 'frame':
        let pointToAdd = canvasPoint;
        if (alignmentSnapPoint) {
          pointToAdd = alignmentSnapPoint;
        } else if (snapPoint) {
          pointToAdd = snapPoint;
          if (drawingState.tempPoints.length >= 3 && snapPoint === drawingState.tempPoints[0]) {
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
        setDragStart(canvasPoint);
        break;
      case 'column':
        addColumn(canvasPoint);
        break;
    }
  };
  const handleMouseUp = (e: React.MouseEvent) => {
    if (dragState.isDragging) {
      stopDragging();
      return;
    }
    const canvasPoint = getCanvasPoint(e.clientX, e.clientY);
    switch (drawingState.mode) {
      case 'beam':
        if (dragStart) {
          addBeam(dragStart, canvasPoint);
        }
        break;
      case 'wall':
        if (dragStart) {
          addWall(dragStart, canvasPoint);
        }
        break;
    }
    setIsDragging(false);
    setDragStart(null);
  };
  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    const touch = e.touches[0];
    const canvasPoint = getCanvasPoint(touch.clientX, touch.clientY);
    const accessoryAtPoint = findAccessoryAtPoint(canvasPoint);
    if (accessoryAtPoint) {
      startDragging(accessoryAtPoint.id, canvasPoint, accessoryAtPoint.position);
    }
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    if (dragState.isDragging && e.touches.length === 1) {
      const touch = e.touches[0];
      const canvasPoint = getCanvasPoint(touch.clientX, touch.clientY);
      updateDragPosition(canvasPoint, elements);
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
  const getCursor = () => {
    if (dragState.isDragging) return 'grabbing';
    if (hoveredAccessoryId) return 'grab';
    if (hoveredCorner) return 'move';
    if (editState.isEditing) return 'grabbing';
    return 'crosshair';
  };
  return <div className="h-screen flex bg-gray-50" onKeyDown={handleKeyDown} tabIndex={0}>
      {/* Left panel - Tools and canvas */}
      <div className="flex-[2] flex flex-col gap-4 p-4">
        {/* Toolbar */}
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <DrawingToolbar mode={drawingState.mode} onModeChange={setMode} onClear={clearAll} isDrawing={drawingState.tempPoints.length >= 3} onFinishFrame={finishFrame} />
        </div>

        {/* Canvas area */}
        <div className="flex-1 bg-transparent rounded-lg shadow-sm border overflow-hidden">
          <div className="h-full flex flex-col">
            {/* Canvas header */}
            <div className="bg-gray-50 border-b p-3 flex items-center justify-between">
              <h3 className="text-lg font-semibold">שרטוט חופשי</h3>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={canvasTransform.zoomOut} title="הקטנה">
                  <ZoomOut className="w-4 h-4" />
                </Button>
                <span className="text-sm text-muted-foreground min-w-[50px] text-center">
                  {Math.round(canvasTransform.scale * 100)}%
                </span>
                <Button variant="outline" size="sm" onClick={canvasTransform.zoomIn} title="הגדלה">
                  <ZoomIn className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={canvasTransform.reset} title="איפוס תצוגה">
                  <RotateCcw className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            {/* Canvas */}
            <div className="flex-1 relative bg-transparent">
              <canvas ref={canvasRef} width={800} height={600} className="w-full h-full" onMouseDown={handleMouseDown} onMouseUp={handleMouseUp} onMouseMove={handleMouseMove} onDoubleClick={handleDoubleClick} onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd} style={{
              cursor: getCursor(),
              touchAction: 'none'
            }} />
              
              <LengthInput visible={lengthInputState.visible} position={lengthInputState.position} currentLength={lengthInputState.targetLength} unit={measurementConfig.unit} onSubmit={handleLengthSubmit} onCancel={hideLengthInput} />
              
              <DimensionEditor visible={dimensionEditState.visible} position={dimensionEditState.position} currentValue={dimensionEditState.currentLength} unit={measurementConfig.unit} onSubmit={handleDimensionEdit} onCancel={hideDimensionEditor} />
            </div>
            
            {/* Canvas footer */}
            <div className="bg-gray-50 border-t p-2 text-xs text-muted-foreground">
              <div className="grid grid-cols-3 gap-2">
                <span><strong>זום:</strong> גלגלת עכבר</span>
                <span><strong>תזוזה:</strong> Ctrl+גרירה</span>
                <span><strong>Tab:</strong> אורך מדויק</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel - 3D and settings */}
      <div className="w-96 flex flex-col gap-4 p-4">
        {/* 3D Visualization */}
        <div className="bg-white rounded-lg shadow-sm border p-4 flex-1">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Box className="w-5 h-5" />
            הדמיה תלת־ממדית
          </h3>
          
          <div className="mb-4">
            <Generate3DButton elements={elements} pixelsPerCm={measurementConfig.pixelsPerCm} frameColor={accessoryConfig.frameColor} shadingConfig={shadingConfig} disabled={elements.length === 0} />
          </div>
          
          

          {/* Statistics */}
          <div className="p-3 bg-gray-50 rounded-lg">
            <h4 className="font-semibold mb-2 text-sm">סטטיסטיקות</h4>
            <div className="text-xs space-y-1 grid grid-cols-2 gap-1">
              <span>מסגרות: {elements.filter(e => e.type === 'frame').length}</span>
              <span>קורות: {elements.filter(e => e.type === 'beam').length}</span>
              <span>עמודים: {elements.filter(e => e.type === 'column').length + (accessoryCount.column || 0)}</span>
              <span>תאורה: {accessoryCount.light || 0}</span>
            </div>
          </div>
        </div>

        {/* Settings panels - scrollable */}
        <div className="space-y-4 max-h-96 overflow-y-auto">
          <AccessoriesMenu onAddAccessory={handleAddAccessory} accessoryConfig={accessoryConfig} onConfigChange={updateAccessoryConfig} accessoryCount={accessoryCount} />
          
          <ShadingConfigComponent config={shadingConfig} onConfigChange={updateShadingConfig} />

          <div className="p-4 bg-white rounded-lg shadow-sm border">
            <h4 className="font-semibold mb-3 text-sm">הגדרות מדידה</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm">הצג אורכים</label>
                <input type="checkbox" checked={measurementConfig.showLengths} onChange={e => updateMeasurementConfig({
                showLengths: e.target.checked
              })} className="rounded" />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm">הצג שטח</label>
                <input type="checkbox" checked={measurementConfig.showArea} onChange={e => updateMeasurementConfig({
                showArea: e.target.checked
              })} className="rounded" />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm">הצג זוויות</label>
                <input type="checkbox" checked={measurementConfig.showAngles} onChange={e => updateMeasurementConfig({
                showAngles: e.target.checked
              })} className="rounded" />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm">יחידת מדידה</label>
                <select value={measurementConfig.unit} onChange={e => updateMeasurementConfig({
                unit: e.target.value as any
              })} className="text-sm border rounded px-2 py-1">
                  <option value="cm">ס״מ</option>
                  <option value="mm">מ״מ</option>
                  <option value="m">מטר</option>
                </select>
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm">סקלה (פיקסלים/ס״מ)</label>
                <input type="number" value={measurementConfig.pixelsPerCm} onChange={e => updateMeasurementConfig({
                pixelsPerCm: parseFloat(e.target.value) || 2
              })} className="text-sm border rounded px-2 py-1 w-16" min="0.1" step="0.1" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>;
};