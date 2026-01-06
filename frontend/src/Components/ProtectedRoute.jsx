// src/components/ProtectedRoute.jsx
import { Navigate } from "react-router-dom";
import { jwtDecode } from 'jwt-decode';

const isAuthenticated = () => {
  const token = localStorage.getItem("token");
  if (!token) return false;
  try {
    const decoded = jwtDecode(token);
    if (decoded.exp < Date.now() / 1000) {
      // Token expired
      localStorage.removeItem("token");
      localStorage.removeItem("loggedIn");
      return false;
    }
    return true;
  } catch (e) {
    return false;
  }
};

export default function ProtectedRoute({ children }) {
  if (!isAuthenticated()) return <Navigate to="/auth/sign-in" replace />;
  return children;
}
