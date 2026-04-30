// src/components/AiAnalysisPanel.tsx
import { useState, useEffect } from "react";
import ArrowUp from "../assets/icons/gray/arrowUp.svg";
import Time from "../assets/icons/gray/time.svg";
import EyeIcon from "../assets/icons/eye.svg";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface AiAnalysisPanelProps {
  patient: any;
  setCurrentFrame: (frame: number) => void;
}

// --- HELPER FUNCTIONS ---

// 1. Replaces '_' with space and capitalizes every word for Headers
const formatHeaderName = (str: string) => {
  return str
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

// 2. Grabs only the last word after '_' and capitalizes it for Possibilities
const formatPossibilityName = (str: string) => {
  const parts = str.split('_');
  const lastWord = parts[parts.length - 1];
  return lastWord.charAt(0).toUpperCase() + lastWord.slice(1);
};

// 3. Formats details keys (e.g. "clot_volume" -> "Clot Volume", "adc" -> "ADC")
const formatDetailKey = (str: string) => {
  const upperAcronyms = ['dwi', 'adc', 'flair', 'ivh'];
  return str
    .split('_')
    .map((word) =>
      upperAcronyms.includes(word.toLowerCase())
        ? word.toUpperCase()
        : word.charAt(0).toUpperCase() + word.slice(1)
    )
    .join(' ');
};

// 4. Returns the correct measurement unit based on the requested rules
const getMeasurementUnit = (key: string) => {
  const lowerKey = key.toLowerCase();
  if (['dwi_restriction', 'adc', 'flair'].includes(lowerKey)) return '';
  if (['midline_shift', 'size', 'dimensions'].includes(lowerKey)) return 'mm';
  if (['infarct_area'].includes(lowerKey)) return 'cm²';
  if (['volume', 'clot_volume'].includes(lowerKey)) return 'cm³';
  if (['density'].includes(lowerKey)) return 'HU';
  return '';
};


export default function AiAnalysisPanel({ patient, setCurrentFrame }: AiAnalysisPanelProps) {
  const [sheetHeight, setSheetHeight] = useState(96);
  const [isDragging, setIsDragging] = useState(false);
  const [expandedLevel, setExpandedLevel] = useState<string | null>("diagnosis");

  const levels = [
    { key: "diagnosis", label: "DIAGNOSIS" },
    { key: "subtype", label: "SUBTYPE" },
    { key: "stage", label: "STAGE" },
  ];

  const diagnosisClasification = patient?.aiAnalysis?.diagnosis?.clasification || {};
  const isAbnormal = Object.entries(diagnosisClasification).some(
    ([key, value]) => key !== "normal" && (value as number) > 0.50
  );

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

      <div className="flex flex-col flex-1 min-h-0">
        <div className="h-12 flex text-red-1 text-sm font-bold tracking-widest border-b-3 border-b-gray-6 shrink-0">
          <div className="bg-red-1 h-[45.5px] w-1 relative -left-[2.5px]"></div>
          <div className="h-full items-center flex pl-4">
            AI ANALYSIS RESULTS
          </div>
        </div>

        <div className="flex flex-col flex-1 overflow-y-auto min-h-0 custom-scrollbar">
          <div className="p-4 shrink-0">
            
            <div className="bg-gray-9 border-2 border-gray-7 rounded-xl py-6 px-4 mb-6 flex flex-col items-center justify-center shadow-lg">
              <span className={`text-xs font-bold tracking-widest mb-2 ${isAbnormal ? 'text-red-1' : 'text-blue-1'}`}>
                FINDING
              </span>
              <h2 className={`text-3xl font-bold tracking-wider mb-3 ${isAbnormal ? 'text-red-1' : 'text-blue-1'}`}>
                {isAbnormal ? "ABNORMAL" : "NORMAL"}
              </h2>
              <p className="text-gray-1 text-[13px] font-medium">
                {isAbnormal ? "Lesions detected on scan" : "No lesions detected on scan"}
              </p>
            </div>

            <div className="flex flex-col gap-2">
              {levels.map(({ key, label }) => {
                const data = patient?.aiAnalysis?.[key];
                if (!data || Object.keys(data).length === 0) return null;

                const isExpanded = expandedLevel === key;
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const classifications = data.clasification ? Object.entries(data.clasification).sort((a: any, b: any) => b[1] - a[1]) : [];
                const topClassification = classifications[0];
                const otherClassifications = classifications.slice(1);

                // Define button colors based on the level key
                let btnColorClass = "bg-blue-1 hover:bg-blue-600 text-white";
                if (key === "diagnosis") btnColorClass = "bg-red-1 hover:opacity-80 text-white";
                if (key === "subtype") btnColorClass = "bg-yellow-1 hover:opacity-80 text-gray-9"; // Text dark for yellow bg
                if (key === "stage") btnColorClass = "bg-purple-1 hover:opacity-80 text-white";

                return (
                  <div key={key} className="flex flex-col bg-gray-9 border-2 border-gray-6 rounded-lg overflow-hidden transition-all">
                    <button
                      className="flex items-center justify-between p-3 text-xs text-gray-1 font-bold hover:bg-gray-8 transition-colors"
                      onClick={() => setExpandedLevel(isExpanded ? null : key)}
                    >
                      {label}
                      <img 
                        src={ArrowUp} 
                        alt="Toggle" 
                        className={`transition-transform ${isExpanded ? '' : 'rotate-180'}`} 
                      />
                    </button>
                    
                    {isExpanded && topClassification && (
                      <div className="p-3 pt-0 flex flex-col gap-4">
                        
                        <div className="border-b-2 border-gray-2 mb-1 mt-1"></div>

                        {/* DIAGNOSIS LEVEL */}
                        {key === "diagnosis" && (
                          <>
                            <div>
                              <h4 className={`font-bold text-lg mb-1 ${isAbnormal ? 'text-red-1' : 'text-blue-1'}`}>
                                {formatHeaderName(topClassification[0])}
                              </h4>
                              <p className="text-white text-[13px] font-semibold">
                                AI Confidence : {(Number(topClassification[1]) * 100).toFixed(0)}%
                              </p>
                            </div>

                            <div className="bg-gray-7/80 p-2.5 text-gray-1 text-xs rounded-md">
                              {isAbnormal 
                                ? `Abnormal - Classified as ${formatHeaderName(topClassification[0])}` 
                                : 'Normal - No Lesions Classified'
                              }
                            </div>

                            <div>
                              <h5 className="text-white text-xs font-semibold mb-3">Other Possibilities :</h5>
                              <div className="flex flex-col gap-2.5 text-xs text-white font-medium">
                                {otherClassifications.map(([name, value]) => (
                                  <div key={name} className="flex items-center gap-2">
                                    <span className="min-w-[85px] text-[11px]">{formatPossibilityName(name)}</span>
                                    <div className="flex-1 h-1.5 bg-gray-5 rounded-full overflow-hidden">
                                      <div className="h-full bg-blue-1 rounded-full" style={{ width: `${Number(value) * 100}%` }}></div>
                                    </div>
                                    <span className="w-8 text-right text-[11px]">{(Number(value) * 100).toFixed(1)}%</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </>
                        )}

                        {/* SUBTYPE LEVEL */}
                        {key === "subtype" && (
                          <>
                            <div>
                              <h4 className={`font-bold text-lg mb-1 ${isAbnormal ? 'text-red-1' : 'text-blue-1'}`}>
                                {formatHeaderName(topClassification[0])}
                              </h4>
                              <p className="text-white text-[13px] font-semibold">
                                AI Confidence : {(Number(topClassification[1]) * 100).toFixed(1)}%
                              </p>
                            </div>

                            <div>
                              <h5 className="text-white text-xs font-semibold mb-3">Other Possibilities :</h5>
                              <div className="flex flex-col gap-2.5 text-xs text-white font-medium">
                                {otherClassifications.map(([name, value]) => (
                                  <div key={name} className="flex items-center gap-2">
                                    <span className="min-w-[85px] text-[11px]">{formatPossibilityName(name)}</span>
                                    <div className="flex-1 h-1.5 bg-gray-5 rounded-full overflow-hidden">
                                      <div className="h-full bg-yellow-400 rounded-full" style={{ width: `${Number(value) * 100}%` }}></div>
                                    </div>
                                    <span className="w-8 text-right text-[11px]">{(Number(value) * 100).toFixed(1)}%</span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Details Block */}
                            {data.details && (
                              <div>
                                <h5 className="text-white text-xs font-semibold mb-3 mt-1">Details</h5>
                                <div className="grid grid-cols-2 gap-2 mb-4">
                                  {Object.entries(data.details).map(([dKey, dVal]) => (
                                    <div key={dKey} className="text-white bg-gray-3 rounded-lg p-3 flex flex-col justify-center border border-gray-7">
                                      <span className="text-gray-1 text-[11px] mb-1">
                                        {formatDetailKey(dKey)}
                                      </span>
                                      <div className="flex items-baseline gap-1.5">
                                        <span className="font-bold text-[17px]">
                                          {String(dVal)}
                                        </span>
                                        <span className="text-gray-1 text-[11px]">
                                          {getMeasurementUnit(dKey)}
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>

                                {/* Other Details List */}
                                {data.other_details && (
                                  <div className="flex flex-col border-t border-gray-6 pt-1">
                                    {Object.entries(data.other_details).map(([odKey, odVal]) => (
                                      <div key={odKey} className="flex justify-between items-center py-2.5 border-b border-gray-6/50 last:border-0">
                                        <span className="text-gray-1 text-[11px]">
                                          {formatDetailKey(odKey)}
                                        </span>
                                        <span className="text-white text-[11px] font-medium capitalize">
                                          {String(odVal)}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </>
                        )}

                        {/* STAGE LEVEL */}
                        {key === "stage" && (
                           <>
                             <div>
                               <h4 className={`font-bold text-lg mb-1 ${isAbnormal ? 'text-red-1' : 'text-blue-1'}`}>
                                 {formatHeaderName(topClassification[0])}
                               </h4>
                               <p className="text-white text-[13px] font-semibold">
                                 AI Confidence : {(Number(topClassification[1]) * 100).toFixed(1)}%
                               </p>
                             </div>

                             {data.estimated_onset && (
                               <div className="bg-gray-7/80 p-2.5 text-gray-1 text-xs rounded-md">
                                 Estimated Onset: {data.estimated_onset.replace(/\b\w/g, (c: string) => c.toUpperCase())}
                               </div>
                             )}

                             <div>
                               <h5 className="text-white text-xs font-semibold mb-3 mt-3">Other Possibilities :</h5>
                               <div className="flex flex-col gap-2.5 text-xs text-white font-medium">
                                 {otherClassifications.map(([name, value]) => (
                                   <div key={name} className="flex items-center gap-2">
                                     <span className="min-w-[85px] text-[11px]">{formatPossibilityName(name)}</span>
                                     <div className="flex-1 h-1.5 bg-gray-5 rounded-full overflow-hidden">
                                       <div className="h-full bg-white rounded-full" style={{ width: `${Number(value) * 100}%` }}></div>
                                     </div>
                                     <span className="w-8 text-right text-[11px]">{(Number(value) * 100).toFixed(1)}%</span>
                                   </div>
                                 ))}
                               </div>
                             </div>
                           </>
                        )}

                        {/* Lokasi Deteksi (Slice Buttons) */}
                        <div>
                          <h5 className="text-white text-[11px] font-semibold mb-2 mt-2">Lokasi Deteksi :</h5>
                          <div className="flex gap-2 flex-wrap">
                            {data.important_slice?.map((slice: number) => (
                              <button 
                                key={slice} 
                                onClick={() => setCurrentFrame(slice)}
                                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-colors ${btnColorClass}`}
                              >
                                <img src={EyeIcon} alt="view" className={`w-[14px] h-[14px] ${key === 'subtype' ? 'brightness-0' : ''}`} />
                                #{slice}
                              </button>
                            ))}
                          </div>
                        </div>

                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="p-4 shrink-0 pb-8 md:pb-4 border-t-2 border-gray-6 bg-gray-10 z-10 relative">
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