/**
 * Calculates the optimal font size for text to fit within a given width and height.
 * The function considers the longest line of the text, the available width and height,
 * and clamps the result between minFontSize and maxFontSize.
 *
 * @param displayText - The text to be displayed
 * @param width - The available width for the text
 * @param height - The available height for the text
 * @param maxFontSize - The maximum allowed font size
 * @param minFontSize - The minimum allowed font size
 * @returns The calculated font size that fits the constraints
 */
export function calculateFontSize(
  displayText: string,
  width: number,
  height: number,
  maxFontSize: number,
  minFontSize: number
) {
  const lines = displayText.split("\n");
  const longestLineLength = Math.max(...lines.map((l) => l.length));
  const fontSizeByWidth = width / (longestLineLength * 0.7);
  const fontSizeByHeight = height / 2.2;
  const fontSize = Math.max(
    minFontSize,
    Math.min(
      maxFontSize,
      Math.floor(Math.min(fontSizeByWidth, fontSizeByHeight))
    )
  );
  return fontSize;
}
