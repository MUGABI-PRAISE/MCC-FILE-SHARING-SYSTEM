
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './services/AuthContext';

import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Toast from './components/Toast';

/**
 * AppRoutes handles routing logic and ensures protected routes use isAuthenticated
 */
function AppRoutes({ offices, userInfo, setUserInfo, toast, setToast }) {
  const { isAuthenticated } = useAuth();
  return (
    <Routes>
      <Route
        path="/"
        element={
          isAuthenticated ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <Login setUserInfo={setUserInfo} />
          )
        }
      />

      <Route
        path="/login"
        element={
          isAuthenticated ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <Login setUserInfo={setUserInfo} />
          )
        }
      />

      <Route path="/signup" element={<Signup offices={offices} />} />

      <Route
        path="/dashboard"
        element={
          <Dashboard offices={offices} userInfo={userInfo} setUserInfo={setUserInfo}/>
        }
      />

      <Route
        path="/dashboard/profile"
        element={
          isAuthenticated ? (
            <Profile user={userInfo} isAuthenticated={isAuthenticated} />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
    </Routes>
  );
}

/**
 * Main App component
 */
export default function App() {
  const [offices, setOffices] = useState([]);
  const [toast, setToast] = useState(null);
  const [userInfo, setUserInfo] = useState(() => {
    const stored = localStorage.getItem('userInfo');
    return stored ? JSON.parse(stored) : null;
  });
  
  useEffect(() => {
    async function fetchOffices() {
      try {
        const res = await fetch('http://10.42.0.1:8000/filesharing/offices/');
        const data = await res.json();
        setOffices(data);
      } catch (err) {
        console.error('Failed to load offices', err);
        showToast('Failed to load office list', 'error');
      }
    }

    fetchOffices();
  }, []);

  const showToast = (message, type) => {
    setToast({ message, type });
  };

  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes
          offices={offices}
          userInfo={userInfo}
          setUserInfo={setUserInfo}
          toast={toast}
          setToast={setToast}
        />
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </AuthProvider>
    </BrowserRouter>
  );
}


