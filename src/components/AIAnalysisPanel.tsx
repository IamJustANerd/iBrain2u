// src/components/AiAnalysisPanel.tsx
import { useState, useEffect } from "react";
import ArrowUp from "../assets/icons/gray/arrowUp.svg";
import Time from "../assets/icons/gray/time.svg";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface AiAnalysisPanelProps {
  patient: any;
}

export default function AiAnalysisPanel({ patient }: AiAnalysisPanelProps) {
  const [sheetHeight, setSheetHeight] = useState(96);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const handleMove = (e: TouchEvent | MouseEvent) => {
      if (!isDragging) return;
      e.preventDefault();
      const clientY =
        "touches" in e ? e.touches[0].clientY : (e as MouseEvent).clientY;
      const newHeight = window.innerHeight - clientY;
      setSheetHeight(
        Math.max(96, Math.min(window.innerHeight - 64, newHeight)),
      );
    };

    const handleEnd = () => setIsDragging(false);

    if (isDragging) {
      window.addEventListener("mousemove", handleMove);
      window.addEventListener("mouseup", handleEnd);
      window.addEventListener("touchmove", handleMove, { passive: false });
      window.addEventListener("touchend", handleEnd);
    }

    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleEnd);
      window.removeEventListener("touchmove", handleMove);
      window.removeEventListener("touchend", handleEnd);
    };
  }, [isDragging]);

  return (
    <aside
      className="w-full bg-gray-10 border-t-3 border-gray-6 flex flex-col shrink-0 z-50 overflow-hidden md:w-80 h-[var(--sheet-height)] md:h-full md:border-t-0 md:border-l-3 rounded-t-2xl md:rounded-none transition-none"
      style={{ "--sheet-height": `${sheetHeight}px` } as React.CSSProperties}
    >
      <div
        className="h-8 flex items-center justify-center cursor-ns-resize md:hidden w-full bg-gray-10 touch-none shrink-0"
        onMouseDown={() => setIsDragging(true)}
        onTouchStart={() => setIsDragging(true)}
      >
        <div className="flex flex-col gap-1 w-8">
          <div className="h-0.5 bg-gray-4 rounded-full w-full"></div>
          <div className="h-0.5 bg-gray-4 rounded-full w-full"></div>
        </div>
      </div>

      <div className="flex flex-col flex-1 overflow-y-auto min-h-0">
        <div className="h-12 flex text-red-1 text-sm font-bold tracking-widest border-b-3 border-b-gray-6 shrink-0">
          <div className="bg-red-1 h-[45.5px] w-1 relative -left-[2.5px]"></div>
          <div className="h-full items-center flex pl-4">
            AI ANALYSIS RESULTS
          </div>
        </div>

        <div className="p-4 shrink-0">
          <div className="bg-gray-9 border-2 border-gray-7 rounded-lg p-4 mb-6">
            <h3 className="text-gray-1 text-xs font-semibold mb-3">
              INFORMASI PASIEN
            </h3>
            <div className="border-b-2 border-gray-2 mb-3"></div>

            {/* FULLY RESTORED PATIENT INFO BLOCK */}
            <div className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-white text-xs">Type</span>
                <span className="text-blue-1 text-xs">
                  {patient.aiAnalysis.type}
                </span>
              </div>
              <div className="flex justify-between text-right">
                <span className="text-white text-xs">Sub-type</span>
                <span className="text-white text-xs">
                  {patient.aiAnalysis.subType}
                </span>
              </div>
              <div className="flex justify-between text-right">
                <span className="text-white text-xs">Consistency</span>
                <span className="text-white text-xs">
                  {patient.aiAnalysis.consistency}
                </span>
              </div>
              <div className="flex justify-between text-right">
                <span className="text-white text-xs">Margins</span>
                <span className="text-white text-xs">
                  {patient.aiAnalysis.margins}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            {[
              "LEVEL 1 : DETEKSI PRIMER",
              "LEVEL 2 : KLASIFIKASI",
              "LEVEL 3 : ANALISIS DETAIL",
            ].map((level) => (
              <button
                key={level}
                className="flex items-center justify-between bg-gray-9 border-2 border-gray-6 rounded-lg p-3 text-xs text-gray-1 font-bold hover:bg-gray-8 transition-colors"
              >
                {level}
                <img src={ArrowUp} alt="Toggle" />
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 mt-auto shrink-0 pb-8 md:pb-4">
          <div className="border-2 border-gray-5 rounded-lg p-4 bg-gray-11">
            <h3 className="text-white text-xs font-bold mb-3">
              VERIFIKASI DOKTER
            </h3>
            <div className="bg-gray-8 text-gray-1 text-xs p-3 rounded flex items-center gap-2 mb-3 border-2 border-gray-5">
              <img src={Time} alt="Time" /> {patient.verificationStatus}
            </div>
            <button className="w-full bg-blue-1 hover:bg-blue-600 text-white font-semibold text-sm py-2 rounded transition-colors">
              Verifikasi
            </button>
            <button className="w-full text-center text-gray-1 hover:text-white text-xs mt-3">
              Edit
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
