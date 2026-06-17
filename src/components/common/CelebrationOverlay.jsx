import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { useApp } from '../../context/AppContext';
import './CelebrationOverlay.css';

const emojis = ['🍌🍌', '🧚‍♀️🧚‍♂️', '💃🕺🏽', '🤠🥳', '🎈🎈'];

export default function CelebrationOverlay() {
  const { state } = useApp();

  useEffect(() => {
    if (state.isCelebrating) {
      const duration = 3500;
      const animationEnd = Date.now() + duration;
      const defaults = { zIndex: 10000, colors: ['#ff8a00', '#da1b60', '#ff6b35', '#00e5a0', '#fff'] };

      // Helper for a beautiful, realistic multi-layered explosion
      const explode = (x, y, totalParticles) => {
        confetti({ ...defaults, origin: { x, y }, particleCount: Math.floor(totalParticles * 0.25), spread: 26, startVelocity: 55 });
        confetti({ ...defaults, origin: { x, y }, particleCount: Math.floor(totalParticles * 0.2), spread: 60 });
        confetti({ ...defaults, origin: { x, y }, particleCount: Math.floor(totalParticles * 0.35), spread: 100, decay: 0.91, scalar: 0.8 });
        confetti({ ...defaults, origin: { x, y }, particleCount: Math.floor(totalParticles * 0.1), spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
        confetti({ ...defaults, origin: { x, y }, particleCount: Math.floor(totalParticles * 0.1), spread: 120, startVelocity: 45 });
      };

      // Helper for the launch trails
      const launch = (x, angle, velocity = 90) => {
        confetti({
          ...defaults,
          particleCount: 60,
          angle: angle,
          spread: 15,
          startVelocity: velocity,
          origin: { x: x, y: 1 },
          colors: ['#fff', '#ff8a00'],
          ticks: 150
        });
      };

      // 1. The Launch (9 coordinated sky shots across the screen)
      launch(0.5, 90, 95);   // Center
      launch(0.1, 65, 85);   // Bottom Left
      launch(0.9, 115, 85);  // Bottom Right

      const l1 = setTimeout(() => {
        launch(0.3, 80, 85);   // Mid Left
        launch(0.7, 100, 85);  // Mid Right
      }, 150);

      const l2 = setTimeout(() => {
        launch(0.05, 55, 90);  // Extreme Corner Left 1
        launch(0.95, 125, 90); // Extreme Corner Right 1
        launch(0.0, 50, 80);   // Extreme Corner Left 2
        launch(1.0, 130, 80);  // Extreme Corner Right 2
      }, 300);

      // 2. The Explosions (Timed perfectly as they reach their peaks)
      const t1 = setTimeout(() => {
        explode(0.5, 0.3, 350); // Huge center explosion
      }, 350); 

      const t2 = setTimeout(() => {
        explode(0.1, 0.4, 200);  // Left explosion
        explode(0.9, 0.4, 200);  // Right explosion
      }, 380); 

      const t3 = setTimeout(() => {
        explode(0.3, 0.35, 250); // Mid Left explosion
        explode(0.7, 0.35, 250); // Mid Right explosion
      }, 480);

      const t4 = setTimeout(() => {
        explode(0.05, 0.5, 150); // Corner Left 1
        explode(0.95, 0.5, 150); // Corner Right 1
        explode(0.0, 0.6, 150);  // Corner Left 2
        explode(1.0, 0.6, 150);  // Corner Right 2
      }, 600);

      // 4. Constant gentle side crackers
      function randomInRange(min, max) {
        return Math.random() * (max - min) + min;
      }
      const interval = setInterval(function () {
        const timeLeft = animationEnd - Date.now();
        if (timeLeft <= 0) return clearInterval(interval);

        const particleCount = 40 * (timeLeft / duration);
        confetti({
          ...defaults, particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
          startVelocity: randomInRange(30, 50),
          gravity: randomInRange(0.6, 1.2),
          shapes: ['circle', 'square']
        });
        confetti({
          ...defaults, particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
          startVelocity: randomInRange(30, 50),
          gravity: randomInRange(0.6, 1.2),
          shapes: ['circle', 'square']
        });
      }, 250);

      return () => {
        clearInterval(interval);
        clearTimeout(l1);
        clearTimeout(l2);
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
        clearTimeout(t4);
      };
    }
  }, [state.isCelebrating]);

  if (!state.isCelebrating) return null;

  const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];

  return (
    <div className="celebration-overlay">
      <div className="celebration-text-container">
        <h1 className="celebration-text">Task Completed!</h1>
        <div className="celebration-emoji">{randomEmoji}</div>
      </div>
    </div>
  );
}
