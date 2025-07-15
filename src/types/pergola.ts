export interface Point {
  x: number;
  y: number;
}

export interface PergolaElement {
  id: string;
  type: 'frame' | 'beam' | 'column' | 'wall' | 'shading' | 'division';
  color?: string;
  profile?: string;
}

export interface FrameElement extends PergolaElement {
  type: 'frame';
  points: Point[];
  closed: boolean;
  measurements?: {
    segmentLengths: number[]; // Length of each segment in cm
    area?: number; // Area in square meters (if closed)
    angles?: number[]; // Angles between adjacent segments in degrees
  };
}

export interface BeamElement extends PergolaElement {
  type: 'beam';
  start: Point;
  end: Point;
  width: number;
}

export interface ColumnElement extends PergolaElement {
  type: 'column';
  position: Point;
  size: number;
}

export interface WallElement extends PergolaElement {
  type: 'wall';
  start: Point;
  end: Point;
  height: number;
}

export interface ShadingElement extends PergolaElement {
  type: 'shading';
  start: Point;
  end: Point;
  width: number;
  spacing: number;
  direction: number;
}

export interface DivisionElement extends PergolaElement {
  type: 'division';
  start: Point;
  end: Point;
  width: number;
  spacing: number;
  direction: number;
}

export type PergolaElementType = FrameElement | BeamElement | ColumnElement | WallElement | ShadingElement | DivisionElement;

export interface DrawingState {
  mode: 'frame' | 'beam' | 'column' | 'wall' | 'select';
  activeElement: string | null;
  isDrawing: boolean;
  tempPoints: Point[];
}

export interface ShadingConfig {
  spacing: number;
  direction: number; // 0 = אנכי, 90 = אופקי
  color: string;
  enabled: boolean;
  divisionSpacing: number; // מרחק בין קורות החלוקה
  divisionColor: string;
  divisionEnabled: boolean;
  // New properties for pergola models
  pergolaModel: 'bottom_shading' | 'top_shading' | 't_model';
  pergolaHeight: number; // גובה הפרגולה מעל הרצפה (cm)
  frameProfile: {
    width: number; // cm
    height: number; // cm
  };
  divisionProfile: {
    width: number; // cm
    height: number; // cm
  };
  shadingProfile: {
    width: number; // cm
    height: number; // cm
  };
  divisionDirection: 'width' | 'length' | 'both'; // כיוון קורות החלוקה
  shadingDirection: 'width' | 'length'; // כיוון קורות הצללה
}

export interface MeasurementConfig {
  pixelsPerCm: number; // Scale factor for converting pixels to cm
  showLengths: boolean;
  showArea: boolean;
  showAngles: boolean;
  unit: 'cm' | 'mm' | 'm';
}
