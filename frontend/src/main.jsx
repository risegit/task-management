import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { BrowserRouter } from "react-router-dom";
import { ThemeProvider } from "@material-tailwind/react";
import { MaterialTailwindControllerProvider } from "@/context";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Import global styles
import "../public/css/tailwind.css";
import "./global.css";

// 👇 Dynamic base path for local and production
const mode = import.meta.env.MODE;
const base = mode === "development" ? "/" : "/"; 

console.log("🌐 Environment Mode:", mode);
console.log("🌍 Router Base Path:", base);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter basename={base}>
      <ThemeProvider>
        <MaterialTailwindControllerProvider>
          <App />

          {/* ✅ Add ToastContainer here */}
          <ToastContainer />
        </MaterialTailwindControllerProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);
