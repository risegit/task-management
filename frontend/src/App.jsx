// src/App.jsx
import { Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useRef } from "react";
import { Dashboard, Auth } from "@/layouts";
import ProtectedRoute from "@/components/ProtectedRoute";
import { initNotificationSound } from "@/utils/notificationSound";

/* ---------------- DESKTOP NOTIFICATION PERMISSION ---------------- */

const requestNotificationPermission = async () => {
  if (!("Notification" in window)) return;

  if (Notification.permission === "default") {
    try {
      await Notification.requestPermission();
    } catch (err) {
      console.error("Notification permission error:", err);
    }
  }
};

function App() {
  const soundUnlocked = useRef(false);

  useEffect(() => {
    // 🔔 Request notification permission once
    requestNotificationPermission();

    // 🔊 Unlock notification sound after first user interaction
    const unlockAudio = () => {
      if (!soundUnlocked.current) {
        initNotificationSound();
        soundUnlocked.current = true;

        document.removeEventListener("click", unlockAudio);
        document.removeEventListener("keydown", unlockAudio);
      }
    };

    document.addEventListener("click", unlockAudio);
    document.addEventListener("keydown", unlockAudio);

    return () => {
      document.removeEventListener("click", unlockAudio);
      document.removeEventListener("keydown", unlockAudio);
    };
  }, []);

  return (
    <Routes>
      {/* ---------------- PROTECTED DASHBOARD ROUTES ---------------- */}
      <Route
        path="/dashboard/*"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      {/* ---------------- PUBLIC AUTH ROUTES ---------------- */}
      <Route path="/auth/*" element={<Auth />} />

      {/* ---------------- DEFAULT REDIRECT ---------------- */}
      <Route path="*" element={<Navigate to="/auth/sign-in" replace />} />
    </Routes>
  );
}

export default App;
