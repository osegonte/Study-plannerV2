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
        defaultReadingSpeed: userData.defaultReadingSpeed || 60,
        sessionReminders: userData.sessionReminders !== false,
        darkMode: false,
        autoSave: userData.autoSave !== false
      }
    };

    localStorage.setItem('pdf-study-planner-user', JSON.stringify(user));
    localStorage.setItem('pdf-study-planner-profile', JSON.stringify(profile));

    setCurrentUser(user);
    setUserProfile(profile);
    setIsAuthenticated(true);

    return { user, profile };
  };

  const updateProfile = (updates) => {
    const updatedProfile = { ...userProfile, ...updates };
    localStorage.setItem('pdf-study-planner-profile', JSON.stringify(updatedProfile));
    setUserProfile(updatedProfile);
  };

  const logout = () => {
    setCurrentUser(null);
    setUserProfile(null);
    setIsAuthenticated(false);
  };

  return (
    <UserContext.Provider value={{
      currentUser,
      userProfile,
      isAuthenticated,
      createAccount,
      updateProfile,
      logout
    }}>
      {children}
    </UserContext.Provider>
  );
};
