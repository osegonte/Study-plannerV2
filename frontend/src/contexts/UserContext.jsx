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
  const [currentUser] = useState({ 
    id: 'demo-user',
    username: 'demo', 
    email: 'demo@example.com' 
  });
  const [userProfile] = useState({
    displayName: 'Demo User',
    school: 'Demo University'
  });
  const [isAuthenticated] = useState(true);

  const createAccount = () => console.log('Account created');
  const logout = () => console.log('Logged out');

  return (
    <UserContext.Provider value={{ 
      currentUser, 
      userProfile, 
      isAuthenticated, 
      createAccount, 
      logout 
    }}>
      {children}
    </UserContext.Provider>
  );
};
