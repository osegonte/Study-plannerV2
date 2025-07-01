import React, { createContext, useContext, useState } from 'react';

const UserContext = createContext();

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export const UserProvider = ({ children }) => {
  // Fixed: Ensure user object always has profile property
  const [currentUser] = useState({ 
    id: 'demo-user',
    username: 'demo', 
    email: 'demo@example.com',
    profile: {
      displayName: 'Demo User',
      school: 'Demo University'
    }
  });
  
  // Separate profile state with safe defaults
  const [userProfile] = useState({
    displayName: 'Demo User',
    school: 'Demo University'
  });
  
  const [isAuthenticated] = useState(true);

  const createAccount = (data) => {
    console.log('Account created:', data);
  };
  
  const logout = () => {
    console.log('Logged out');
  };

  // Ensure safe property access with fallbacks
  const safeCurrentUser = {
    ...currentUser,
    profile: currentUser.profile || userProfile
  };

  return (
    <UserContext.Provider value={{ 
      currentUser: safeCurrentUser, 
      userProfile: currentUser.profile || userProfile, 
      isAuthenticated, 
      createAccount, 
      logout 
    }}>
      {children}
    </UserContext.Provider>
  );
};