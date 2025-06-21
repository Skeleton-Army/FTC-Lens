import { scanOCR } from "@ismaelmoreiraa/vision-camera-ocr";
import { useState } from "react";
import { runAsync } from "react-native-vision-camera";
import { Worklets } from "react-native-worklets-core";
import { DetectedNumber } from "../types/CameraTypes";

export const useOCRDetection = () => {
  const [detectedNumbers, setDetectedNumbers] = useState<DetectedNumber[]>([]);
  const [frameSize, setFrameSize] = useState<{ width: number; height: number }>(
    { width: 0, height: 0 }
  );

  const updateDetectedNumbers = (
    detectedNumbers: DetectedNumber[],
    frameSize: { width: number; height: number }
  ) => {
    setDetectedNumbers(detectedNumbers);
    setFrameSize(frameSize);
  };

  const createNumberDetectionWorklet = () => {
    return Worklets.createRunOnJS(updateDetectedNumbers);
  };

  return {
    detectedNumbers,
    frameSize,
    updateDetectedNumbers,
    createNumberDetectionWorklet,
  };
};

export const processOCRFrame = (
  frame: any,
  onNumberDetected: (
    numbers: DetectedNumber[],
    frameSize: { width: number; height: number }
  ) => void
) => {
  "worklet";

  runAsync(frame, () => {
    "worklet";
    const scannedOcr = scanOCR(frame);
    const detectedNumbers: DetectedNumber[] = [];

    // Extract frame dimensions
    const frameSize = {
      width: frame.width,
      height: frame.height,
    };

    scannedOcr.result.blocks.forEach((block) => {
      block.lines.forEach((line) => {
        line.elements.forEach((word) => {
          // Check if text is a 4-5 digit number
          if (/\b\d{4,5}\b/g.test(word.text)) {
            console.log(word.text);
            console.log(word.cornerPoints);

            if (word.cornerPoints) {
              detectedNumbers.push({
                text: word.text,
                cornerPoints: word.cornerPoints,
              });
            }
          }
        });
      });
    });

    onNumberDetected(detectedNumbers, frameSize);
  });
};
