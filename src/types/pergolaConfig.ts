
export interface PergolaConfig {
  width: number;
  height: number;
  depth: number;
  beamDirection: 'width' | 'depth';
  beamSpacing: number;
  wallLeft: boolean;
  wallRight: boolean;
  wallFront: boolean;
  wallBack: boolean;
  profileFrame: string;
  profileShading: string;
  profileDivision: string;
}

export interface PergolaFormProps {
  config: PergolaConfig;
  onConfigChange: (config: PergolaConfig) => void;
}
