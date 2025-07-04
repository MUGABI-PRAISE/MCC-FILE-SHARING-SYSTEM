import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import '../styles/Login.css';
import LoginSuccessAnimation from '../components/LoginSuccessAnimation';

export default function Login({ setIsAuthenticated, setUserInfo}) {
  // State for login animation trigger
  const [loginSuccess, setLoginSuccess] = useState(false);

  // State for user credentials
  const [credentials, setCredentials] = useState({
    username: '',
    password: '',
  });

  // States for feedback
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Navigation hook from react-router
  const navigate = useNavigate();

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent form reload
    setError('');
    setSuccess('');
    setIsLoading(true); // Show loading spinner

    try {
      // Call backend login API
      const response = await fetch('http://localhost:8000/filesharing/login/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json(); // Get parsed response

      if (response.ok) {
        // Save token to localStorage using consistent key
        localStorage.setItem('token', data.access); // Access token (used to protect routes)
        localStorage.setItem('refreshToken', data.refresh); // Optionally used for refresh

        // Save user info for later use (e.g., greeting, sidebar)
        localStorage.setItem('firstName', data.user.first_name);
        localStorage.setItem('lastName', data.user.last_name);
        localStorage.setItem('position', data.user.position);

        // save the user, and push him to App.js which will give them to any component in need of it
        setUserInfo(data.user); // 👈 this pushes user to App.js
        
        setSuccess('Login successful! Redirecting...');
        setLoginSuccess(true); // Trigger animation
        setTimeout(() => {
          setIsAuthenticated(true); // ✅ THEN trigger route protection logic
          navigate('/dashboard');   // ✅ Navigate after animation
        }, 2000);

      } else {
        // Graceful error messages
        setError(
          data.errors?.non_field_errors?.[0] ||
          data.message ||
          'Invalid username or password'
        );
      }
    } catch (err) {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setIsLoading(false); // Reset loading
    }
  };

  // If login was successful, show animation then redirect
  if (loginSuccess) {
    return <LoginSuccessAnimation onComplete={() => navigate('/dashboard')} />;
  }

  return (
    <div className="login-container">
      <div className="login-card">
        {/* Logo & heading */}
        <div className="login-header">
          <img src="/logo.png" alt="Mbarara City Council" className="logo" />
          <h1>MCC File Sharing System</h1>
          <p>Secure document transfer between offices</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="login-form">
          {/* Display error if any */}
          {error && <div className="alert-error">{error}</div>}

          {/* Display success message */}
          {success && <div className="alert-success">{success}</div>}

          {/* Username input */}
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              value={credentials.username}
              onChange={(e) =>
                setCredentials({ ...credentials, username: e.target.value })
              }
              required
              disabled={isLoading}
            />
          </div>

          {/* Password input */}
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={credentials.password}
              onChange={(e) =>
                setCredentials({ ...credentials, password: e.target.value })
              }
              required
              disabled={isLoading}
            />
          </div>

          {/* Submit button */}
          <button
            type="submit"
            className={`login-button ${isLoading ? 'loading' : ''}`}
            disabled={isLoading}
          >
            {isLoading ? '' : 'Log In'}
          </button>
        </form>

        {/* Footer */}
        <div className="login-footer">
          <p>Contact system administrator for access</p>
        </div>
      </div>
    </div>
  );
}
