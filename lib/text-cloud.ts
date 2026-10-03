export type TextCloud = { positions: Float32Array; colors: Uint8Array };

// Range rectangles preserve the browser's actual wrapping, including Chinese
// headings. Sampling ignores opacity because HTML text may be a particle mask.
export function captureTextCloud(element: HTMLElement): TextCloud {
  const bounds = element.getBoundingClientRect();
  const left = Math.max(0, Math.floor(bounds.left - 4));
  const top = Math.max(0, Math.floor(bounds.top - 4));
  const width = Math.ceil(Math.min(window.innerWidth, bounds.right + 4) - left);
  const height = Math.ceil(
    Math.min(window.innerHeight, bounds.bottom + 4) - top,
  );
  if (width <= 0 || height <= 0)
    throw new Error("Heading is outside the viewport");
  const raster = document.createElement("canvas");
  raster.width = width;
  raster.height = height;
  const context = raster.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("Text sampling is unavailable");
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
  const range = document.createRange();
  let node = walker.nextNode();
  while (node) {
    const parent = node.parentElement;
    if (!parent) {
      node = walker.nextNode();
      continue;
    }
    const style = getComputedStyle(parent);
    context.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
    context.fillStyle = style.color;
    context.textBaseline = "alphabetic";
    let offset = 0;
    for (const glyph of Array.from(node.textContent || "")) {
      range.setStart(node, offset);
      offset += glyph.length;
      range.setEnd(node, offset);
      if (!glyph.trim()) continue;
      const rect = range.getBoundingClientRect();
      const metrics = context.measureText(glyph);
      const ascent =
        metrics.fontBoundingBoxAscent || metrics.actualBoundingBoxAscent;
      const descent =
        metrics.fontBoundingBoxDescent || metrics.actualBoundingBoxDescent;
      const baseline = (rect.height - ascent - descent) / 2 + ascent;
      context.fillText(glyph, rect.left - left, rect.top - top + baseline);
    }
    node = walker.nextNode();
  }
  const pixels = context.getImageData(0, 0, width, height).data;
  const points: number[] = [];
  const colors: number[] = [];
  const step = window.matchMedia("(pointer: coarse)").matches ? 2.8 : 2.4;
  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      const pixel = (Math.floor(y) * width + Math.floor(x)) * 4;
      if (pixels[pixel + 3] < 140) continue;
      points.push(left + x, top + y);
      colors.push(pixels[pixel], pixels[pixel + 1], pixels[pixel + 2]);
    }
  }
  if (!points.length) throw new Error("Heading has no text particles");
  return {
    positions: new Float32Array(points),
    colors: new Uint8Array(colors),
  };
}
