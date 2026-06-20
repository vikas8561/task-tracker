import React, { useState, useRef, useEffect } from 'react';
import {
  Pencil, Lightbulb, AlertCircle, TriangleAlert, Flame,
  Info, CircleCheck, CircleHelp, CircleX, Bug, FlaskConical,
  Quote, ClipboardList, BookOpen, Sigma, GraduationCap,
  CheckCheck, ShieldAlert, Zap, Brain, Star, Cpu, BarChart3,
  Microscope, MessageSquare, RotateCcw, Flag, ChevronDown,
} from 'lucide-react';
import { resolveCalloutType } from './calloutTypes';

/** Map icon name strings to Lucide components */
const ICON_MAP = {
  Pencil, Lightbulb, AlertCircle, TriangleAlert, Flame,
  Info, CircleCheck, CircleHelp, CircleX, Bug, FlaskConical,
  Quote, ClipboardList, BookOpen, Sigma, GraduationCap,
  CheckCheck, ShieldAlert, Zap, Brain, Star, Cpu, BarChart3,
  Microscope, MessageSquare, RotateCcw, Flag,
};

/**
 * CalloutBlock — renders a visually distinct callout component.
 *
 * When used with the remarkCallouts remark plugin, this receives its
 * props via data attributes on the wrapper div:
 *   data-callout="formula"
 *   data-callout-title="Custom Title"
 *   data-callout-foldable="true"
 *   data-callout-folded="true"
 *
 * Children are already-rendered React elements (paragraphs, code blocks,
 * KaTeX math, mermaid diagrams, etc.).
 */
export default function CalloutBlock({
  type: typeProp,
  title: titleProp,
  foldable: foldableProp,
  defaultFolded: defaultFoldedProp,
  children,
}) {
  const { resolvedType, config } = resolveCalloutType(typeProp);
  const IconComponent = ICON_MAP[config.icon] || Pencil;
  const title = titleProp || config.label;
  const foldable = foldableProp === true || foldableProp === 'true';
  const defaultFolded = defaultFoldedProp === true || defaultFoldedProp === 'true';

  const [folded, setFolded] = useState(defaultFolded);
  const bodyRef = useRef(null);
  const [bodyHeight, setBodyHeight] = useState('auto');

  // Measure body height for smooth animation
  useEffect(() => {
    if (bodyRef.current) {
      setBodyHeight(bodyRef.current.scrollHeight + 'px');
    }
  }, [children]);

  const handleToggle = () => {
    if (!foldable) return;
    setFolded((f) => !f);
  };

  const handleKeyDown = (e) => {
    if (!foldable) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleToggle();
    }
  };

  return (
    <div
      className={`callout-block callout-type-${resolvedType}`}
      data-callout={resolvedType}
      style={{
        '--callout-accent': config.color,
        '--callout-bg': config.bg,
        '--callout-border': config.border,
      }}
    >
      <div
        className={`callout-header ${foldable ? 'callout-foldable' : ''}`}
        onClick={foldable ? handleToggle : undefined}
        onKeyDown={foldable ? handleKeyDown : undefined}
        role={foldable ? 'button' : undefined}
        tabIndex={foldable ? 0 : undefined}
        aria-expanded={foldable ? !folded : undefined}
      >
        <span className="callout-icon" aria-hidden="true">
          <IconComponent size={16} strokeWidth={2.2} />
        </span>
        <span className="callout-title">{title}</span>
        {foldable && (
          <span
            className={`callout-fold-indicator ${folded ? 'callout-folded' : ''}`}
            aria-hidden="true"
          >
            <ChevronDown size={14} />
          </span>
        )}
      </div>
      <div
        ref={bodyRef}
        className="callout-body"
        style={
          foldable
            ? {
                maxHeight: folded ? '0px' : bodyHeight,
                opacity: folded ? 0 : 1,
                overflow: 'hidden',
              }
            : undefined
        }
      >
        <div className="callout-body-inner">
          {children}
        </div>
      </div>
    </div>
  );
}
