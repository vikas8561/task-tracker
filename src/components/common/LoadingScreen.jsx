import { useState, useEffect } from 'react';
import './LoadingScreen.css';

const DEFAULT_MESSAGES = [
  "fueling your productivity journey...",
  "organizing your goals for success...",
  "preparing something amazing for today...",
  "let's make today your best day yet...",
  "finding your focus and clearing distractions...",
  "aligning your tasks with your ambitions...",
  "building habits that shape your future...",
  "unlocking new possibilities and opportunities...",
  "one small step closer to your goals...",
  "gathering your thoughts and ideas...",
  "setting the stage for a productive day...",
  "preparing for progress, growth, and success...",
  "dream big, work smart, achieve more...",
  "start small, stay steady, go far...",
  "synapses connecting...",
  "mapping neural pathways...",
  "optimizing deep networks...",
  "analyzing data patterns...",
  "training the core...",
  "processing logic gates...",
  "building cognitive nodes...",
  "expanding digital horizons...",
  "Mapping infinite neural pathways...",
  "Igniting synaptic connections...",
  "Preparing your workspace...",
  "Organizing your tasks...",
  "Syncing recent progress...",
  "Aligning goals...",
  "Loading dashboard metrics...",
  "Setting the stage for success..."
];

export default function LoadingScreen({ 
  messages = DEFAULT_MESSAGES, 
  interval = 3000, 
  fullScreen = true,
  isLoading = true
}) {
  const [currentIndex, setCurrentIndex] = useState(() => Math.floor(Math.random() * messages.length));
  const [isFadingOut, setIsFadingOut] = useState(false);

  const [mountLoading, setMountLoading] = useState(true);
  const [fadeLoading, setFadeLoading] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      setFadeLoading(true);
      const timer = setTimeout(() => {
        setMountLoading(false);
      }, 1200);
      return () => clearTimeout(timer);
    } else {
      setMountLoading(true);
      setFadeLoading(false);
    }
  }, [isLoading]);

  // Message rotation logic
  useEffect(() => {
    const timer = setInterval(() => {
      setIsFadingOut(true);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % messages.length);
        setIsFadingOut(false);
      }, 400); 
    }, interval);

    return () => clearInterval(timer);
  }, [messages, interval]);

  if (!mountLoading) return null;

  return (
    <div className={`app-global-loader ${fullScreen ? 'fullscreen' : 'inline'} ${fadeLoading ? 'fade-out-loader' : ''}`}>
      <div className={`loading-screen-container ${fullScreen ? 'fullscreen' : 'inline'}`}>
        
        {/* The Clean Geometric Wrapper */}
        <div className="hud-interface-wrapper">
          
          {/* Subtle Theme Background Rings (No more harsh grids/scanlines) */}
          <div className="theme-glow-bg"></div>
          
          {/* Central Geometric Rings */}
          <div className="hud-rings-container">
            <svg className="hud-svg" viewBox="0 0 300 300">
              {/* Outer Precision Ring */}
              <circle cx="150" cy="150" r="130" fill="none" stroke="var(--text-muted)" strokeWidth="1" strokeDasharray="4 12" className="hud-spin-slow" />
              
              {/* Theme Accent Track */}
              <circle cx="150" cy="150" r="115" fill="none" stroke="var(--border-glass)" strokeWidth="8" strokeDasharray="1 10" className="hud-spin-medium-reverse" />

              {/* Thick Middle Power Ring */}
              <circle cx="150" cy="150" r="100" fill="none" stroke="var(--accent-1)" strokeWidth="3" strokeDasharray="100 40 50 30" className="hud-spin-fast-reverse" />
              
              {/* Secondary Accent Precision Ring */}
              <circle cx="150" cy="150" r="80" fill="none" stroke="var(--accent-2)" strokeWidth="1.5" strokeDasharray="2 6" className="hud-spin-medium" />

              {/* Center Core */}
              <g className="hud-core-pulse" stroke="var(--accent-1)" strokeWidth="2">
                <circle cx="150" cy="150" r="30" fill="var(--bg-secondary)" stroke="var(--border-color)" strokeDasharray="10 5" />
                <circle cx="150" cy="150" r="10" fill="var(--accent-grad-start)" className="hud-inner-core" />
              </g>
            </svg>
          </div>

          {/* Clean Modern Message Display */}
          <div className="clean-loader-text-container">
            <p className={`clean-loader-text ${isFadingOut ? 'fade-out' : 'fade-in'}`}>
              {messages[currentIndex]}
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
