// src/App.jsx
import { Routes, Route, Navigate } from "react-router-dom";
import { Dashboard, Auth } from "@/layouts";
import ProtectedRoute from "@/components/ProtectedRoute";

function App() {
  return (
    <Routes>
      {/* PROTECTED DASHBOARD ROUTES */}
      <Route
        path="/dashboard/*"
        element={
          // <ProtectedRoute>
            <Dashboard />
          // </ProtectedRoute>
        }
      />

      {/* PUBLIC AUTH ROUTES */}
      <Route path="/auth/*" element={<Auth />} />

      {/* DEFAULT REDIRECT */}
      <Route path="*" element={<Navigate to="/auth/sign-in" replace />} />
    </Routes>
  );
}

export default App;



// import { Routes, Route, Navigate } from "react-router-dom";
// import { Dashboard, Auth } from "@/layouts";

// function App() {
//   return (
//     <Routes>
//       <Route path="/dashboard/*" element={<Dashboard />} />
//       <Route path="/auth/*" element={<Auth />} />
//       <Route path="*" element={<Navigate to="/dashboard/home" replace />} />
//     </Routes>
//   );
// }

// export default App;

