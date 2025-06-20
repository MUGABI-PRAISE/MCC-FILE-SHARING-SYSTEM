import { useState } from 'react'; // keep track of state
import { useNavigate } from 'react-router-dom'; // manual redirecting
import '../styles/Login.css';

export default function Login () {
  // state keeps data about the component which always changes
  const [credentials, setCredentials] = useState({ username: '', password: '' }); // username and password are always changing as the user is typing in the input Fields
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Authentication logic (will connect to Django backend)
      const response = await fakeAuth(credentials);
      if (response.success) {
        navigate('/dashboard');
      } else {
        setError('Invalid credentials');
      }
    } catch (err) {
      setError('Login failed. Please try again.');
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <img src="/mcc-logo.png" alt="Mbarara City Council" className="logo" />
          <h1>MCC File Sharing System</h1>
          <p>Secure document transfer between offices</p>
        </div>
        
        <form onSubmit={handleSubmit} className="login-form">
          {error && <div className="error-message">{error}</div>}
          
          <div className="form-group">
            <label htmlFor="username">Username</label> {/* we don't use for attribute in react. for is a reserved word*/}
            <input
              type="text"
              id="username"
              value={credentials.username}
              onChange={(e) => setCredentials({...credentials, username: e.target.value})} // ... updates the object
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={credentials.password}
              onChange={(e) => setCredentials({...credentials, password: e.target.value})} // ... updates the object
              required
            />
          </div>
          
          <button type="submit" className="login-button">Log In</button>
        </form>
        
        <div className="login-footer">
          <p>Contact system administrator for access</p>
        </div>
      </div>
    </div>
  );
};

// Temporary mock authentication
const fakeAuth = async (credentials) => {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve({ success: true }); // In real app, this would call your Django backend
    }, 500);
  });
};

