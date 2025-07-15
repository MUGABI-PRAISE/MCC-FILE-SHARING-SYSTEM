import { useState, useEffect, useRef } from 'react';
import '../styles/Toast.css';

export default function Toast({ message, type, duration = 5000, onClose }) {
  const [isVisible, setIsVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);
  const toastRef = useRef(null);

  // Sparkle particles (CSS-only)
  useEffect(() => {
    if (type !== 'success') return;

    const toastElement = toastRef.current;
    if (!toastElement) return;

    // Create sparkles
    const createSparkle = () => {
      const sparkle = document.createElement('div');
      sparkle.className = 'sparkle-particle';
      sparkle.style.left = `${Math.random() * 100}%`;
      sparkle.style.top = `${Math.random() * 100}%`;
      sparkle.style.animationDelay = `${Math.random() * 0.5}s`;
      toastElement.appendChild(sparkle);

      // Remove after animation
      setTimeout(() => sparkle.remove(), 5000);
    };

    // Generate sparkles while toast is active
    const interval = setInterval(createSparkle, 200);
    return () => clearInterval(interval);
  }, [type]);

  useEffect(() => {
    const showTimer = setTimeout(() => setIsVisible(true), 40);
    const exitTimer = setTimeout(() => setIsExiting(true), duration - 500);
    const closeTimer = setTimeout(onClose, duration);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(exitTimer);
      clearTimeout(closeTimer);
    };
  }, [duration, onClose]);

  return (
    <div className={`toast-container ${isExiting ? 'exiting' : ''}`}>
      <div 
        ref={toastRef}
        className={`toast toast-${type} ${isVisible ? 'visible' : ''}`}
      >
        <div className="toast-message">
          {message}
          {type === 'success' && <span className="diamond-sparkle">✨</span>}
        </div>
      </div>
    </div>
  );
}