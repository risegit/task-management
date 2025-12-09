// src/components/RoleProtectedRoute.jsx
import { Navigate } from "react-router-dom";

export default function 
RoleProtectedRoute({ element, allowedRoles }) {
  const rawUser = localStorage.getItem("user");
  let role = null;
  if (rawUser) {
    try {
      role = JSON.parse(rawUser)?.role ?? null;
    } catch (e) {}
  }

  if (!allowedRoles.includes(role)) return <Navigate to="/dashboard/home" replace />;
  return element;
}
