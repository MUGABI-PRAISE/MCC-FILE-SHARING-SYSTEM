// import { useState, useEffect } from 'react';
// import '../styles/Toast.css';

// export default function Toast({ message, type, duration = 4000, onClose }) {
//   const [visible, setVisible] = useState(true);

//   useEffect(() => {
//     const timer = setTimeout(() => {
//       setVisible(false);
//       onClose();
//     }, duration);

//     return () => clearTimeout(timer);
//   }, [duration, onClose]);

//   if (!visible) return null;

//   return (
//     <div className={`toast toast-${type}`}>
//       <div className="toast-message">{message}</div>
//     </div>
//   );
// }

///////////////////////
// FROM TOP 
//////////////////////////
// Toast.js
import { useState, useEffect } from 'react';
import '../styles/Toast.css';

export default function Toast({ message, type, duration = 4000, onClose }) {
  const [isVisible, setIsVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const showTimer = setTimeout(() => {
      setIsVisible(true);
    }, 10); // Small delay to trigger animation

    const exitTimer = setTimeout(() => {
      setIsExiting(true);
    }, duration - 500); // Start exit animation 500ms before closing

    const closeTimer = setTimeout(() => {
      onClose();
    }, duration);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(exitTimer);
      clearTimeout(closeTimer);
    };
  }, [duration, onClose]);

  return (
    <div className={`toast-container ${isExiting ? 'exiting' : ''}`}>
      <div className={`toast toast-${type} ${isVisible ? 'visible' : ''}`}>
        <div className="toast-message">{message}</div>
      </div>
    </div>
  );
}