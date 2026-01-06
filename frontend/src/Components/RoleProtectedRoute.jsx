// src/components/RoleProtectedRoute.jsx
import { Navigate } from "react-router-dom";
import { jwtDecode } from 'jwt-decode';

export default function
RoleProtectedRoute({ element, allowedRoles }) {
  const token = localStorage.getItem("token");
  let role = null;
  if (token) {
    try {
      const decoded = jwtDecode(token);
      role = decoded.user?.role ?? null;
    } catch (e) {}
  }

  if (!allowedRoles.includes(role)) return <Navigate to="/dashboard/home" replace />;
  return element;
}
