// src/Router.tsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import PatientViewer from "./PatientViewer"; 
import PatientList from "./PatientList"; 

export default function Router() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Redirect root to the Patient List */}
        <Route path="/" element={<Navigate to="/patient-list" replace />} />

        {/* Route to display the Patient List */}
        <Route path="/patient-list" element={<PatientList />} />

        {/* The main dynamic route for the Patient Viewer */}
        <Route path="/pasien/:id" element={<PatientViewer />} />
      </Routes>
    </BrowserRouter>
  );
}