// src/pages/PatientViewer.tsx
import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";

import Logo from "./assets/logo.png";

import ArrowLeft from "./assets/icons/gray/arrowLeft.svg";
import ArrowRight from "./assets/icons/gray/arrowRight.svg";
import ArrowUp from "./assets/icons/gray/arrowUp.svg";

import Border from "./assets/icons/gray/border.svg";
import Circle from "./assets/icons/gray/circle.svg";
import Draw from "./assets/icons/gray/draw.svg";

import Grid1 from "./assets/icons/gray/grid1.svg";
import Grid4 from "./assets/icons/gray/grid4.svg";
import Layer from "./assets/icons/gray/layer.svg";

import Mouse from "./assets/icons/blue/mouse.svg";
import Move from "./assets/icons/gray/move.svg";

import Redo from "./assets/icons/gray/redo.svg";
import Refresh from "./assets/icons/gray/refresh.svg";
import Ruler from "./assets/icons/gray/ruler.svg";

import Time from "./assets/icons/gray/time.svg";
import Undo from "./assets/icons/gray/undo.svg";
import Zoom from "./assets/icons/gray/zoom.svg";

const MAX_FRAMES = 300;
const PRELOAD_WINDOW = 10; // How many frames to load ahead/behind

// Helper function to dynamically resolve paths inside Vite's src/assets folder
const getImageUrl = (patientId: string, frameNumber: number) => {
  const formattedIndex = String(frameNumber).padStart(3, "0");
  return new URL(
    `./assets/pasien/${patientId}/ezgif-frame-${formattedIndex}.jpg`,
    import.meta.url,
  ).href;
};

export default function PatientViewer() {
  const { id } = useParams<{ id: string }>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [patient, setPatient] = useState<any>(null);

  // === IMAGE SEQUENCE STATE ===
  const [currentFrame, setCurrentFrame] = useState(1);
  const preloadedFrames = useRef<Set<number>>(new Set());
  const scrollAccumulator = useRef(0);

  // Ref for the image container to attach a non-passive wheel event
  const imageContainerRef = useRef<HTMLDivElement>(null);

  const patientModules = import.meta.glob("./constant/*.tsx");

  // Fetch Patient Data
  useEffect(() => {
    const fetchPatientData = async () => {
      try {
        const path = `./constant/${id}.tsx`;
        if (patientModules[path]) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const module = (await patientModules[path]()) as any;
          setPatient(module.patientData);
          // Set initial frame based on metadata if needed, otherwise starts at 1
          if (module.patientData.scanMetadata?.currentSlice) {
            setCurrentFrame(module.patientData.scanMetadata.currentSlice);
          }
        } else {
          console.error(`Data for patient ID ${id} not found at path: ${path}`);
        }
      } catch (err) {
        console.error("Failed to load patient data:", err);
      }
    };

    if (id) {
      fetchPatientData();
    }
  }, [id]);

  // === SMART IMAGE PRELOADER ===
  // === SMART IMAGE PRELOADER ===
  useEffect(() => {
    if (!id) return;

    // Calculate our "sliding window" of images to preload
    const minFrame = Math.max(1, currentFrame - PRELOAD_WINDOW);
    const maxFrame = Math.min(MAX_FRAMES, currentFrame + PRELOAD_WINDOW);

    for (let i = minFrame; i <= maxFrame; i++) {
      if (!preloadedFrames.current.has(i)) {
        const img = new Image();
        img.src = getImageUrl(id, i); // Use the helper here!
        // Mark as preloading/preloaded so we don't fetch it again
        preloadedFrames.current.add(i);
      }
    }
  }, [currentFrame, id]);

  // === NON-PASSIVE WHEEL SCROLL HANDLER ===
  useEffect(() => {
    const container = imageContainerRef.current;

    // If it's still loading, this is null. It will try again once patient data loads.
    if (!container) return;

    // We use a native event listener so we can set passive: false
    const handleNativeWheel = (e: WheelEvent) => {
      e.preventDefault(); // Now this successfully stops the page from scrolling!

      scrollAccumulator.current += e.deltaY;
      const sensitivityThreshold = 30;

      if (scrollAccumulator.current > sensitivityThreshold) {
        setCurrentFrame((prev) => Math.min(MAX_FRAMES, prev + 1));
        scrollAccumulator.current = 0;
      } else if (scrollAccumulator.current < -sensitivityThreshold) {
        setCurrentFrame((prev) => Math.max(1, prev - 1));
        scrollAccumulator.current = 0;
      }
    };

    // Attach event with passive: false
    container.addEventListener("wheel", handleNativeWheel, { passive: false });

    // Cleanup function
    return () => {
      container.removeEventListener("wheel", handleNativeWheel);
    };
  }, [patient]); 

  if (!patient) {
    return (
      <div className="min-h-screen bg-gray-11 flex items-center justify-center text-white">
        Loading...
      </div>
    );
  }

  // Get the properly formatted source for the current frame
  const currentImageSrc = getImageUrl(patient.id, currentFrame);

  return (
    <div className="min-h-screen flex flex-col bg-gray-11 font-['Plus_Jakarta_Sans'] overflow-hidden">
      {/* ================= TOP NAVBAR ================= */}
      <header className="h-16 bg-gray-10 border-b-3 border-gray-6 flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center">
          <button className="flex items-center bg-gray-8 hover:bg-gray-7 text-white text-sm px-6 py-2 rounded transition-colors">
            <img src={ArrowLeft} className="mr-2" alt="Back" /> Back
          </button>
        </div>

        <div className="flex items-center text-white text-lg font-bold">
          {patient.name} ({patient.age}/{patient.gender})
          <span className="text-gray-1 text-sm font-semibold ml-3">
            ID : {patient.patientId} | DOB : {patient.dob}
          </span>
        </div>

        <div className="flex flex-row items-end h-12">
          <div className="h-full">
            <div className="text-white font-bold tracking-wide text-right">
              iBrain2u
            </div>
            <div className="text-gray-1 text-[12px]">
              System deteksi gangguan otak berbasis AI
            </div>
          </div>
          <div className="h-full">
            <img src={Logo} className="ml-4 h-full" alt="Logo" />
          </div>
        </div>
      </header>

      {/* ================= MAIN CONTENT LAYOUT ================= */}
      <div className="flex flex-1 overflow-hidden">
        {/* === LEFT SIDEBAR: MODES === */}
        <aside className="w-24 items-center bg-gray-11 border-r-3 border-gray-6 flex flex-col gap-3 p-3 shrink-0">
          {["FLAIR", "T1 W", "T2 W", "DWI", "ADC"].map((mode) => (
            <button
              key={mode}
              className={`flex flex-col items-center justify-center text-white h-16 w-16 rounded border-3 ${
                mode === "T2 W"
                  ? "border-blue-1"
                  : "border-gray-5 hover:border-gray-3"
              }`}
            >
              <div className="w-full h-full bg-gray-6"></div>
              <span className="text-[10px] font-semibold py-1">{mode}</span>
            </button>
          ))}
        </aside>

        {/* === CENTER: IMAGE VIEWER === */}
        <main className="flex-1 flex flex-col relative bg-gray-11 min-h-0 min-w-0">
          {/* Top Viewer Toolbar */}
          <div className="h-12 border-b-0 border-gray-6 bg-gray-7 flex items-center justify-between px-4">
            <div className="flex items-center gap-4 w-7/10 text-gray-1">
              <button className="p-1 bg-gray-4 rounded h-8 w-8">
                <img src={Mouse} className="h-5 w-6.5" alt="Mouse" />
              </button>
              <button className="p-1">
                <img src={Move} className="h-5 w-6.5" alt="Move" />
              </button>
              <button className="p-1">
                <img src={Zoom} className="h-5 w-6.5" alt="Zoom" />
              </button>
              <button className="p-1">
                <img src={Layer} className="h-5 w-6.5" alt="Layer" />
              </button>
              <img src={Border} className="h-4 w-6.5" alt="Separator" />
              <button className="p-1">
                <img src={Grid1} className="h-5 w-6.5" alt="Grid1" />
              </button>
              <button className="p-1">
                <img src={Grid4} className="h-5 w-6.5" alt="Grid4" />
              </button>
              <button className="p-1">
                <img src={Undo} className="h-5 w-6.5" alt="Undo" />
              </button>
              <button className="p-1">
                <img src={Redo} className="h-5 w-6.5" alt="Redo" />
              </button>
              <img src={Border} className="h-4 w-6.5" alt="Separator" />
              <button className="p-1">
                <img src={Ruler} className="h-5 w-6.5" alt="Ruler" />
              </button>
              <button className="p-1">
                <img src={Draw} className="h-5 w-6.5" alt="Draw" />
              </button>
              <button className="p-1">
                <img src={ArrowRight} className="h-5 w-6.5" alt="Arrow" />
              </button>
              <button className="p-1">
                <img src={Circle} className="h-5 w-6.5" alt="Circle" />
              </button>
              <button className="p-1">
                <img src={Refresh} className="h-5 w-6.5" alt="Refresh" />
              </button>
            </div>

            <div className="flex w-2/10 text-[11px] justify-between px-4 font-semibold text-white bg-gray-10 h-9 border-gray-5 border-3 rounded gap-4">
              <button className="flex-1 hover:text-white">AXIAL</button>
              <button className="flex-1 hover:text-white">SAGITTAL</button>
              <button className="flex-1 hover:text-white">CORONAL</button>
            </div>
          </div>

          {/* Sub-toolbar (AI Overlay & Slice info) */}
          <div className="flex items-center justify-between px-4 py-4 absolute top-12 left-0 right-0 z-10 pointer-events-none">
            <div className="flex items-center gap-2 pointer-events-auto">
              <div className="flex flex-row justify-between text-xs text-white bg-gray-3 border-gray-3 border-3 rounded">
                <div className="bg-gray-3 border-gray-3 rounded-l items-center my-auto mx-3">
                  AI Overlay
                </div>
                <div className="flex bg-gray-10 rounded-r overflow-hidden text-xs">
                  <button className="w-1/2 text-white px-2 py-1">ON</button>
                  <button className="w-1/2 text-gray-1 px-2 py-1 hover:bg-gray-7">
                    OFF
                  </button>
                </div>
              </div>
            </div>
            {/* UPDATED SLICE TRACKER */}
            <div className="text-white text-sm pointer-events-auto font-medium">
              Slice : {currentFrame} / {MAX_FRAMES}
            </div>
          </div>

          {/* === ACTUAL SCAN IMAGE AREA === */}
          <div
            ref={imageContainerRef}
            // 2. Add min-h-0 here as well so this specific flex box can shrink
            className="flex-1 flex items-center justify-center p-8 overflow-hidden relative cursor-ns-resize min-h-0"
          >
            <img
              src={currentImageSrc}
              alt={`Brain Scan Slice ${currentFrame}`}
              // 3. Use max-w-full max-h-full so it perfectly scales down while maintaining aspect ratio
              className="w-3/4 h-3/4 object-contain select-none"
              draggable="false"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                if (target.dataset.error) return;
                target.dataset.error = "true";
                target.src =
                  "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='600' viewBox='0 0 600 600'%3E%3Crect width='600' height='600' fill='%23141414'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='24' fill='%23444444'%3EScan Missing%3C/text%3E%3C/svg%3E";
              }}
            />
          </div>

          {/* Bottom Info & Navigation */}
          <div className="absolute bottom-4 left-4 text-yellow-1 text-xs font-semibold leading-relaxed pointer-events-none">
            <div>
              WW : {patient.scanMetadata.ww} &nbsp; WL :{" "}
              {patient.scanMetadata.wl}
            </div>
            <div>ZOOM : {patient.scanMetadata.zoom}</div>
            <div>THICKNESS : {patient.scanMetadata.thickness}</div>
          </div>

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex border border-gray-6 rounded bg-gray-10 text-xs font-semibold">
            <button className="flex-1 px-8 py-2 bg-gray-6 text-white rounded-l whitespace-nowrap">
              AI MODEL
            </button>
            <button className="flex-1 px-8 py-2 text-gray-1 hover:text-white">
              RAW
            </button>
            <button className="flex-1 px-8 py-2 text-gray-1 hover:text-white">
              JASMINE
            </button>
            <button className="flex-1 px-8 py-2 text-gray-1 hover:text-white">
              SYNTHSEG
            </button>
            <button className="flex-1 px-8 py-2 text-gray-1 hover:text-white rounded-r">
              PALAPA
            </button>
          </div>
        </main>

        {/* === RIGHT SIDEBAR: AI ANALYSIS === */}
        <aside className="w-80 bg-gray-10 border-l-3 border-gray-6 flex flex-col shrink-0">
          <div className="">
            <div className="h-12 flex text-red-1 text-sm font-bold tracking-widest border-b-3 border-b-gray-6">
              <div className="bg-red-1 h-[45.5px] w-1 relative -left-[2.5px]"></div>
              <div className="h-full items-center flex pl-4">
                AI ANALYSIS RESULTS
              </div>
            </div>

            <div className="p-4">
              <div className="bg-gray-9 border-2 border-gray-7 rounded-lg p-4 mb-6">
                <h3 className="text-gray-1 text-xs font-semibold mb-3">
                  INFORMASI PASIEN
                </h3>
                <div className="border-b-2 border-gray-2 mb-3"></div>
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

              {/* Accordions placeholders */}
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

            <div className="p-4 mt-auto">
              <div className="border-2 border-gray-5 rounded-lg p-4 bg-gray-11">
                <h3 className="text-white text-xs font-bold mb-3">
                  VERIFIKASI DOKTER
                </h3>
                <div className="bg-gray-8 text-gray-1 text-xs p-3 rounded flex items-center gap-2 mb-3 border-2 border-gray-5">
                  <span>🕒</span> {patient.verificationStatus}
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
      </div>
    </div>
  );
}
