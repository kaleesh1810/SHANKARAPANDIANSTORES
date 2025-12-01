// context/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();
const AUTH_STORAGE_KEY = 'auth_data'; // Key for localStorage persistence

export const AuthProvider = ({ children }) => {
  // Initialize state from localStorage
  const [userData, setUserData] = useState(() => {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.userData || null;
      }
    } catch (err) {
      console.warn('Failed to restore auth data from localStorage:', err);
    }
    return null;
  });

  const [permissions, setPermissions] = useState(() => {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.permissions || [];
      }
    } catch (err) {
      console.warn('Failed to restore permissions from localStorage:', err);
    }
    return [];
  });

  const login = (data) => {
    const newUserData = {
      username: data.userName,
      role: data.role,
      companyCode: data.fCompCode,
    };
    const newPermissions = data.permissions || [];

    setUserData(newUserData);
    setPermissions(newPermissions);

    // Persist to localStorage
    try {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({
        userData: newUserData,
        permissions: newPermissions,
      }));
    } catch (err) {
      console.warn('Failed to persist auth data to localStorage:', err);
    }
  };

  const logout = () => {
    setUserData(null);
    setPermissions([]);
    
    // Remove from localStorage
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    } catch (err) {
      console.warn('Failed to remove auth data from localStorage:', err);
    }
  };

  return (
    <AuthContext.Provider value={{ userData, permissions, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
