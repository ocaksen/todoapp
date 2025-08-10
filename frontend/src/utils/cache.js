// Cache management utilities

export const clearUserCache = () => {
  // Clear localStorage
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('projects');
  localStorage.removeItem('currentProject');
  
  // Clear sessionStorage
  sessionStorage.clear();
  
  console.log('🧹 User cache cleared');
};

export const refreshUserData = async () => {
  // Force reload user data
  try {
    const token = localStorage.getItem('token');
    if (token) {
      // Trigger re-authentication to refresh user data
      window.location.reload();
    }
  } catch (error) {
    console.error('Failed to refresh user data:', error);
  }
};

export const handleNewUserRegistration = () => {
  // Clear any existing cache for new users
  clearUserCache();
  
  // Add flag for new user
  localStorage.setItem('isNewUser', 'true');
  
  console.log('👤 New user registration handled');
};

export const isNewUser = () => {
  const newUserFlag = localStorage.getItem('isNewUser');
  if (newUserFlag === 'true') {
    localStorage.removeItem('isNewUser');
    return true;
  }
  return false;
};