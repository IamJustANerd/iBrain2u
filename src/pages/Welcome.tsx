// src/pages/Welcome.tsx
import { useNavigate } from "react-router-dom";
import Logo from "../assets/logo_2.svg";
import ArrowRight from "../assets/icons/arrow_right.svg";

export default function Welcome() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#1C1C1E] flex flex-col items-center justify-center font-['Plus_Jakarta_Sans']">
      <div className="text-center max-w-xl p-8 flex flex-col items-center gap-12">
        <div className="flex flex-col items-center">
          {/* Logo */}
          <img src={Logo} alt="iBrain2U Logo" className="h-32 w-auto" />

          {/* Title */}
          <h1 className="text-5xl font-semibold text-white mt-15">iBrain2U</h1>

          {/* Subtitle */}
          <h2 className="text-xl font-medium text-white mt-4">
            AI-Based Brain MRI Analysis System
          </h2>

          {/* Description */}
          <p className="text-sm text-white leading-relaxed mt-2">
            Comprehensive AI-powered medical imaging solutions designed to
            enhance diagnostic accuracy and clinical workflow efficiency.
          </p>
        </div>

        <div className="flex flex-col items-center w-full">
          {/* Button with navigation logic */}
          <button 
            onClick={() => navigate('/patient-list')}
            className="bg-blue-1 text-white px-10 py-3 rounded-full font-semibold flex items-center justify-center gap-3 transition hover:bg-[#3574E2]"
          >
            <span>Mulai Analisis</span>
            <img src={ArrowRight} alt="Arrow Right" className="h-3 w-auto" />
          </button>

          {/* Version */}
          <p className="text-xs text-white mt-2">Version 2.0</p>
        </div>
      </div>
    </div>
  );
}