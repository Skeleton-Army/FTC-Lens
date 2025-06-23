/**
 * Transforms coordinates from camera frame space to preview display space.
 *
 * This function handles the coordinate mapping when the camera frame and preview
 * have different aspect ratios, applying center-crop scaling to maintain the
 * correct visual alignment of detected number overlays.
 *
 * @param x - X coordinate in frame space
 * @param y - Y coordinate in frame space
 * @param frameSize - Dimensions of the camera frame
 * @param previewSize - Dimensions of the preview display
 * @returns Transformed coordinates in preview space
 */
export function transformCoordinates(
  x: number,
  y: number,
  frameSize: { width: number; height: number },
  previewSize: { width: number; height: number }
): { x: number; y: number } {
  const frameAspect = frameSize.width / frameSize.height;
  const previewAspect = previewSize.width / previewSize.height;

  let scale = 1;
  let offsetX = 0;
  let offsetY = 0;

  if (previewAspect > frameAspect) {
    // Center crop cuts off top/bottom
    scale = previewSize.width / frameSize.width;
    const scaledHeight = frameSize.height * scale;
    offsetY = (scaledHeight - previewSize.height) / 2;
  } else {
    // Center crop cuts off left/right
    scale = previewSize.height / frameSize.height;
    const scaledWidth = frameSize.width * scale;
    offsetX = (scaledWidth - previewSize.width) / 2;
  }

  return {
    x: x * scale - offsetX,
    y: y * scale - offsetY,
  };
}
