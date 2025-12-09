// src/components/ProtectedRoute.jsx
import { Navigate } from "react-router-dom";

const isAuthenticated = () => localStorage.getItem("loggedIn") === "true";

export default function ProtectedRoute({ children }) {
  if (!isAuthenticated()) return <Navigate to="/auth/sign-in" replace />;
  return children;
}
