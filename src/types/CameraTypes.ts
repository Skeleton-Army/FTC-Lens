type Point = {
  x: number;
  y: number;
};

export interface DetectedNumber {
  text: string;
  cornerPoints: Point[];
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
