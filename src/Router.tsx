// src/Router.tsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Welcome from "./pages/Welcome";
import Loading from "./pages/Loading"; // New Import
import PatientViewer from "./pages/PatientViewer"; 
import PatientList from "./pages/PatientList"; 

export default function Router() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Set root to the Welcome screen */}
        <Route path="/" element={<Welcome />} />

        {/* Route to display the Loading screen */}
        <Route path="/loading" element={<Loading />} />

        {/* Route to display the Patient List */}
        <Route path="/patient-list" element={<PatientList />} />

        {/* The main dynamic route for the Patient Viewer */}
        <Route path="/pasien/:id" element={<PatientViewer />} />
      </Routes>
    </BrowserRouter>
  );
}