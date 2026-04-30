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

  return (
    <main className="flex-1 flex flex-col relative bg-gray-11 min-h-0 min-w-0">
      
      <Toolbar 
        axis={axis} 
        setAxis={setAxis} 
        currentFrame={currentFrame} 
        maxFrames={maxFrames} 
        activeTool={activeTool}            // Passed down
        setActiveTool={setActiveTool}      // Passed down
        zoomLevel={zoomLevel}
        setZoomLevel={setZoomLevel}
        setIsMagnifierOpen={setIsMagnifierOpen}
      />

      <ViewerCanvas 
        activeImageSrc={activeImageSrc} 
        currentFrame={currentFrame} 
        maxFrames={maxFrames} 
        setCurrentFrame={setCurrentFrame} 
        activeTool={activeTool}            // Passed down! This fixes your TS Error.
        zoomLevel={zoomLevel}
        isMagnifierOpen={isMagnifierOpen}
        setIsMagnifierOpen={setIsMagnifierOpen}
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