
export interface Point {
  x: number;
  y: number;
}

export interface PergolaElement {
  id: string;
  type: 'frame' | 'beam' | 'column' | 'wall' | 'shading';
  color?: string;
  profile?: string;
}

export interface FrameElement extends PergolaElement {
  type: 'frame';
  points: Point[];
  closed: boolean;
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
  spacing: number;
  direction: number;
}

export type PergolaElementType = FrameElement | BeamElement | ColumnElement | WallElement | ShadingElement;

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
}
