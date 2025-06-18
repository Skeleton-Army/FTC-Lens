import { scanOCR } from "@ismaelmoreiraa/vision-camera-ocr";
import { useEffect, useState } from "react";
import { runAsync } from "react-native-vision-camera";
import { Worklets } from "react-native-worklets-core";
import { DetectedNumber } from "../types/CameraTypes";

export const useOCRDetection = () => {
  const [detectedNumbers, setDetectedNumbers] = useState<DetectedNumber[]>([]);

  useEffect(() => {
    if (detectedNumbers.length === 0) return;
    console.log("Current detected numbers list:", detectedNumbers);
  }, [detectedNumbers]);

  const updateDetectedNumbers = (detectedNumbers: DetectedNumber[]) => {
    setDetectedNumbers(detectedNumbers);
  };

  const createNumberDetectionWorklet = () => {
    return Worklets.createRunOnJS(updateDetectedNumbers);
  };

  return {
    detectedNumbers,
    updateDetectedNumbers,
    createNumberDetectionWorklet,
  };
};

export const processOCRFrame = (
  frame: any,
  onNumberDetected: (numbers: DetectedNumber[]) => void
) => {
  "worklet";

  runAsync(frame, () => {
    "worklet";
    const scannedOcr = scanOCR(frame);
    const detectedNumbers: DetectedNumber[] = [];

    scannedOcr.result.blocks.forEach((block) => {
      block.lines.forEach((line) => {
        line.elements.forEach((word) => {
          // Check if text is a 4-5 digit number
          if (/\b\d{4,5}\b/g.test(word.text)) {
            console.log(word.text);

            if (word.boundingBox) {
              detectedNumbers.push({
                text: word.text,
                boundingBox: word.boundingBox,
              });
            }
          }
        });
      });
    });

    onNumberDetected(detectedNumbers);
  });
};
