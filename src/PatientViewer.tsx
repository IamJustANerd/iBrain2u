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

const PRELOAD_WINDOW = 2;
const SERVER_URL = "http://127.0.0.1:8000"; // FastAPI server address

export default function PatientViewer() {
  const { id } = useParams<{ id: string }>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [patient, setPatient] = useState<any>(null);

  // === SERVER STATE ===
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [serverMeta, setServerMeta] = useState<any>(null);
  const [axis, setAxis] = useState<"axial" | "sagittal" | "coronal">("axial");
  const [maxFrames, setMaxFrames] = useState(100);

  // === IMAGE SEQUENCE STATE ===
  const [currentFrame, setCurrentFrame] = useState(1);
  const preloadedFrames = useRef<Set<string>>(new Set());
  const scrollAccumulator = useRef(0);
  const imageContainerRef = useRef<HTMLDivElement>(null);

  // === BOTTOM SHEET DRAG STATE ===
  const [sheetHeight, setSheetHeight] = useState(96);
  const [isDragging, setIsDragging] = useState(false);

  const patientModules = import.meta.glob("./constant/*.tsx");

  // Dynamic Image URL Generator
  const getActiveImageUrl = (frameIdx: number, currentAxis: string) => {
    if (!sessionId || !serverMeta) return "";
    const seqCode = serverMeta.sequences[0]; // Usually SEQ001
    // API is 0-indexed, UI is 1-indexed
    const sliceIdx = Math.max(0, frameIdx - 1);
    return `${SERVER_URL}/view/${sessionId}/${seqCode}/${currentAxis}/${sliceIdx}`;
  };

  // Fetch Patient Demographics & Open Server Session
  useEffect(() => {
    const fetchPatientData = async () => {
      try {
        const path = `./constant/${id}.tsx`;
        if (patientModules[path]) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const module = (await patientModules[path]()) as any;
          setPatient(module.patientData);
        }
      } catch (err) {
        console.error("Failed to load patient data:", err);
      }
    };

    const initServerSession = async () => {
      try {
        const res = await fetch(`${SERVER_URL}/open`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            pacsid: id || "UNKNOWN",
            date: new Date().toISOString(),
          }),
        });
        if (!res.ok) throw new Error("Failed to open server session");

        const data = await res.json();
        setSessionId(data.session_id);
        setServerMeta(data);

        // Calculate max frames for default 'axial' axis
        if (data.sequences && data.sequences.length > 0) {
          const shape = data.analyses[data.sequences[0]].shape;
          const initialMax = shape[2]; // Axial is index 2
          setMaxFrames(initialMax);
          setCurrentFrame(Math.floor(initialMax / 2)); // Start in the middle of the brain
        }
      } catch (err) {
        console.error("Server connection error:", err);
      }
    };

    if (id) {
      fetchPatientData();
      initServerSession();
    }
  }, [id]);

  // Handle Axis Switching
  useEffect(() => {
    if (serverMeta) {
      const shape = serverMeta.analyses[serverMeta.sequences[0]].shape;
      // Map based on python logic: axial=2, coronal=1, sagittal=0
      let newMax = 100;
      if (axis === "axial") newMax = shape[2];
      if (axis === "coronal") newMax = shape[1];
      if (axis === "sagittal") newMax = shape[0];

      setMaxFrames(newMax);
      setCurrentFrame(Math.floor(newMax / 2)); // Reset to middle slice when switching view
      preloadedFrames.current.clear(); // Clear cache for new axis
    }
  }, [axis, serverMeta]);

  // === SMART IMAGE PRELOADER ===
  useEffect(() => {
    if (!sessionId) return;

    const minFrame = Math.max(1, currentFrame - PRELOAD_WINDOW);
    const maxFrame = Math.min(maxFrames, currentFrame + PRELOAD_WINDOW);

    for (let i = minFrame; i <= maxFrame; i++) {
      const cacheKey = `${axis}-${i}`;
      if (!preloadedFrames.current.has(cacheKey)) {
        const img = new Image();
        img.src = getActiveImageUrl(i, axis);
        preloadedFrames.current.add(cacheKey);
      }
    }
  }, [currentFrame, sessionId, axis, maxFrames]);

  // === NON-PASSIVE WHEEL SCROLL HANDLER ===
  useEffect(() => {
    const container = imageContainerRef.current;
    if (!container) return;

    const handleNativeWheel = (e: WheelEvent) => {
      e.preventDefault();
      scrollAccumulator.current += e.deltaY;
      const sensitivityThreshold = 30;

      if (scrollAccumulator.current > sensitivityThreshold) {
        setCurrentFrame((prev) => Math.min(maxFrames, prev + 1));
        scrollAccumulator.current = 0;
      } else if (scrollAccumulator.current < -sensitivityThreshold) {
        setCurrentFrame((prev) => Math.max(1, prev - 1));
        scrollAccumulator.current = 0;
      }
    };

    container.addEventListener("wheel", handleNativeWheel, { passive: false });
    return () => {
      container.removeEventListener("wheel", handleNativeWheel);
    };
  }, [maxFrames]); // Dependency updated to maxFrames

  // === BOTTOM SHEET DRAG HANDLER ===
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
      {/* ================= TOP NAVBAR ================= */}
      <header className="h-12 sm:h-16 bg-gray-10 border-b-3 border-gray-6 flex items-center justify-between px-4 shrink-0 z-10">
        <div className="flex items-center">
          <button className="flex items-center bg-gray-8 hover:bg-gray-7 text-white text-[10px] sm:text-sm px-3 py-1 sm:px-6 sm:py-2 rounded transition-colors">
            <img
              src={ArrowLeft}
              className="mr-2 w-1/4 h-1/4 sm:w-auto sm:h-auto"
              alt="Back"
            />{" "}
            Back
          </button>
        </div>

        <div className="flex items-center text-white text-[12px] sm:text-lg font-bold">
          {patient.name} ({patient.age}/{patient.gender})
          <span className="text-gray-1 text-sm font-semibold ml-3 hidden md:inline">
            ID : {patient.patientId} | DOB : {patient.dob}
          </span>
        </div>

        <div className="flex flex-row items-end h-8 sm:h-12">
          <div className="h-full hidden sm:block">
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
      <div className="flex flex-col md:flex-row flex-1 overflow-hidden relative">
        <div className="flex flex-1 overflow-hidden min-h-0 w-full">
          {/* === LEFT SIDEBAR: MODES === */}
          <aside className="w-16 sm:w-24 items-center bg-gray-11 border-r-3 border-gray-6 flex flex-col gap-3 p-3 shrink-0">
            {["FLAIR", "T1 W", "T2 W", "DWI", "ADC"].map((mode) => (
              <button
                key={mode}
                className={`flex flex-col items-center justify-center text-white h-12 sm:h-16 w-12 sm:w-16 rounded border-3 ${
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
            <div className="h-8 sm:h-12 border-b-0 border-gray-6 bg-gray-7 flex items-center justify-between px-4 overflow-x-auto">
              <div className="flex items-center gap-4 text-gray-1 shrink-0">
                <button className="p-1 bg-gray-4 rounded h-5 w-5 sm:h-8 sm:w-8 shrink-0">
                  <img
                    src={Mouse}
                    className="h-3 w-4.5 sm:h-5 sm:w-6.5"
                    alt="Mouse"
                  />
                </button>
                <button className="p-1 shrink-0">
                  <img
                    src={Move}
                    className="h-3 w-4.5 sm:h-5 sm:w-6.5"
                    alt="Move"
                  />
                </button>
                <button className="p-1 shrink-0">
                  <img
                    src={Zoom}
                    className="h-3 w-4.5 sm:h-5 sm:w-6.5"
                    alt="Zoom"
                  />
                </button>
                <button className="p-1 shrink-0">
                  <img
                    src={Layer}
                    className="h-3 w-4.5 sm:h-5 sm:w-6.5"
                    alt="Layer"
                  />
                </button>
                <img
                  src={Border}
                  className="h-3 w-4.5 sm:h-5 sm:w-6.5"
                  alt="Separator"
                />
                <button className="p-1 shrink-0">
                  <img
                    src={Grid1}
                    className="h-3 w-4.5 sm:h-5 sm:w-6.5"
                    alt="Grid1"
                  />
                </button>
                <button className="p-1 shrink-0">
                  <img
                    src={Grid4}
                    className="h-3 w-4.5 sm:h-5 sm:w-6.5"
                    alt="Grid4"
                  />
                </button>
                <button className="p-1 shrink-0">
                  <img
                    src={Undo}
                    className="h-3 w-4.5 sm:h-5 sm:w-6.5"
                    alt="Undo"
                  />
                </button>
                <button className="p-1 shrink-0">
                  <img
                    src={Redo}
                    className="h-3 w-4.5 sm:h-5 sm:w-6.5"
                    alt="Redo"
                  />
                </button>
                <img
                  src={Border}
                  className="h-3 w-4.5 sm:h-5 sm:w-6.5"
                  alt="Separator"
                />
                <button className="p-1 shrink-0">
                  <img
                    src={Ruler}
                    className="h-3 w-4.5 sm:h-5 sm:w-6.5"
                    alt="Ruler"
                  />
                </button>
                <button className="p-1 shrink-0">
                  <img
                    src={Draw}
                    className="h-3 w-4.5 sm:h-5 sm:w-6.5"
                    alt="Draw"
                  />
                </button>
                <button className="p-1 shrink-0">
                  <img
                    src={ArrowRight}
                    className="h-3 w-4.5 sm:h-5 sm:w-6.5"
                    alt="Arrow"
                  />
                </button>
                <button className="p-1 shrink-0">
                  <img
                    src={Circle}
                    className="h-3 w-4.5 sm:h-5 sm:w-6.5"
                    alt="Circle"
                  />
                </button>
                <button className="p-1 shrink-0">
                  <img
                    src={Refresh}
                    className="h-3 w-4.5 sm:h-5 sm:w-6.5"
                    alt="Refresh"
                  />
                </button>
              </div>

              {/* VIEW SWITCHER */}
              <div className="hidden lg:flex w-2/10 text-[11px] justify-between px-4 font-semibold text-white bg-gray-10 h-9 border-gray-5 border-3 rounded gap-4 ml-4 shrink-0">
                <button
                  className={`flex-1 ${axis === "axial" ? "text-blue-400" : "hover:text-white"}`}
                  onClick={() => setAxis("axial")}
                >
                  AXIAL
                </button>
                <button
                  className={`flex-1 ${axis === "sagittal" ? "text-blue-400" : "hover:text-white"}`}
                  onClick={() => setAxis("sagittal")}
                >
                  SAGITTAL
                </button>
                <button
                  className={`flex-1 ${axis === "coronal" ? "text-blue-400" : "hover:text-white"}`}
                  onClick={() => setAxis("coronal")}
                >
                  CORONAL
                </button>
              </div>
            </div>

            {/* Sub-toolbar */}
            <div className="flex items-center justify-between px-4 py-4 absolute top-12 left-0 right-0 z-10 pointer-events-none">
              <div className="flex items-center gap-2 pointer-events-auto">
                <div className="flex flex-row justify-between text-xs text-white bg-gray-3 border-gray-3 border-3 rounded">
                  <div className="bg-gray-3 border-gray-3 rounded-l items-center my-auto mx-3 hidden sm:block">
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
              <div className="text-white text-sm pointer-events-auto font-medium">
                Slice : {currentFrame} / {maxFrames}
              </div>
            </div>

            {/* === ACTUAL SCAN IMAGE AREA === */}
            <div
              ref={imageContainerRef}
              className="flex-1 flex items-center justify-center sm:p-8 px-8 pb-8 pt-16 overflow-hidden relative cursor-ns-resize min-h-0"
            >
              <img
                src={getActiveImageUrl(currentFrame, axis)}
                alt={`Brain Scan Slice ${currentFrame}`}
                className="sm:w-3/4 sm:h-3/4 sm:object-contain select-none"
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
            <div className="absolute bottom-20 md:bottom-4 left-4 text-yellow-1 text-xs font-semibold leading-relaxed pointer-events-none z-10">
              <div>
                WW : {patient.scanMetadata.ww} &nbsp; WL :{" "}
                {patient.scanMetadata.wl}
              </div>
              <div>ZOOM : {patient.scanMetadata.zoom}</div>
              <div>THICKNESS : {patient.scanMetadata.thickness}</div>
            </div>

            <div className="absolute bottom-4 left-4 right-4 md:left-1/2 md:right-auto md:-translate-x-1/2 flex border border-gray-6 rounded bg-gray-10 text-xs font-semibold overflow-x-auto z-10">
              <button className="px-4 py-2 bg-gray-6 text-white whitespace-nowrap shrink-0">
                AI MODEL
              </button>
              <button className="px-4 py-2 text-gray-1 hover:text-white whitespace-nowrap shrink-0">
                RAW
              </button>
              <button className="px-4 py-2 text-gray-1 hover:text-white whitespace-nowrap shrink-0">
                JASMINE
              </button>
              <button className="px-4 py-2 text-gray-1 hover:text-white whitespace-nowrap shrink-0">
                SYNTHSEG
              </button>
              <button className="px-4 py-2 text-gray-1 hover:text-white whitespace-nowrap shrink-0">
                PALAPA
              </button>
            </div>
          </main>
        </div>

        {/* === RIGHT SIDEBAR: AI ANALYSIS === */}
        <aside
          className="w-full bg-gray-10 border-t-3 border-gray-6 flex flex-col shrink-0 z-50 overflow-hidden md:w-80 h-[var(--sheet-height)] md:h-full md:border-t-0 md:border-l-3 rounded-t-2xl md:rounded-none transition-none"
          style={
            { "--sheet-height": `${sheetHeight}px` } as React.CSSProperties
          }
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
                  <img src={Time} alt="Time"></img> {patient.verificationStatus}
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
