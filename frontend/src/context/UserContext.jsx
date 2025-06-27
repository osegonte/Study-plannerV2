// Enhanced User Account and File Management System
// frontend/src/contexts/UserContext.jsx

import React, { createContext, useContext, useState, useEffect } from 'react';

const UserContext = createContext();

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export const UserProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userProfile, setUserProfile] = useState(null);

  // Load user from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('pdf-study-planner-user');
    const savedProfile = localStorage.getItem('pdf-study-planner-profile');
    
    if (savedUser && savedProfile) {
      setCurrentUser(JSON.parse(savedUser));
      setUserProfile(JSON.parse(savedProfile));
      setIsAuthenticated(true);
    }
  }, []);

  const createAccount = (userData) => {
    const user = {
      id: Date.now().toString(),
      username: userData.username.trim(),
      email: userData.email.trim(),
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString()
    };

    const profile = {
      userId: user.id,
      displayName: userData.displayName || userData.username,
      school: userData.school || '',
      major: userData.major || '',
      semester: userData.semester || '',
      studyGoals: userData.studyGoals || '',
      preferences: {
        defaultReadingSpeed: 60, // pages per hour
        sessionReminders: true,
        darkMode: false,
        autoSave: true
      },
      statistics: {
        totalStudyTime: 0,
        totalPages: 0,
        documentsRead: 0,
        averageSessionLength: 0
      }
    };

    // Save to localStorage
    localStorage.setItem('pdf-study-planner-user', JSON.stringify(user));
    localStorage.setItem('pdf-study-planner-profile', JSON.stringify(profile));

    setCurrentUser(user);
    setUserProfile(profile);
    setIsAuthenticated(true);

    return { user, profile };
  };

  const updateProfile = (updates) => {
    const updatedProfile = {
      ...userProfile,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    localStorage.setItem('pdf-study-planner-profile', JSON.stringify(updatedProfile));
    setUserProfile(updatedProfile);
  };

  const logout = () => {
    setCurrentUser(null);
    setUserProfile(null);
    setIsAuthenticated(false);
    // Keep data but clear active session
  };

  const deleteAccount = () => {
    if (window.confirm('Are you sure you want to delete your account? This will remove all your data.')) {
      // Clear all user data
      localStorage.removeItem('pdf-study-planner-user');
      localStorage.removeItem('pdf-study-planner-profile');
      localStorage.removeItem('pdf-study-planner-topics');
      localStorage.removeItem('pdf-study-planner-documents');
      localStorage.removeItem('pdf-study-planner-goals');
      
      setCurrentUser(null);
      setUserProfile(null);
      setIsAuthenticated(false);
    }
  };

  return (
    <UserContext.Provider value={{
      currentUser,
      userProfile,
      isAuthenticated,
      createAccount,
      updateProfile,
      logout,
      deleteAccount
    }}>
      {children}
    </UserContext.Provider>
  );
};