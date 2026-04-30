// src/pages/PatientViewer.tsx
import { useParams } from "react-router-dom";
import { usePatientScan } from "../hooks/usePatientScan";

import TopNavbar from "../components/TopNavbar";
import SidebarLeft from "../components/SidebarLeft";
import MainViewerArea from "../components/MainViewerArea";
import AiAnalysisPanel from "../components/AIAnalysisPanel";

// 1. Vite glob evaluates correctly because it's relative to THIS file
const patientModules = import.meta.glob("../constant/*.tsx");

export default function PatientViewer() {
  const { id } = useParams<{ id: string }>();

  // 2. We inject the modules into the hook
  const {
    patient,
    sessionId,
    axis,
    setAxis,
    maxFrames,
    currentFrame,
    setCurrentFrame,
    activeImageSrc,
  } = usePatientScan(id, patientModules);

  if (!patient || !sessionId) {
    return (
      <div className="min-h-screen bg-gray-11 flex flex-col items-center justify-center text-white gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
        <div>Loading Scan Data...</div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-gray-11 font-['Plus_Jakarta_Sans'] overflow-hidden">
      <TopNavbar patient={patient} />

      <div className="flex flex-col md:flex-row flex-1 overflow-hidden relative">
        <div className="flex flex-1 overflow-hidden min-h-0 w-full">
          <SidebarLeft />

          <MainViewerArea
            axis={axis}
            setAxis={setAxis}
            currentFrame={currentFrame}
            setCurrentFrame={setCurrentFrame}
            maxFrames={maxFrames}
            activeImageSrc={activeImageSrc}
            patient={patient}
            // Now dynamically pulled from your 1.tsx file instead of mock JSON
            analysisData={patient?.aiAnalysis} 
          />
        </div>

        {/* The patient prop here passes the entire 1.tsx object, giving this component access to patient.aiAnalysis */}
        <AiAnalysisPanel patient={patient} setCurrentFrame={setCurrentFrame} />
      </div>
    </div>
  );
}