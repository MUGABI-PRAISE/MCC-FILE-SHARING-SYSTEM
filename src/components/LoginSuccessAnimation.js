import { useEffect } from 'react';
import '../styles/LoginSuccessAnimation.css';

export default function LoginSuccessAnimation({ onComplete }) {
  useEffect(() => {
    const timeout = setTimeout(() => {
      onComplete(); // callback to navigate after 2s
    }, 2000);
    return () => clearTimeout(timeout);
  }, [onComplete]);

  return (
    <div className="login-success-container">
      <h2>Login Successful. Redirecting…</h2>
      <div className="rocket-animation">
        🚀
      </div>
    </div>
  );
}
