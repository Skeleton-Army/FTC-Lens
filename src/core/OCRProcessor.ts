import { scanOCR } from "@ismaelmoreiraa/vision-camera-ocr";
import { useCallback, useState } from "react";
import { runAsync } from "react-native-vision-camera";
import { Worklets } from "react-native-worklets-core";
import { useTeamInfo } from "../hooks/useTeamInfo";
import { DetectedNumber } from "../types/CameraTypes";

export const useOCRDetection = () => {
  const [detectedNumbers, setDetectedNumbers] = useState<DetectedNumber[]>([]);
  const [frameSize, setFrameSize] = useState<{ width: number; height: number }>(
    { width: 0, height: 0 }
  );
  const { enrichDetectedNumbers } = useTeamInfo();

  const updateDetectedNumbers = useCallback(
    async (
      detectedNumbers: DetectedNumber[],
      frameSize: { width: number; height: number }
    ) => {
      setFrameSize(frameSize);

      // Enrich detected numbers with team information and filter out invalid teams
      const enrichedNumbers = await enrichDetectedNumbers(detectedNumbers);

      // Only keep numbers that have valid team information
      const validTeams = enrichedNumbers.filter(
        (number) => number.teamInfo !== undefined
      );

      setDetectedNumbers(validTeams);
    },
    [enrichDetectedNumbers]
  );

  const createNumberDetectionWorklet = () => {
    return Worklets.createRunOnJS(updateDetectedNumbers);
  };

  const onNumberDetected = createNumberDetectionWorklet();

  return {
    detectedNumbers,
    frameSize,
    onNumberDetected,
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
          // Remove all special characters from the text
          const cleanedText = word.text.replace(/[^\d]/g, "");

          // Check if it is a 3-5 digit number
          if (/^\d{3,5}$/.test(cleanedText)) {
            console.log("DETECTED: " + cleanedText);

            if (word.cornerPoints) {
              detectedNumbers.push({
                text: cleanedText,
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
