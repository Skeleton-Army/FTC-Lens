/**
 * Rotates coordinates from landscape camera frame to portrait display orientation.
 *
 * The camera captures frames in landscape orientation where:
 * - X increases from top to bottom
 * - Y increases from right to left
 *
 * This function rotates the coordinates 90° clockwise to match the portrait
 * display orientation where:
 * - X increases from left to right
 * - Y increases from top to bottom
 *
 * @param pt - Point coordinates in landscape frame space
 * @param frameSize - Dimensions of the landscape frame
 * @returns Rotated coordinates in portrait display space
 */
export function rotateToPortrait(
  pt: { x: number; y: number },
  frameSize: { width: number; height: number } // LANDSCAPE
): { x: number; y: number } {
  return {
    x: frameSize.height - pt.y, // ← flip using the height (original vertical axis)
    y: pt.x, // ← original x becomes y
  };
}
