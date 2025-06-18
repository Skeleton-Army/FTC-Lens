export interface DetectedNumber {
  text: string;
  boundingBox: {
    top: number;
    left: number;
    right: number;
    bottom: number;
  };
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
