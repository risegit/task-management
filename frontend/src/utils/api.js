// API utility functions with JWT authentication

import { jwtDecode } from 'jwt-decode';

const API_BASE_URL = import.meta.env.VITE_API_URL;

// Get JWT token from localStorage
const getToken = () => localStorage.getItem('token');

// Get current user from JWT
export const getCurrentUser = () => {
  const token = getToken();
  if (!token) return null;
  try {
    const decoded = jwtDecode(token);
    return decoded.user || null;
  } catch (e) {
    return null;
  }
};

// Create headers with JWT if available
const getHeaders = (additionalHeaders = {}) => {
  const headers = {
    'Content-Type': 'application/json',
    ...additionalHeaders,
  };

  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
};

// Generic fetch with JWT
export const apiFetch = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = getHeaders(options.headers);

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    // Token expired or invalid, redirect to login
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('loggedIn');
    window.location.href = '/auth/sign-in';
    throw new Error('Unauthorized');
  }

  return response;
};

// For form data (like login)
export const apiFetchForm = async (endpoint, formData, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = {};

  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
    body: formData,
  });

  if (response.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('loggedIn');
    window.location.href = '/auth/sign-in';
    throw new Error('Unauthorized');
  }

  return response;
};