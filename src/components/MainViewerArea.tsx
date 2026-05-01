// src/components/MainViewerArea.tsx
import { useState } from "react";
import Toolbar from "./Toolbar";
import ViewerCanvas from "./ViewerCanvas";
import ImportantSlider from "./ImportantSlider";

interface MainViewerAreaProps {
  axis: "axial" | "sagittal" | "coronal";
  setAxis: (axis: "axial" | "sagittal" | "coronal") => void;
  currentFrame: number;
  setCurrentFrame: React.Dispatch<React.SetStateAction<number>>;
  maxFrames: number;
  activeImageSrc: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  patient: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  analysisData?: any;
}

export default function MainViewerArea({
  axis,
  setAxis,
  currentFrame,
  setCurrentFrame,
  maxFrames,
  activeImageSrc,
  patient,
  analysisData,
}: MainViewerAreaProps) {
  
  // NEW: State to track which tool is currently selected
  const [activeTool, setActiveTool] = useState<string>("move");

  // NEW: Zoom & Magnifier States
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [isMagnifierOpen, setIsMagnifierOpen] = useState<boolean>(false);

  // Default brightness is 1 (100%), default contrast is 1 (100%)
  const [windowLevel, setWindowLevel] = useState({ brightness: 1, contrast: 1 });
  
  const [flipState, setFlipState] = useState({ horizontal: false, vertical: false });
  const [activeFlipMode, setActiveFlipMode] = useState<"horizontal" | "vertical">("horizontal");

  return (
    <main className="flex-1 flex flex-col relative bg-black min-h-0 min-w-0">
      
      <Toolbar 
        axis={axis} 
        setAxis={setAxis} 
        currentFrame={currentFrame} 
        maxFrames={maxFrames} 
        activeTool={activeTool}
        setActiveTool={setActiveTool}
        zoomLevel={zoomLevel}
        setZoomLevel={setZoomLevel}
        setIsMagnifierOpen={setIsMagnifierOpen}
        flipState={flipState}
        activeFlipMode={activeFlipMode}
        setFlipState={setFlipState}
        setActiveFlipMode={setActiveFlipMode}
      />

      <ViewerCanvas 
        activeImageSrc={activeImageSrc} currentFrame={currentFrame} maxFrames={maxFrames} setCurrentFrame={setCurrentFrame} 
        activeTool={activeTool} zoomLevel={zoomLevel} isMagnifierOpen={isMagnifierOpen} setIsMagnifierOpen={setIsMagnifierOpen}
        // Pass the new state down
        windowLevel={windowLevel} setWindowLevel={setWindowLevel} flipState={flipState}
      />

      <ImportantSlider 
        currentFrame={currentFrame} 
        setCurrentFrame={setCurrentFrame} 
        maxFrames={maxFrames} 
        analysisData={analysisData} 
      />

      {/* Bottom Info Overlay */}
      <div className="absolute bottom-12 md:bottom-4 left-4 text-yellow-1 text-xs font-semibold leading-relaxed pointer-events-none z-10">
        <div>
          WW : {patient?.scanMetadata?.ww} &nbsp; WL : {patient?.scanMetadata?.wl}
        </div>
        <div>ZOOM : {patient?.scanMetadata?.zoom}</div>
        <div>THICKNESS : {patient?.scanMetadata?.thickness}</div>
      </div>
      
    </main>
  );
}