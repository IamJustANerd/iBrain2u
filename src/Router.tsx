// src/Router.tsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import PatientViewer from "./PatientViewer";

export default function Router() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Redirect root to our dummy patient for testing purposes */}
        <Route path="/" element={<Navigate to="/pasien/1" replace />} />

        {/* The main dynamic route */}
        <Route path="/pasien/:id" element={<PatientViewer />} />
      </Routes>
    </BrowserRouter>
  );
}
