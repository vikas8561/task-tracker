import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import ForceGraph2D from 'react-force-graph-2d';

export default function KnowledgeConstellation({ subjects = [], chapters = [] }) {
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 400 });

  // Handle responsive resize
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setDimensions({
          width: entry.contentRect.width,
          height: 400, // Fixed height or could make dynamic
        });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Transform data into nodes and links
  const graphData = useMemo(() => {
    if (subjects.length === 0) return { nodes: [], links: [] };

    const nodes = [];
    const links = [];

    // Root Node (The User / Knowledge Core)
    nodes.push({
      id: 'root',
      name: 'Knowledge Base',
      val: 25,
      color: '#ffffff',
      type: 'root'
    });

    subjects.forEach(s => {
      // Create Subject Node
      const subjectNodeId = `subject-${s.id}`;
      nodes.push({
        id: subjectNodeId,
        name: s.name,
        val: 15,
        color: s.color || 'var(--accent-1)',
        type: 'subject',
        progress: s.percentage || 0
      });

      // Link Root -> Subject
      links.push({
        source: 'root',
        target: subjectNodeId,
        color: 'rgba(255,255,255,0.1)'
      });
    });

    chapters.forEach(c => {
      if (!c.subjectId) return;
      const chapterNodeId = `chapter-${c.id}`;
      const parentSubjectId = `subject-${c.subjectId}`;
      const percentage = c.percentage || 0;
      
      const isComplete = percentage === 100;
      const isStarted = percentage > 0;

      let nodeColor = 'rgba(255, 255, 255, 0.15)'; // Dim grey for unstarted
      if (isComplete) nodeColor = c.subjectColor;
      else if (isStarted) nodeColor = c.subjectColor; // Could mix colors if needed

      nodes.push({
        id: chapterNodeId,
        name: c.name,
        val: isComplete ? 8 : (isStarted ? 6 : 4),
        color: nodeColor,
        type: 'chapter',
        progress: percentage,
        opacity: isStarted ? 1 : 0.3
      });

      // Link Subject -> Chapter
      links.push({
        source: parentSubjectId,
        target: chapterNodeId,
        color: isStarted ? `${c.subjectColor}66` : 'rgba(255,255,255,0.05)' // 66 is hex for 40% opacity
      });
    });

    return { nodes, links };
  }, [subjects, chapters]);

  // Custom rendering for nodes
  const paintNode = useCallback((node, ctx, globalScale) => {
    const { id, x, y, val, color, name, type, opacity } = node;

    // Outer glow for root and completed nodes
    if (type === 'root' || (type === 'chapter' && node.progress === 100) || type === 'subject') {
      ctx.beginPath();
      ctx.arc(x, y, val * 1.5, 0, 2 * Math.PI, false);
      ctx.fillStyle = type === 'root' ? 'rgba(255,255,255,0.1)' : `${color}33`; // 33 is 20% opacity
      ctx.fill();
    }

    // Node Body
    ctx.beginPath();
    ctx.arc(x, y, val, 0, 2 * Math.PI, false);
    ctx.fillStyle = type === 'chapter' && node.progress < 100 && node.progress > 0 
      ? color // solid if in progress
      : color;
    
    // Apply opacity for unstarted nodes
    ctx.globalAlpha = opacity !== undefined ? opacity : 1;
    ctx.fill();
    ctx.globalAlpha = 1;

    // Inner core for subjects
    if (type === 'subject') {
      ctx.beginPath();
      ctx.arc(x, y, val * 0.5, 0, 2 * Math.PI, false);
      ctx.fillStyle = '#1a1c20'; // dark background
      ctx.fill();
    }

    // Text Label (only show if zoomed in enough, or always for root/subjects)
    const fontSize = 12 / globalScale;
    if (globalScale > 1.2 || type === 'root' || type === 'subject') {
      ctx.font = `${fontSize}px Inter, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = type === 'chapter' && opacity === 0.3 ? 'rgba(255,255,255,0.4)' : '#ffffff';
      
      // Background pill for text for readability
      const textWidth = ctx.measureText(name).width;
      const bgWidth = textWidth + (8 / globalScale);
      const bgHeight = fontSize + (4 / globalScale);
      
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.roundRect(x - bgWidth / 2, y + val + (4 / globalScale), bgWidth, bgHeight, 4 / globalScale);
      ctx.fill();

      // Draw Text
      ctx.fillStyle = type === 'chapter' && opacity === 0.3 ? 'rgba(255,255,255,0.6)' : '#ffffff';
      ctx.fillText(name, x, y + val + (4 / globalScale) + bgHeight / 2);
    }
  }, []);

  if (subjects.length === 0) return null;

  return (
    <div 
      className="card-3d progress-chart-card slide-up" 
      style={{ 
        animationDelay: '150ms',
        padding: '0', // Full bleed inside the card
        overflow: 'hidden',
        position: 'relative',
        borderRadius: '24px',
        border: '1px solid var(--border-glass)',
        boxShadow: 'var(--shadow-sm)',
        background: 'rgba(15, 17, 21, 0.8)' // Slightly darker background for space feel
      }}
      ref={containerRef}
    >
      <div style={{ position: 'absolute', top: 16, left: 24, zIndex: 10, pointerEvents: 'none' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#fff', textShadow: '0 2px 8px rgba(0,0,0,0.8)' }}>Knowledge Constellation</h3>
        <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)', marginTop: '4px', textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>
          Interactive map of your learning progress
        </p>
      </div>

      <div style={{ width: '100%', height: '400px', cursor: 'grab' }} className="constellation-container">
        {dimensions.width > 0 && (
          <ForceGraph2D
            width={dimensions.width}
            height={dimensions.height}
            graphData={graphData}
            nodeCanvasObject={paintNode}
            nodeLabel={() => ''} // disable default title tooltip since we draw text
            linkColor={link => link.color}
            linkWidth={link => link.source.type === 'root' ? 2 : 1}
            d3AlphaDecay={0.02}
            d3VelocityDecay={0.3}
            backgroundColor="transparent"
            cooldownTicks={100} // Stop simulation early so it settles
          />
        )}
      </div>
    </div>
  );
}
