
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Login.css';
import Toast from '../components/Toast';

export default function Signup({offices}) {
  const [formData, setFormData] = useState({
    username: '',
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    confirm_password: '',
    date_of_birth: '',
    position: '',
    date_of_appointment: '',
    profile_picture: null,
    office: ''
  });

  // const [offices, setOffices] = useState([]);
  const [toast, setToast] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const navigate = useNavigate();

  const showToast = (message, type) => {
    setToast({ message, type });
  };

  const closeToast = () => {
    setToast(null);
  };

  // Fetch offices on mount
  // useEffect(() => {
  //   async function fetchOffices() {
  //     try {
  //       const res = await fetch('http://localhost:8000/filesharing/offices/');
  //       const data = await res.json();
  //       setOffices(data);
  //     } catch (err) {
  //       console.error('Failed to load offices', err);
  //       showToast('Failed to load office list', 'error');
  //     }
  //   }

  //   fetchOffices();
  // }, []);

  function handleChange(e) {
    const { name, value, files } = e.target;
    const newValue = files ? files[0] : value;

    const updatedForm = {
      ...formData,
      [name]: newValue
    };

    setFormData(updatedForm);

    // Validate passwords on change
    if (name === 'password' || name === 'confirm_password') {
      validatePasswords(updatedForm.password, updatedForm.confirm_password);
    }
  }

  function validatePasswords(password, confirmPassword) {
    if (password && confirmPassword) {
      if (password.trim() !== confirmPassword.trim()) {
        setPasswordError('Passwords do not match');
        return false;
      } else {
        setPasswordError('');
        return true;
      }
    }
    setPasswordError('');
    return true;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setPasswordError('');

    if (!validatePasswords(formData.password, formData.confirm_password)) {
      showToast('Passwords do not match', 'error');
      return;
    }

    setIsLoading(true);

    try {
      const formDataToSend = new FormData();
      for (const key in formData) {
        if (formData[key] !== null && formData[key] !== '' && key !== 'confirm_password') {
          formDataToSend.append(key, formData[key]);
        }
      }

      const response = await fetch('http://10.42.0.1:8000/filesharing/signup/', {
        method: 'POST',
        body: formDataToSend
      });

      const data = await response.json();

      if (response.ok) {
        showToast('Registration successful! Redirecting to login...', 'success');
        setTimeout(() => navigate('/login'), 2000);
      } else {
        let errorMessage = 'Registration failed. Please check your information.';
        if (data && typeof data === 'object') {
          errorMessage = Object.values(data).flat().join(' ') || errorMessage;
        }
        showToast(errorMessage, 'error');
      }
    } catch (err) {
      showToast('Network error. Please try again later.', 'error');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="login-container">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={closeToast}
        />
      )}

      <div className="login-card">
        <div className="login-header">
          <img src="/logo.png" alt="Mbarara City Council" className="logo" />
          <h1>Create Your Account</h1>
          <p>Join MCC File Sharing System</p>
        </div>

        <div className="required-fields-notice">
          <p>Fields marked with <span className="required-asterisk">*</span> are required</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {/* {error && <div className="alert-error">{error}</div>}
          {success && <div className="alert-success">{success}</div>} */}

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="username">Username <span className="required-asterisk">*</span></label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
                disabled={isLoading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email <span className="required-asterisk">*</span></label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="first_name">First Name <span className="required-asterisk">*</span></label>
              <input
                type="text"
                id="first_name"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                required
                disabled={isLoading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="last_name">Last Name <span className="required-asterisk">*</span></label>
              <input
                type="text"
                id="last_name"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="password">Password <span className="required-asterisk">*</span></label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                disabled={isLoading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirm_password">Confirm Password <span className="required-asterisk">*</span></label>
              <input
                type="password"
                id="confirm_password"
                name="confirm_password"
                value={formData.confirm_password}
                onChange={handleChange}
                required
                disabled={isLoading}
              />
              {passwordError && (
                <div className="password-error-message">{passwordError}</div>
              )}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="position">Position <span className="required-asterisk">*</span></label>
              <input
                type="text"
                id="position"
                name="position"
                value={formData.position}
                onChange={handleChange}
                required
                disabled={isLoading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="office">Office/Department <span className="required-asterisk">*</span></label>
              <select
                id="office"
                name="office"
                value={formData.office}
                onChange={handleChange}
                required
                disabled={isLoading}
              >
                <option value="">Select Office</option>
                {offices.map((office) => (
                  <option key={office.id} value={office.id}>
                    {office.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="date_of_birth">Date of Birth <span className="required-asterisk">*</span></label>
              <input
                type="date"
                id="date_of_birth"
                name="date_of_birth"
                value={formData.date_of_birth}
                onChange={handleChange}
                disabled={isLoading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="date_of_appointment">Appointment Date <span className="required-asterisk">*</span></label>
              <input
                type="date"
                id="date_of_appointment"
                name="date_of_appointment"
                value={formData.date_of_appointment}
                onChange={handleChange}
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="profile_picture">Profile Picture</label>
            <input
              type="file"
              id="profile_picture"
              name="profile_picture"
              onChange={handleChange}
              accept="image/*"
              disabled={isLoading}
            />
            {formData.profile_picture && (
              <div className="file-preview">
                <span>{formData.profile_picture.name}</span>
              </div>
            )}
          </div>

          <button
            type="submit"
            className={`login-button ${isLoading ? 'loading' : ''}`}
            disabled={isLoading || passwordError}
          >
            {isLoading ? 'Creating...' : 'Create Account'}
          </button>
        </form>

        <div className="login-footer">
          <p>Already have an account? <a href="/login">Sign in</a></p>
        </div>
      </div>
    </div>
  );
}
