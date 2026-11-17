/// <reference types="node" />
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const theme = (file: string) => readFileSync(join(process.cwd(), 'src/theme', file), 'utf8');

/** `$name: #hex;` lines of the raw palette. */
function readPalette(): Record<string, string> {
  return Object.fromEntries(
    [...theme('_palette.scss').matchAll(/^\$(\w+):\s*(#[0-9a-f]{6});/gim)].map(([, name, hex]) => [
      name,
      hex,
    ]),
  );
}

/** Resolves the `--rc-*` colors declared inside `@mixin <name> { ... }` to hex values. */
function readColors(mixin: 'light-colors' | 'dark-colors'): Record<string, string> {
  const palette = readPalette();
  const block =
    new RegExp(`@mixin ${mixin} \\{([\\s\\S]*?)\\r?\\n\\}`).exec(theme('_tokens.scss'))?.[1] ?? '';
  return Object.fromEntries(
    [...block.matchAll(/--rc-([\w-]+):\s*#\{p\.\$(\w+)\};/g)].map(([, token, name]) => [
      token,
      palette[name],
    ]),
  );
}

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [lighter, darker] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (lighter + 0.05) / (darker + 0.05);
}

describe.each(['light-colors', 'dark-colors'] as const)('design tokens (%s)', (mixin) => {
  const colors = readColors(mixin);

  it('reads every color token', () => {
    expect(Object.values(colors).every((hex) => /^#[0-9a-f]{6}$/i.test(hex))).toBe(true);
    expect(colors['control-border']).toBeDefined();
  });

  it('keeps text at 4.5:1 or more on the page and on the surfaces', () => {
    for (const surface of ['background', 'surface', 'surface-elevated']) {
      expect(contrast(colors['text'], colors[surface])).toBeGreaterThanOrEqual(4.5);
      expect(contrast(colors['text-muted'], colors[surface])).toBeGreaterThanOrEqual(4.5);
      expect(contrast(colors['primary-text'], colors[surface])).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('keeps input borders and switch tracks at 3:1 or more against the page and the surfaces', () => {
    for (const surface of ['background', 'surface', 'surface-elevated']) {
      expect(contrast(colors['control-border'], colors[surface])).toBeGreaterThanOrEqual(3);
    }
  });

  it('keeps the primary color usable as the fill of a control (3:1 against the page)', () => {
    expect(contrast(colors['primary'], colors['background'])).toBeGreaterThanOrEqual(3);
  });

  it('keeps white text readable on the primary fill', () => {
    expect(contrast(colors['on-primary'], colors['primary'])).toBeGreaterThanOrEqual(4.5);
  });

  it('keeps the icon on every accent legible (3:1) and every accent visible on the cards (3:1)', () => {
    for (const accent of ['blue', 'orange', 'teal', 'ink']) {
      expect(colors[`accent-${accent}`]).toBeDefined();
      expect(contrast(colors['on-accent'], colors[`accent-${accent}`])).toBeGreaterThanOrEqual(3);
      expect(contrast(colors[`accent-${accent}`], colors['surface-elevated'])).toBeGreaterThanOrEqual(3);
    }
  });

  it('keeps the progress fill visible (3:1) on the raised surface', () => {
    expect(contrast(colors['progress'], colors['surface-elevated'])).toBeGreaterThanOrEqual(3);
  });

  it('keeps the text of the sidebar at 4.5:1 or more on it', () => {
    expect(contrast(colors['on-sidebar'], colors['sidebar'])).toBeGreaterThanOrEqual(4.5);
    expect(contrast(colors['on-sidebar-muted'], colors['sidebar'])).toBeGreaterThanOrEqual(4.5);
  });

  it('keeps the state colors readable as text (4.5:1) on the page and the surfaces', () => {
    for (const surface of ['background', 'surface', 'surface-elevated']) {
      for (const state of ['success', 'warning', 'danger']) {
        expect(contrast(colors[state], colors[surface])).toBeGreaterThanOrEqual(4.5);
      }
    }
  });

  it('gives the page, the surface and the raised surface different colors', () => {
    expect(
      new Set([colors['background'], colors['surface'], colors['surface-elevated']]).size,
    ).toBeGreaterThan(1);
    expect(colors['border']).not.toBe(colors['surface-elevated']);
  });
});

describe('light theme', () => {
  const light = readColors('light-colors');

  it('has a pure white page, with no tinted surface', () => {
    expect(light['background']).toBe('#ffffff');
    for (const surface of ['surface', 'surface-elevated', 'border']) {
      const [r, g, b] = [1, 3, 5].map((i) => parseInt(light[surface].slice(i, i + 2), 16));
      expect(Math.max(r, g, b) - Math.min(r, g, b)).toBeLessThan(16);
    }
  });

  it('keeps the danger color a red, apart from the fuchsia of the brand', () => {
    expect(light['danger']).not.toBe(light['primary-text']);
  });
});

describe('dark theme layers', () => {
  const dark = readColors('dark-colors');

  it('steps up from the page to the surface to the raised surface', () => {
    expect(luminance(dark['surface'])).toBeGreaterThan(luminance(dark['background']));
    expect(luminance(dark['surface-elevated'])).toBeGreaterThan(luminance(dark['surface']));
  });

  it('draws separators lighter than the raised surface so they can be seen', () => {
    expect(luminance(dark['border'])).toBeGreaterThan(luminance(dark['surface-elevated']));
  });
});
