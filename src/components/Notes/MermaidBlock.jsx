import React, { useEffect, useRef, useState } from 'react';
import { themeMermaidSvg, makeSvgResponsive } from '../../utils/svgTheme';

let mermaidLoaded = false;
let mermaidLib = null;

async function loadMermaid() {
  if (mermaidLoaded && mermaidLib) return mermaidLib;
  const mod = await import('mermaid');
  mermaidLib = mod.default;
  mermaidLib.initialize({
    startOnLoad: false,
    theme: 'dark',
    themeVariables: {
      primaryColor: '#2a2d33',
      primaryTextColor: '#f5f5f7',
      primaryBorderColor: '#ff8a00',
      lineColor: '#ffaa00',
      secondaryColor: '#22252a',
      tertiaryColor: '#1a1c20',
      fontFamily: 'Inter, sans-serif',
      fontSize: '14px',
      clusterBkg: 'transparent',
      clusterBorder: '#ffaa00',
      titleColor: '#da1b60',
      edgeLabelBackground: '#22252a',
      xyChart: {
        backgroundColor: '#1e2126',
        titleColor: '#f5f5f7',
        xAxisLabelColor: '#a8adb5',
        xAxisTitleColor: '#d1d5db',
        xAxisTickColor: '#6b7280',
        xAxisLineColor: '#6b7280',
        yAxisLabelColor: '#a8adb5',
        yAxisTitleColor: '#d1d5db',
        yAxisTickColor: '#6b7280',
        yAxisLineColor: '#6b7280',
        plotColorPalette: '#ff8a00, #da1b60, #ff9f43, #f43f5e',
      },
    },
    flowchart: { useMaxWidth: true, htmlLabels: false, curve: 'basis', nodeSpacing: 60, rankSpacing: 60 },
    mindmap: { useMaxWidth: true },
    securityLevel: 'loose',
  });
  mermaidLoaded = true;
  return mermaidLib;
}

let renderCount = 0;

export default function MermaidBlock({ code }) {
  const containerRef = useRef(null);
  const [error, setError] = useState(null);
  const [svg, setSvg] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const render = async () => {
      try {
        const mermaid = await loadMermaid();
        const id = `mermaid-${++renderCount}`;
        if (document.fonts) {
          await document.fonts.ready;
        }
        const { svg: rendered } = await mermaid.render(id, code.trim());
        if (!cancelled) {
          setSvg(makeSvgResponsive(themeMermaidSvg(rendered)));
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Invalid diagram');
          setLoading(false);
        }
      }
    };

    render();
    return () => { cancelled = true; };
  }, [code]);

  if (loading) {
    return (
      <div className="mermaid-loading">
        <div className="mermaid-spinner" />
        <span>Rendering diagram...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mermaid-error">
        <span className="mermaid-error-icon">⚠️</span>
        <span>Diagram error: {error}</span>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="mermaid-block"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
