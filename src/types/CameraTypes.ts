export type Point = {
  x: number;
  y: number;
};

export interface DetectedNumber {
  text: string;
  cornerPoints: Point[];
  teamInfo?: TeamInfo;
}

export interface TeamInfo {
  number: string;
  name: string;
  city?: string;
  state?: string;
  country?: string;
}

export interface CameraState {
  hasPermission: boolean;
  device: any;
  isActive: boolean;
}

export interface PhotoCaptureState {
  capturedPhotoUri: string | null;
  flashOpacity: number;
  toastOpacity: number;
}
