// import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
// import Login from './pages/Login';
// import Dashboard from './pages/Dashboard';
// import Signup from './pages/Signup';
// import { useState, useEffect } from 'react';
// import Toast from './components/Toast';
// import Profile from './pages/Profile';
// import { AuthProvider } from './services/AuthContext';

// export default function App() {
//   const [offices, setOffices] = useState([]);
//   const [toast, setToast] = useState(null);
//   const [isAuthenticated, setIsAuthenticated] = useState(
//     !!localStorage.getItem('token')
//   );
//   const [userInfo, setUserInfo] = useState(null); // user information


//   // ✅ Show toast
//   const showToast = (message, type) => {
//     setToast({ message, type });
//   };

//   const closeToast = () => setToast(null);

//   // ✅ Fetch office list on mount
//   useEffect(() => {
//     async function fetchOffices() {
//       try {
//         const res = await fetch('http://localhost:8000/filesharing/offices/');
//         const data = await res.json();
//         setOffices(data);
//       } catch (err) {
//         console.error('Failed to load offices', err);
//         showToast('Failed to load office list', 'error');
//       }
//     }
//     fetchOffices();
//   }, []);

//   return (
//     <BrowserRouter>
//       <AuthProvider setIsAuthenticated={setIsAuthenticated}>
        
//           <Routes>
//             <Route
//               path="/"
//               element={
//                 isAuthenticated ? (
//                   <Navigate to="/dashboard" replace />
//                 ) : (
//                   <Login 
//                     setIsAuthenticated={setIsAuthenticated} 
//                     setUserInfo={setUserInfo} // 👈 pass down to Login
//                   />
//                 )
//               }
//             />

//             <Route
//               path="/login"
//               element={
//                 isAuthenticated ? (
//                   <Navigate to="/dashboard" replace />
//                 ) : (
//                   <Login 
//                     setIsAuthenticated={setIsAuthenticated} 
//                     setUserInfo={setUserInfo} // 👈 pass down to Login
//                   />
//                 )
//               }
//             />

//             <Route
//               path="/signup"
//               element={<Signup offices={offices} />}
//             />

//             <Route
//               path="/dashboard"
//               element={
//                 <Dashboard
//                   offices={offices}
//                   setIsAuthenticated={setIsAuthenticated}
//                   userInfo={userInfo} // user object
//                 />
//               }
//             />

//               {/* profile page */}
//             <Route
//               path="/dashboard/profile"
//               element={
//                 isAuthenticated ? (
//                   <Profile user = {userInfo} isAuthenticated={isAuthenticated}/>
//                 ) : (
//                   <Navigate to="/login" replace />
//                 )
//               }
//             />
//           </Routes>

//           {toast && <Toast message={toast.message} type={toast.type} onClose={closeToast} />}
//       </AuthProvider>
//     </BrowserRouter>

//   );
// }

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
          <Dashboard offices={offices} userInfo={userInfo} />
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
  const [userInfo, setUserInfo] = useState(null);

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


