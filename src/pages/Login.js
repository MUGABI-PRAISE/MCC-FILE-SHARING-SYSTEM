import { useState } from 'react'; // keep track of state
import { useNavigate } from 'react-router-dom'; // manual redirecting
import '../styles/Login.css';
import LoginSuccessAnimation from '../components/LoginSuccessAnimation';

export default function Login() {
  //states: very important...
  const [loginSuccess, setLoginSuccess] = useState(false); // login animation
  const [credentials, setCredentials] = useState({ username: '', password: '' }); // loggin in
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false); // when the login is in progress
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try { // async functions should be wrapped in try/catch
      const response = await fetch('http://localhost:8000/filesharing/login/', { // await halts the execution of the function, but javascript continues executing. this will be executed later
        method: 'POST',
        headers: {
          'Content-Type': 'application/json', // tell the server that we're sending json
        },
        body: JSON.stringify(credentials),
      }); // notice that we are still in fetch method

      const data = await response.json(); // await halts the execution of the function, but javascript continues executing. this will be executed later

      if (response.ok) {
        setSuccess('Login successful! Redirecting...');
        localStorage.setItem('accessToken', data.access); // store in local storage
        localStorage.setItem('refreshToken', data.refresh); // store in local storage
        setLoginSuccess(true); // trigger animation
      } else {
        // handle errors gracefully
        setError(data.errors?.non_field_errors?.[0] || 
                data.message || 
                'Invalid username or password');
      }
    } catch (err) {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // display animation on successful login
  if (loginSuccess) {
    return (
      // navigate to dashboard after animation is complete. (thus a callback function is needed)
      <LoginSuccessAnimation onComplete={() => navigate('/dashboard')} />
    );
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <img src="/logo.png"  alt="Mbarara City Council" className="logo" />
          <h1>MCC File Sharing System</h1>
          <p>Secure document transfer between offices</p>
        </div>
        
        <form onSubmit={handleSubmit} className="login-form">
          {error && (
            <div className="alert-error">
              {error}
            </div>
          )}
          
          {success && (
            <div className="alert-success">
              {success}
            </div>
          )}
          
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              value={credentials.username}
              onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
              required
              disabled={isLoading}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={credentials.password}
              onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
              required
              disabled={isLoading}
            />
          </div>
          
          <button 
            type="submit" 
            className={`login-button ${isLoading ? 'loading' : ''}`}
            disabled={isLoading}
          >
            {isLoading ? '' : 'Log In'}
          </button>
        </form>
        
        <div className="login-footer">
          <p>Contact system administrator for access</p>
        </div>
      </div>
    </div>
  );
}



