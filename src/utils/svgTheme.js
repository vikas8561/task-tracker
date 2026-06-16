const PLOT_BG = '#1e2126';
const LABEL_BG = '#2d3239';
const LIGHT_TEXT = '#e8eaed';
const GRID_STROKE = 'rgba(255, 255, 255, 0.14)';
const AXIS_STROKE = 'rgba(255, 255, 255, 0.38)';

const PURE_WHITE = /^(white|#fff(?:fff)?)$/i;
const CREAM_FILL = /^#f[0-9a-f]{5}$/i;
const DARK_TEXT = /^(black|#000000?|#111(?:111)?|#222(?:222)?|#333(?:333)?|#444(?:444)?)$/i;
const GRID_STROKE_COLOR = /^(#e[5-9a-f][0-9a-f]{4}|#d[1-9a-f][0-9a-f]{4}|#c[c-d][c-d][c-d]|#bbb|#aaa|lightgray|light-grey)$/i;
const AXIS_STROKE_COLOR = /^(black|#000000?|#111(?:111)?|#222(?:222)?|#333(?:333)?|#444(?:444)?|#555(?:555)?|#666666?)$/i;

function parseViewBox(svg) {
  const match = svg.match(/viewBox=["']([^"']+)["']/i);
  if (!match) return { w: 800, h: 600 };
  const parts = match[1].trim().split(/[\s,]+/).map(Number);
  if (parts.length === 4) return { w: parts[2], h: parts[3] };
  return { w: 800, h: 600 };
}

function parseDim(value, total) {
  if (value == null) return 0;
  const raw = String(value).trim();
  if (raw.endsWith('%')) return (parseFloat(raw) / 100) * total;
  return parseFloat(raw) || 0;
}

function isLightFill(fill) {
  const color = fill.trim();
  return PURE_WHITE.test(color) || CREAM_FILL.test(color) || color === '#f8f9fa' || color === '#fafafa';
}

function themeRects(svg, vbW, vbH) {
  return svg.replace(/<rect\b([^>]*?)(\/?)>/gi, (match, attrs, selfClose) => {
    const fillMatch = attrs.match(/\bfill=["']([^"']+)["']/i);
    if (!fillMatch) return match;

    const fill = fillMatch[1].trim();
    if (fill === 'none' || fill.startsWith('url(')) return match;

    const width = parseDim(attrs.match(/\bwidth=["']([^"']+)["']/i)?.[1], vbW);
    const height = parseDim(attrs.match(/\bheight=["']([^"']+)["']/i)?.[1], vbH);
    const isPlotBackground =
      /background/i.test(attrs) ||
      (width >= vbW * 0.8 && height >= vbH * 0.8);
    const isLabelBox =
      !isPlotBackground &&
      width > 0 &&
      height > 0 &&
      width <= vbW * 0.65 &&
      height <= vbH * 0.4 &&
      isLightFill(fill);

    let nextFill = null;
    if (isPlotBackground && isLightFill(fill)) nextFill = PLOT_BG;
    else if (isLabelBox) nextFill = LABEL_BG;

    if (!nextFill) return match;
    return `<rect${attrs.replace(fillMatch[0], `fill="${nextFill}"`)}${selfClose}>`;
  });
}

function themeTextFills(svg) {
  return svg.replace(/<(text|tspan)\b([^>]*)>/gi, (match, _tag, attrs) => {
    const fillMatch = attrs.match(/\bfill=["']([^"']+)["']/i);
    if (!fillMatch || !DARK_TEXT.test(fillMatch[1].trim())) return match;
    return match.replace(fillMatch[0], `fill="${LIGHT_TEXT}"`);
  });
}

function themeStrokes(svg) {
  return svg.replace(/\bstroke=["']([^"']+)["']/gi, (match, color) => {
    const value = color.trim();
    if (value === 'none' || value.startsWith('url(')) return match;
    if (GRID_STROKE_COLOR.test(value)) return `stroke="${GRID_STROKE}"`;
    if (AXIS_STROKE_COLOR.test(value)) return `stroke="${AXIS_STROKE}"`;
    return match;
  });
}

/** Theme inline SVG plots for dark UI without stretching or breaking labels */
export function themeSvgForDark(svg) {
  if (!svg || !svg.includes('<svg')) return svg;

  const { w, h } = parseViewBox(svg);
  let out = svg;
  out = themeRects(out, w, h);
  out = themeTextFills(out);
  out = themeStrokes(out);
  return out;
}

/** Post-process Mermaid-rendered SVG for dark backgrounds */
export function themeMermaidSvg(svg) {
  if (!svg) return svg;

  let out = themeSvgForDark(svg);

  out = out.replace(
    /(<rect[^>]*class="[^"]*background[^"]*"[^>]*fill=")[^"]*(")/gi,
    `$1${PLOT_BG}$2`,
  );

  out = out.replace(
    /fill="var\(--mermaid-[^"]+-background[^"]*\)"/gi,
    `fill="${PLOT_BG}"`,
  );

  return out;
}

/** Let diagrams expand to container width while keeping aspect ratio */
export function makeSvgResponsive(svg) {
  if (!svg || !svg.includes('<svg')) return svg;

  return svg.replace(/<svg\b([^>]*)>/i, (match, attrs) => {
    const cleaned = attrs
      .replace(/\swidth=["'][^"']*["']/gi, '')
      .replace(/\sheight=["'][^"']*["']/gi, '')
      .replace(/\sstyle=["'][^"']*["']/gi, '');

    return `<svg${cleaned} width="100%" style="max-width:100%;height:auto;display:block">`;
  });
}
