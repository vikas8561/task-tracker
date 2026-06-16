import React, { useEffect, useRef, useState } from 'react';

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
      primaryColor: '#181a36',
      primaryTextColor: '#f8f9fa',
      primaryBorderColor: '#ff3366',
      lineColor: '#ffaa00',
      secondaryColor: '#111226',
      tertiaryColor: '#080914',
      fontFamily: 'Inter, sans-serif',
      fontSize: '14px',
      clusterBkg: 'transparent',
      clusterBorder: '#ffaa00',
      titleColor: '#ff3366',
      edgeLabelBackground: '#111226',
    },
    flowchart: { useMaxWidth: true, htmlLabels: true, curve: 'basis' },
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
        const { svg: rendered } = await mermaid.render(id, code.trim());
        if (!cancelled) {
          setSvg(rendered);
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
