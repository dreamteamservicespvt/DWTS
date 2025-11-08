import { useEffect } from 'react';
import confetti from 'canvas-confetti';

const ConfettiCelebration = ({ trigger = false }) => {
  useEffect(() => {
    if (trigger) {
      // Fire confetti from multiple angles
      const duration = 3 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

      function randomInRange(min, max) {
        return Math.random() * (max - min) + min;
      }

      const interval = setInterval(function() {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);

        // Fire from left
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
          colors: ['#0057FF', '#00C4B4', '#FFD700', '#FF6B6B', '#4ECDC4']
        });

        // Fire from right
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
          colors: ['#0057FF', '#00C4B4', '#FFD700', '#FF6B6B', '#4ECDC4']
        });
      }, 250);

      // Cleanup
      return () => clearInterval(interval);
    }
  }, [trigger]);

  return null;
};

// Alternative simple burst
export const celebrateTaskCompletion = () => {
  const count = 200;
  const defaults = {
    origin: { y: 0.7 },
    zIndex: 9999
  };

  function fire(particleRatio, opts) {
    confetti({
      ...defaults,
      ...opts,
      particleCount: Math.floor(count * particleRatio),
      colors: ['#0057FF', '#00C4B4', '#FFD700', '#FF6B6B', '#4ECDC4', '#95E1D3']
    });
  }

  fire(0.25, {
    spread: 26,
    startVelocity: 55,
  });

  fire(0.2, {
    spread: 60,
  });

  fire(0.35, {
    spread: 100,
    decay: 0.91,
    scalar: 0.8
  });

  fire(0.1, {
    spread: 120,
    startVelocity: 25,
    decay: 0.92,
    scalar: 1.2
  });

  fire(0.1, {
    spread: 120,
    startVelocity: 45,
  });
};

export default ConfettiCelebration;
