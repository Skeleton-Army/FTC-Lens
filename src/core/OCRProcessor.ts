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

/**
 * Extracts all 3-5 digit number substrings from the given text.
 *
 * @param text - The string to search for digit substrings.
 * @returns An array of objects, each containing the matched number text and its start/end indices in the string.
 */
const extractNumbers = (text: string) => {
  "worklet";
  const matches: { text: string; start: number; end: number }[] = [];
  const regex = /\d{3,5}/g;

  let match;
  while ((match = regex.exec(text)) !== null) {
    matches.push({
      text: match[0],
      start: match.index,
      end: match.index + match[0].length,
    });
  }

  return matches;
};

/**
 * Constructs a bounding box for a detected number substring using the corner points
 * of the first and last symbols that make up the substring.
 *
 * @param numberSymbols - An array of symbol objects representing the sequence of symbols for the detected number substring.
 * @returns An array of 4 points (top-left, top-right, bottom-right, bottom-left).
 */
const getBoundingBox = (numberSymbols: any[]): Point[] => {
  "worklet";
  if (!numberSymbols.length) return [];

  const firstSymbol = numberSymbols[0];
  const lastSymbol = numberSymbols[numberSymbols.length - 1];

  if (
    firstSymbol.cornerPoints &&
    lastSymbol.cornerPoints &&
    firstSymbol.cornerPoints.length === 4 &&
    lastSymbol.cornerPoints.length === 4
  ) {
    // Order: top-left, top-right, bottom-right, bottom-left
    return [
      firstSymbol.cornerPoints[0], // top-left
      lastSymbol.cornerPoints[1], // top-right
      lastSymbol.cornerPoints[2], // bottom-right
      firstSymbol.cornerPoints[3], // bottom-left
    ];
  }

  return [];
};

/**
 * Processes a word element for all number substrings inside it and adds them to the detectedNumbers array.
 *
 * @param word - The word element from the text recognition to process
 * @param detectedNumbers - The array to which valid numbers will be added.
 */
const detectNumbersInWord = (word: any, detectedNumbers: DetectedNumber[]) => {
  "worklet";
  const matches = extractNumbers(word.text);

  if (
    matches.length > 0 &&
    Array.isArray(word.symbols) &&
    word.symbols?.every((s: any) => s && Array.isArray(s.cornerPoints))
  ) {
    matches.forEach((m) => {
      // Get the sequence of symbols corresponding to this detected number substring
      const numberSymbols = word.symbols
        ? word.symbols.slice(m.start, m.end)
        : [];
      const cornerPoints = getBoundingBox(numberSymbols);

      if (cornerPoints.length === 4) {
        detectedNumbers.push({
          text: m.text,
          cornerPoints,
        });
        console.log("DETECTED: " + m.text);
      }
    });
  }
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
          detectNumbersInWord(word, detectedNumbers);
        });
      });
    });

    onNumberDetected(detectedNumbers, frameSize);
  });
};
