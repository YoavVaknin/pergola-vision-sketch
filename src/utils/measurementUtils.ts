
import { Point } from '@/types/pergola';

// Convert pixels to real-world measurements
export const pixelsToCm = (pixels: number, pixelsPerCm: number = 2): number => {
  return pixels / pixelsPerCm;
};

// Calculate distance between two points in pixels
export const calculatePixelDistance = (point1: Point, point2: Point): number => {
  const dx = point1.x - point2.x;
  const dy = point1.y - point2.y;
  return Math.sqrt(dx * dx + dy * dy);
};

// Calculate distance between two points in cm
export const calculateRealDistance = (point1: Point, point2: Point, pixelsPerCm: number = 2): number => {
  const pixelDistance = calculatePixelDistance(point1, point2);
  return pixelsToCm(pixelDistance, pixelsPerCm);
};

// Calculate area of a polygon using Shoelace formula
export const calculatePolygonArea = (points: Point[], pixelsPerCm: number = 2): number => {
  if (points.length < 3) return 0;
  
  let area = 0;
  const n = points.length;
  
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += points[i].x * points[j].y;
    area -= points[j].x * points[i].y;
  }
  
  const pixelArea = Math.abs(area) / 2;
  const cmArea = pixelArea / (pixelsPerCm * pixelsPerCm);
  const meterArea = cmArea / 10000; // Convert cm² to m²
  
  return meterArea;
};

// Calculate angle between three points (in degrees)
export const calculateAngle = (point1: Point, vertex: Point, point3: Point): number => {
  const vector1 = { x: point1.x - vertex.x, y: point1.y - vertex.y };
  const vector2 = { x: point3.x - vertex.x, y: point3.y - vertex.y };
  
  const dot = vector1.x * vector2.x + vector1.y * vector2.y;
  const mag1 = Math.sqrt(vector1.x * vector1.x + vector1.y * vector1.y);
  const mag2 = Math.sqrt(vector2.x * vector2.x + vector2.y * vector2.y);
  
  if (mag1 === 0 || mag2 === 0) return 0;
  
  const cosAngle = dot / (mag1 * mag2);
  const angleRad = Math.acos(Math.max(-1, Math.min(1, cosAngle)));
  const angleDeg = (angleRad * 180) / Math.PI;
  
  return angleDeg;
};

// Calculate all angles in a polygon
export const calculatePolygonAngles = (points: Point[]): number[] => {
  if (points.length < 3) return [];
  
  const angles: number[] = [];
  const n = points.length;
  
  for (let i = 0; i < n; i++) {
    const prevPoint = points[(i - 1 + n) % n];
    const currentPoint = points[i];
    const nextPoint = points[(i + 1) % n];
    
    const angle = calculateAngle(prevPoint, currentPoint, nextPoint);
    angles.push(angle);
  }
  
  return angles;
};

// Format measurement value based on unit
export const formatMeasurement = (value: number, unit: 'cm' | 'mm' | 'm', decimals: number = 1): string => {
  switch (unit) {
    case 'mm':
      return `${(value * 10).toFixed(decimals)} מ״מ`;
    case 'm':
      return `${(value / 100).toFixed(decimals === 1 ? 2 : decimals)} מ׳`;
    case 'cm':
    default:
      return `${value.toFixed(decimals)} ס״מ`;
  }
};

// Format area measurement
export const formatArea = (areaInM2: number): string => {
  return `${areaInM2.toFixed(2)} מ״ר`;
};

// Get midpoint between two points
export const getMidpoint = (point1: Point, point2: Point): Point => {
  return {
    x: (point1.x + point2.x) / 2,
    y: (point1.y + point2.y) / 2
  };
};

// Get polygon centroid
export const getPolygonCentroid = (points: Point[]): Point => {
  if (points.length === 0) return { x: 0, y: 0 };
  
  let centerX = 0;
  let centerY = 0;
  
  for (const point of points) {
    centerX += point.x;
    centerY += point.y;
  }
  
  return {
    x: centerX / points.length,
    y: centerY / points.length
  };
};
