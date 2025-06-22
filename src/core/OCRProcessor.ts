import { scanOCR } from "@ismaelmoreiraa/vision-camera-ocr";
import { useCallback, useState } from "react";
import { runAsync } from "react-native-vision-camera";
import { Worklets } from "react-native-worklets-core";
import { useTeamInfo } from "../hooks/useTeamInfo";
import { DetectedNumber, Point } from "../types/CameraTypes";

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
          // Find all 3-5 digit numbers in the word text
          const matches = [];
          const regex = /\d{3,5}/g;
          let match;
          while ((match = regex.exec(word.text)) !== null) {
            matches.push({
              text: match[0],
              start: match.index,
              end: match.index + match[0].length,
            });
          }

          if (
            matches.length > 0 &&
            Array.isArray(word.symbols) &&
            word.symbols?.every((s) => s && Array.isArray(s.cornerPoints))
          ) {
            matches.forEach((m) => {
              // Find the symbols that correspond to this match
              const symbolSlice = word.symbols
                ? word.symbols.slice(m.start, m.end)
                : [];

              // Collect all corner points from the symbols
              let cornerPoints: Point[] = [];
              if (symbolSlice.length > 0) {
                const firstSymbol = symbolSlice[0];
                const lastSymbol = symbolSlice[symbolSlice.length - 1];
                if (
                  firstSymbol.cornerPoints &&
                  lastSymbol.cornerPoints &&
                  firstSymbol.cornerPoints.length === 4 &&
                  lastSymbol.cornerPoints.length === 4
                ) {
                  // Order: top-left, top-right, bottom-right, bottom-left
                  cornerPoints = [
                    firstSymbol.cornerPoints[0], // top-left
                    lastSymbol.cornerPoints[1], // top-right
                    lastSymbol.cornerPoints[2], // bottom-right
                    firstSymbol.cornerPoints[3], // bottom-left
                  ];
                }
              }

              if (cornerPoints.length === 4) {
                detectedNumbers.push({
                  text: m.text,
                  cornerPoints,
                });
                console.log("DETECTED: " + m.text);
              }
            });
          }
        });
      });
    });

    onNumberDetected(detectedNumbers, frameSize);
  });
};
