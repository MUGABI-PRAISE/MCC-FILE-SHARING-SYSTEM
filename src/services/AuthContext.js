import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));

  const logout = () => {
    localStorage.clear() // remove everything from local storage 
    setIsAuthenticated(false);
    // ❌ Do not navigate here – let UI components handle redirect
  };

  return (
    <AuthContext.Provider value={{ logout, isAuthenticated, setIsAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
