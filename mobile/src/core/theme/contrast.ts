/**
 * WCAG 2.x contrast helpers. Used to verify the theme meets the 4.5:1
 * requirement for normal text (RNF usabilidad).
 */
const HEX_PATTERN = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

function parseHex(hex: string): [number, number, number] {
  if (!HEX_PATTERN.test(hex)) {
    throw new Error(`Invalid hex color: ${hex}`);
  }
  let value = hex.slice(1);
  if (value.length === 3) {
    value = value
      .split('')
      .map((c) => c + c)
      .join('');
  }
  return [0, 2, 4].map((i) => parseInt(value.slice(i, i + 2), 16)) as [number, number, number];
}

function channelToLinear(channel: number): number {
  const c = channel / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

export function relativeLuminance(hex: string): number {
  const [r, g, b] = parseHex(hex).map(channelToLinear);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Contrast ratio between two colors, from 1 (none) to 21 (black on white). */
export function contrastRatio(foreground: string, background: string): number {
  const a = relativeLuminance(foreground);
  const b = relativeLuminance(background);
  const [lighter, darker] = a > b ? [a, b] : [b, a];
  return (lighter + 0.05) / (darker + 0.05);
}
