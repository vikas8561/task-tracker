import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, RefreshCw, X, GitBranch, Info } from 'lucide-react';

// Dynamically import react-force-graph to avoid SSR issues
let ForceGraphLoaded = false;
let ForceGraph2DLib = null;

async function loadForceGraph() {
  if (ForceGraphLoaded && ForceGraph2DLib) return ForceGraph2DLib;
  const mod = await import('react-force-graph-2d');
  ForceGraph2DLib = mod.default || mod.ForceGraph2D || mod;
  ForceGraphLoaded = true;
  return ForceGraph2DLib;
}

const THEME = {
  bg: '#1a1c20',
  nodeCurrent: '#ffaa00',
  nodeNeighbor: '#da1b60',
  nodeDefault: '#6b7280',
  nodeOrphan: '#2a2d33',
  linkDefault: 'rgba(255, 255, 255, 0.1)',
  linkHighlight: 'rgba(255, 138, 0, 0.8)',
  labelDefault: '#a8adb5',
  labelHighlight: '#f5f5f7',
  labelCurrent: '#ffaa00',
};

const TAG_PALETTE = [
  '#ff8a00', '#da1b60', '#ff9f43', '#ff6b35',
  '#e85d75', '#f43f5e', '#f59e0b', '#ef4444',
  '#ec4899', '#f97316',
];

function getTagColor(tags = []) {
  if (!tags.length) return THEME.nodeDefault;
  const hash = tags[0].split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return TAG_PALETTE[hash % TAG_PALETTE.length];
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function GraphView({ graphData, currentSlug, onClose }) {
  const containerRef = useRef(null);
  const graphRef = useRef(null);
  const navigate = useNavigate();

  const [ForceGraph2D, setForceGraph2D] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  // Interaction state
  const [highlightNodes, setHighlightNodes] = useState(new Set());
  const [highlightLinks, setHighlightLinks] = useState(new Set());
  const [hoverNode, setHoverNode] = useState(null);
  const [tooltip, setTooltip] = useState(null); // { node, x, y }

  // Controls
  const [searchQuery, setSearchQuery] = useState('');
  const [showOrphans, setShowOrphans] = useState(true);
  const [colorByTag, setColorByTag] = useState(false);

  // Load ForceGraph dynamically
  useEffect(() => {
    let mounted = true;
    loadForceGraph().then((lib) => {
      if (!mounted) return;
      setForceGraph2D(() => lib);
      setLoading(false);
    }).catch((err) => {
      console.error('Failed to load force graph:', err);
      if (mounted) setLoading(false);
    });
    return () => { mounted = false; };
  }, []);

  // Resize observer
  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setDimensions({ width, height });
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  // Center on current note when data or slug changes
  useEffect(() => {
    if (!graphRef.current || !currentSlug || !graphData.nodes.length) return;
    const node = graphData.nodes.find((n) => n.id === currentSlug);
    if (node) {
      setTimeout(() => {
        graphRef.current?.centerAt(node.x, node.y, 800);
        graphRef.current?.zoom(2.2, 800);
      }, 400);
    }
  }, [currentSlug, graphData, ForceGraph2D]);

  // Compute orphan slugs
  const orphanSlugs = useMemo(() => {
    const linked = new Set();
    graphData.links.forEach((l) => {
      const s = typeof l.source === 'object' ? l.source.id : l.source;
      const t = typeof l.target === 'object' ? l.target.id : l.target;
      linked.add(s);
      linked.add(t);
    });
    return new Set(graphData.nodes.filter((n) => !linked.has(n.id)).map((n) => n.id));
  }, [graphData]);

  // Filter graph data
  const filteredData = useMemo(() => {
    let nodes = graphData.nodes;
    let links = graphData.links;

    if (!showOrphans) {
      nodes = nodes.filter((n) => !orphanSlugs.has(n.id));
      const nodeIds = new Set(nodes.map((n) => n.id));
      links = links.filter((l) => {
        const s = typeof l.source === 'object' ? l.source.id : l.source;
        const t = typeof l.target === 'object' ? l.target.id : l.target;
        return nodeIds.has(s) && nodeIds.has(t);
      });
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matched = new Set(nodes.filter((n) => n.title.toLowerCase().includes(q)).map((n) => n.id));
      setHighlightNodes(matched);
    } else if (!hoverNode) {
      setHighlightNodes(new Set());
    }

    return { nodes, links };
  }, [graphData, showOrphans, orphanSlugs, searchQuery]);

  // Stats
  const stats = useMemo(() => ({
    nodes: filteredData.nodes.length,
    links: filteredData.links.length,
    orphans: filteredData.nodes.filter((n) => orphanSlugs.has(n.id)).length,
  }), [filteredData, orphanSlugs]);

  // Hover handler — highlight connected subgraph
  const handleNodeHover = useCallback((node) => {
    setHoverNode(node || null);
    if (!node) {
      if (!searchQuery.trim()) setHighlightNodes(new Set());
      setHighlightLinks(new Set());
      setTooltip(null);
      return;
    }

    const linkedNodes = new Set([node.id]);
    const linkedLinks = new Set();
    graphData.links.forEach((link) => {
      const srcId = typeof link.source === 'object' ? link.source.id : link.source;
      const tgtId = typeof link.target === 'object' ? link.target.id : link.target;
      if (srcId === node.id || tgtId === node.id) {
        linkedLinks.add(link);
        linkedNodes.add(srcId);
        linkedNodes.add(tgtId);
      }
    });
    setHighlightNodes(linkedNodes);
    setHighlightLinks(linkedLinks);
  }, [graphData, searchQuery]);

  const handleNodeClick = useCallback((node) => {
    navigate(`/notes/${node.id}`);
  }, [navigate]);

  // Canvas node painter — Obsidian-inspired
  const paintNode = useCallback((node, ctx, globalScale) => {
    // Guard: skip if coordinates haven't been set by the simulation yet
    if (!isFinite(node.x) || !isFinite(node.y)) return;

    const isCurrent = node.id === currentSlug;
    const isHovered = node === hoverNode;
    const isHighlighted = highlightNodes.size === 0 || highlightNodes.has(node.id);
    const isOrphan = orphanSlugs.has(node.id);
    const isSearchMatch = searchQuery.trim() && highlightNodes.has(node.id);

    // Node sizing
    const baseSize = 3 + Math.min((node.connections || 0) * 1.8, 12);
    const size = isCurrent ? baseSize + 4 : isHovered ? baseSize + 2 : baseSize;

    // Node color
    let color;
    if (isCurrent) {
      color = THEME.nodeCurrent;
    } else if (colorByTag) {
      color = getTagColor(node.tags);
    } else if (isHovered || isSearchMatch) {
      color = THEME.nodeNeighbor;
    } else if (highlightNodes.size > 0 && highlightNodes.has(node.id) && !isCurrent) {
      color = THEME.nodeNeighbor;
    } else {
      color = isOrphan ? THEME.nodeOrphan : THEME.nodeDefault;
    }

    const alpha = isHighlighted ? 1 : 0.25;

    // Outer glow for current / hover / highlighted
    if (isHighlighted && (isCurrent || isHovered)) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(node.x, node.y, size + 6, 0, 2 * Math.PI);
      const grad = ctx.createRadialGradient(node.x, node.y, size, node.x, node.y, size + 6);
      grad.addColorStop(0, color + '40');
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.restore();
    }

    // Main node circle
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.arc(node.x, node.y, size, 0, 2 * Math.PI);
    ctx.fillStyle = color;
    ctx.fill();

    // White inner dot for current note
    if (isCurrent) {
      ctx.beginPath();
      ctx.arc(node.x, node.y, size * 0.38, 0, 2 * Math.PI);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
    }

    // Ring for hovered node
    if (isHovered && !isCurrent) {
      ctx.beginPath();
      ctx.arc(node.x, node.y, size + 2, 0, 2 * Math.PI);
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5 / globalScale;
      ctx.globalAlpha = 0.6;
      ctx.stroke();
    }

    ctx.restore();

    // Label
    const label = node.title.length > 22 ? node.title.slice(0, 22) + '…' : node.title;
    const fontSize = Math.max(9, Math.min(13, 11 / globalScale));

    if (globalScale > 0.4 || isCurrent || isHovered || isHighlighted) {
      ctx.save();
      ctx.globalAlpha = isHighlighted ? (isCurrent || isHovered ? 1 : 0.85) : 0.2;
      ctx.font = `${isCurrent || isHovered ? 600 : 400} ${fontSize}px Inter, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';

      const textWidth = ctx.measureText(label).width;
      const padding = 3 / globalScale;
      const bgH = fontSize + padding * 2;

      // Label background pill — dark theme
      if (isHighlighted) {
        const rx = node.x - textWidth / 2 - padding;
        const ry = node.y + size + 3 / globalScale;

        ctx.fillStyle = 'rgba(34, 37, 42, 0.94)';
        ctx.beginPath();
        ctx.roundRect(rx, ry, textWidth + padding * 2, bgH, 4 / globalScale);
        ctx.fill();

        ctx.strokeStyle = 'rgba(255, 138, 0, 0.18)';
        ctx.lineWidth = 1 / globalScale;
        ctx.stroke();
      }

      ctx.fillStyle = isCurrent ? THEME.labelCurrent : isHighlighted ? THEME.labelHighlight : THEME.labelDefault;
      ctx.fillText(label, node.x, node.y + size + 4 / globalScale);
      ctx.restore();
    }
  }, [highlightNodes, currentSlug, hoverNode, colorByTag, orphanSlugs, searchQuery]);

  const linkColor = useCallback((link) => {
    if (highlightLinks.size === 0 && highlightNodes.size === 0) return THEME.linkDefault;
    if (highlightLinks.has(link)) return THEME.linkHighlight;
    return 'rgba(255, 138, 0, 0.06)';
  }, [highlightLinks, highlightNodes]);

  const linkWidth = useCallback((link) => {
    return highlightLinks.has(link) ? 2 : 0.8;
  }, [highlightLinks]);

  const nodeVal = useCallback((node) => {
    return 1 + Math.min((node.connections || 0) * 0.5, 5);
  }, []);

  // ── Render ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="graph-view-loading">
        <RefreshCw size={22} className="graph-loading-spinner" />
        <span>Building knowledge graph…</span>
      </div>
    );
  }

  const CONTROLS_H = 96; // approximate height of top controls

  return (
    <div className="graph-view">

      {/* ── Top controls bar ─────────────────────────────────────────── */}
      <div className="graph-topbar">
        <div className="graph-topbar-left">
          <GitBranch size={15} className="graph-topbar-icon" />
          <span className="graph-topbar-title">Knowledge Graph</span>
          <div className="graph-stats-pills">
            <span className="graph-stat-pill">{stats.nodes} notes</span>
            <span className="graph-stat-pill">{stats.links} links</span>
            {stats.orphans > 0 && (
              <span className="graph-stat-pill graph-stat-orphan">{stats.orphans} isolated</span>
            )}
          </div>
        </div>

        <div className="graph-topbar-right">
          {/* Search */}
          <div className="graph-search-box">
            <Search size={12} className="graph-search-icon" />
            <input
              className="graph-search-input"
              placeholder="Search nodes…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button className="graph-search-clear" onClick={() => setSearchQuery('')}>
                <X size={11} />
              </button>
            )}
          </div>

          {/* Filters */}
          <div className="graph-filter-group">
            <label className="graph-filter-toggle" title="Show/hide isolated notes">
              <input
                type="checkbox"
                checked={showOrphans}
                onChange={(e) => setShowOrphans(e.target.checked)}
              />
              <span>Orphans</span>
            </label>
            <label className="graph-filter-toggle" title="Color nodes by tag">
              <input
                type="checkbox"
                checked={colorByTag}
                onChange={(e) => setColorByTag(e.target.checked)}
              />
              <span>Color by tag</span>
            </label>
          </div>

          {/* Close */}
          {onClose && (
            <button className="graph-action-btn graph-close-btn" onClick={onClose} title="Close graph">
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* ── Legend ───────────────────────────────────────────────────── */}
      <div className="graph-legend-bar">
        <div className="graph-legend-item">
          <span className="graph-legend-dot" style={{ background: THEME.nodeCurrent }} />
          Current note
        </div>
        <div className="graph-legend-item">
          <span className="graph-legend-dot" style={{ background: THEME.nodeNeighbor }} />
          Connected
        </div>
        <div className="graph-legend-item">
          <span className="graph-legend-dot" style={{ background: THEME.nodeDefault }} />
          Other notes
        </div>
        {showOrphans && (
          <div className="graph-legend-item">
            <span className="graph-legend-dot" style={{ background: THEME.nodeOrphan }} />
            Isolated
          </div>
        )}
        <div className="graph-legend-hint">
          <Info size={11} />
          Click to open · Drag to move · Scroll to zoom
        </div>
      </div>

      {/* ── Canvas ───────────────────────────────────────────────────── */}
      <div className="graph-canvas-wrapper" ref={containerRef}>
        {ForceGraph2D && filteredData.nodes.length > 0 ? (
          <ForceGraph2D
            ref={graphRef}
            width={dimensions.width}
            height={dimensions.height}
            graphData={filteredData}
            nodeCanvasObject={paintNode}
            nodeCanvasObjectMode={() => 'replace'}
            nodeVal={nodeVal}
            linkColor={linkColor}
            linkWidth={linkWidth}
            linkDirectionalArrowLength={4}
            linkDirectionalArrowRelPos={0.88}
            linkDirectionalArrowColor={linkColor}
            linkCurvature={0.1}
            onNodeClick={handleNodeClick}
            onNodeHover={handleNodeHover}
            cooldownTicks={120}
            d3VelocityDecay={0.25}
            d3AlphaDecay={0.015}
            backgroundColor={THEME.bg}
            enableNodeDrag={true}
            enableZoomInteraction={true}
            minZoom={0.2}
            maxZoom={8}
          />
        ) : !filteredData.nodes.length ? (
          <div className="graph-empty-state">
            <div className="graph-empty-icon">🕸️</div>
            <h3>No notes to display</h3>
            <p>
              Create notes and link them with <code>[[wiki-links]]</code> to build your knowledge graph.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
