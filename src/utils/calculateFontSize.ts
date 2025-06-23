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
