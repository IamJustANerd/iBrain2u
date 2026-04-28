// src/pages/Loading.tsx
import Logo from "../assets/logo_2.svg";

export default function Loading() {
  const loadingSteps = [
    "Memuat Data PACS",
    "Preprocessing Gambar",
    "Deteksi Penyakit (Level 1)",
    "Klasifikasi Subtype (Level 2)",
    "Analisis Detail (Level 3)",
    "Generating Overlay",
  ];

  return (
    // 1. Changed min-h-screen to h-screen to lock the page height
    <div className="h-screen bg-[#1C1C1E] flex items-center justify-center font-['Plus_Jakarta_Sans'] p-4">
      {/* Main Container Card */}
      {/* 2. Added max-h-full and overflow-hidden so the card doesn't bleed out of the screen */}
      <div className="w-full max-w-4xl max-h-full bg-[#141414] border border-[#2C2C2E] rounded-2xl px-8 py-2 md:p-12 flex flex-col items-center overflow-hidden">
        
        {/* Header Section */}
        {/* 3. Added shrink-0 so the header never gets squished when the screen is tiny */}
        <div className="flex flex-col items-center mb-5 shrink-0">
          <img src={Logo} alt="iBrain2U Logo" className="h-24 w-auto mb-4" />
          <h1 className="text-3xl font-semibold text-white mb-2">
            Menganalisis MRI Otak
          </h1>
          <p className="text-lg text-white font-medium">Alexander Bruno</p>
          <p className="text-sm text-[#8E8E93]">RM001234</p>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-3 rounded-xl bg-gray-3">

        </div>

        {/* Progress Percentage */}
        <div className="mb-6 mt-2 shrink-0">
          <span className="text-[#4285F4] text-xl font-bold">1 %</span>
        </div>

        {/* Steps Checklist */}
        {/* 4. Added overflow-y-auto, min-h-0 */}
        <div className="w-full space-y-2 overflow-y-auto min-h-0 custom-scrollbar">
          {loadingSteps.map((step, index) => (
            <div 
              key={index}
              className="w-full bg-[#1C1C1E] border border-[#2C2C2E] rounded-lg py-2 px-6 flex items-center gap-4 group shrink-0"
            >
              {/* Radio-style circle icon */}
              <div className="w-3 h-3 rounded-full border-2 border-[#48484A] flex-shrink-0" />
              
              <span className="text-[#AEAEB2] text-sm font-medium">
                {step}
              </span>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}