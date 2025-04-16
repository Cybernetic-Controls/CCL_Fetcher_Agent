// authService.js
import API_URL from '../apiConfig';

// Login function
export const login = async (username, password) => {
  try {
    const response = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('refreshToken', data.refreshToken);
      return { success: true, user: data.user };
    }
    
    return { success: false, message: data.message };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

// Refresh token function - UPDATED
export const refreshToken = async () => {
  const refreshToken = localStorage.getItem('refreshToken');
  
  if (!refreshToken) {
    console.error("No refresh token available");
    return { success: false, message: 'No refresh token available' };
  }
  
  try {
    const response = await fetch(`${API_URL}/refresh-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ refreshToken })
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Refresh token error:", response.status, errorData);
      return { success: false, message: errorData.message || 'Refresh failed' };
    }
    
    const data = await response.json();
    
    if (data.token) {
      localStorage.setItem('token', data.token);
      // Store the new refresh token if provided
      if (data.refreshToken) {
        localStorage.setItem('refreshToken', data.refreshToken);
      }
      return { success: true };
    } else {
      console.error("Refresh token response missing token field:", data);
      return { success: false, message: 'Invalid server response' };
    }
  } catch (error) {
    console.error("Refresh token exception:", error);
    return { success: false, message: error.message };
  }
};

// Logout function
export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
};

// Check if user is authenticated
export const isAuthenticated = () => {
  return !!localStorage.getItem('token');
};