// src/components/MainViewerArea.tsx
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
  
  return (
    <main className="flex-1 flex flex-col relative bg-gray-11 min-h-0 min-w-0">
      
      <Toolbar 
        axis={axis} 
        setAxis={setAxis} 
        currentFrame={currentFrame} 
        maxFrames={maxFrames} 
      />

      <ViewerCanvas 
        activeImageSrc={activeImageSrc} 
        currentFrame={currentFrame} 
        maxFrames={maxFrames} 
        setCurrentFrame={setCurrentFrame} 
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