import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ConfettiEffect = ({ trigger = false, duration = 3000 }) => {
  const [isActive, setIsActive] = useState(false);
  const [confettiPieces, setConfettiPieces] = useState([]);

  useEffect(() => {
    if (trigger) {
      setIsActive(true);
      
      // Generate confetti pieces
      const pieces = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 0.5,
        duration: 2 + Math.random() * 2,
        rotation: Math.random() * 360,
        color: ['#FF6B6B', '#4ECDC4', '#FFD93D', '#95E1D3', '#F38181', '#AA96DA', '#FCBAD3'][
          Math.floor(Math.random() * 7)
        ],
        size: 8 + Math.random() * 8,
      }));
      
      setConfettiPieces(pieces);

      // Auto-hide after duration
      const timer = setTimeout(() => {
        setIsActive(false);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [trigger, duration]);

  if (!isActive) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      <AnimatePresence>
        {confettiPieces.map((piece) => (
          <motion.div
            key={piece.id}
            initial={{
              top: '-10%',
              left: `${piece.left}%`,
              opacity: 1,
              rotate: 0,
              scale: 1,
            }}
            animate={{
              top: '110%',
              left: `${piece.left + (Math.random() - 0.5) * 20}%`,
              opacity: [1, 1, 0],
              rotate: piece.rotation + 720,
              scale: [1, 1.2, 0.8],
            }}
            exit={{
              opacity: 0,
            }}
            transition={{
              duration: piece.duration,
              delay: piece.delay,
              ease: 'easeIn',
            }}
            style={{
              position: 'absolute',
              width: piece.size,
              height: piece.size,
              backgroundColor: piece.color,
              borderRadius: Math.random() > 0.5 ? '50%' : '0',
            }}
          />
        ))}
      </AnimatePresence>

      {/* Center Celebration Text */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        transition={{ duration: 0.5, ease: 'backOut' }}
        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
      >
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            rotate: [0, 5, -5, 0],
          }}
          transition={{
            duration: 1,
            repeat: 2,
            ease: 'easeInOut',
          }}
          className="text-6xl"
        >
          🎉
        </motion.div>
      </motion.div>
    </div>
  );
};

export default ConfettiEffect;
