// src/components/MainViewerArea.tsx
import { useState, useEffect, useRef } from "react";
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
  getFrameImageSrc?: (frame: number) => string; 
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  patient: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  analysisData?: any;
}

export default function MainViewerArea({
  axis, setAxis,
  currentFrame, setCurrentFrame,
  maxFrames, activeImageSrc, getFrameImageSrc,
  patient, analysisData,
}: MainViewerAreaProps) {
  
  const [activeTool, setActiveTool] = useState<string>("move");
  const [isMagnifierOpen, setIsMagnifierOpen] = useState<boolean>(false);
  const [activeFlipMode, setActiveFlipMode] = useState<"horizontal" | "vertical">("horizontal");
  const [layout, setLayout] = useState<string>("full");
  const [activeViewport, setActiveViewport] = useState<number>(0);

  // --- FIX #1: Use Array.from to create 4 INDEPENDENT object references ---
  const [viewports, setViewports] = useState(() => 
    Array.from({ length: 4 }, () => ({
      zoomLevel: 1,
      windowLevel: { brightness: 1, contrast: 1 },
      flipState: { horizontal: false, vertical: false },
      isInverted: false,
      rotation: 0,
      localFrame: currentFrame
    }))
  );

  // --- IMAGE CACHE: Stores previously loaded slices so inactive windows don't lose their images ---
  const [imageCache, setImageCache] = useState<Record<number, string>>({});
  
  useEffect(() => {
    if (activeImageSrc) {
      setImageCache(prev => ({...prev, [currentFrame]: activeImageSrc}));
    }
  }, [currentFrame, activeImageSrc]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateViewport = (index: number, key: string, valueOrUpdater: any) => {
    setViewports(prev => {
      const newStates = [...prev];
      const currentValue = newStates[index][key as keyof typeof newStates[0]];
      const newValue = typeof valueOrUpdater === 'function' ? valueOrUpdater(currentValue) : valueOrUpdater;
      newStates[index] = { ...newStates[index], [key]: newValue };
      return newStates;
    });
  };

  // --- SMART FRAME SYNCING ---
  const lastInternalUpdate = useRef<number>(-1);

  const handleLocalFrameChange = (index: number, val: number | ((prev: number) => number)) => {
    const vp = viewports[index];
    const newValue = typeof val === 'function' ? val(vp.localFrame) : val;
    
    lastInternalUpdate.current = newValue; // Mark that WE caused this change
    updateViewport(index, 'localFrame', newValue);
    setCurrentFrame(newValue); // Always notify parent so it fetches the new image!
  };

  useEffect(() => {
    // Only force active window to jump if the PARENT caused the change (e.g. anomaly list clicked)
    if (currentFrame !== lastInternalUpdate.current) {
      updateViewport(activeViewport, 'localFrame', currentFrame);
    }
  }, [currentFrame, activeViewport]);


  const activeState = viewports[activeViewport] || viewports[0];

  const renderViewport = (index: number, containerClass: string = "") => {
    const vp = viewports[index];
    const isSelected = activeViewport === index;

    // Give priority to user's function, then our cache, then fallback to current parent image
    const imageSrcForThisWindow = getFrameImageSrc 
      ? getFrameImageSrc(vp.localFrame) 
      : (imageCache[vp.localFrame] || (vp.localFrame === currentFrame ? activeImageSrc : ""));

    return (
      <div 
        key={index}
        onPointerDownCapture={() => {
          if (activeTool === "mouse") setActiveViewport(index);
        }}
        className={`relative overflow-hidden flex flex-col bg-gray-11 w-full h-full min-h-0 min-w-0 ${containerClass}`}
      >
        <ViewerCanvas 
          activeImageSrc={imageSrcForThisWindow} 
          currentFrame={vp.localFrame} 
          maxFrames={maxFrames} 
          setCurrentFrame={(val) => handleLocalFrameChange(index, val)} 
          activeTool={activeTool} 
          zoomLevel={vp.zoomLevel} 
          setZoomLevel={(val) => updateViewport(index, 'zoomLevel', val)} 
          isMagnifierOpen={isMagnifierOpen && isSelected} 
          setIsMagnifierOpen={setIsMagnifierOpen} 
          windowLevel={vp.windowLevel} 
          setWindowLevel={(val) => updateViewport(index, 'windowLevel', val)} 
          flipState={vp.flipState} 
          isInverted={vp.isInverted} 
          rotation={vp.rotation}
        />

        {/* --- FIX #3: Border Overlay moved AFTER canvas so it renders completely on top! --- */}
        <div className={`absolute inset-0 pointer-events-none z-50 transition-colors ${isSelected ? 'border-2 border-blue-500' : 'border border-gray-6'}`} />

        <div className="absolute bottom-6 left-0 right-0 w-[90%] mx-auto z-20 pointer-events-auto">
          <ImportantSlider 
            currentFrame={vp.localFrame} 
            setCurrentFrame={(val) => handleLocalFrameChange(index, val)} 
            maxFrames={maxFrames} 
            analysisData={analysisData} 
          />
        </div>

        <div className="absolute bottom-1 left-2 text-yellow-1 text-[10px] sm:text-xs font-semibold leading-relaxed pointer-events-none z-20">
          <div>WW : {patient?.scanMetadata?.ww} &nbsp; WL : {patient?.scanMetadata?.wl}</div>
          <div>ZOOM : {vp.zoomLevel.toFixed(1)}X</div>
          <div>THICKNESS : {patient?.scanMetadata?.thickness}</div>
        </div>
      </div>
    );
  };

  const renderGrid = () => {
    switch(layout) {
      case "vertical": return <div className="flex-1 grid grid-cols-2 grid-rows-1 min-h-0">{renderViewport(0)} {renderViewport(1)}</div>;
      case "horizontal": return <div className="flex-1 grid grid-cols-1 grid-rows-2 min-h-0">{renderViewport(0)} {renderViewport(1)}</div>;
      case "1+2": return <div className="flex-1 grid grid-cols-2 grid-rows-2 min-h-0">{renderViewport(0, "row-span-2")} {renderViewport(1)} {renderViewport(2)}</div>;
      case "2+1": return <div className="flex-1 grid grid-cols-2 grid-rows-2 min-h-0">{renderViewport(0, "col-start-1 row-start-1")} {renderViewport(1, "col-start-1 row-start-2")} {renderViewport(2, "col-start-2 row-start-1 row-span-2")}</div>;
      case "2x2": return <div className="flex-1 grid grid-cols-2 grid-rows-2 min-h-0">{renderViewport(0)}{renderViewport(1)}{renderViewport(2)}{renderViewport(3)}</div>;
      case "3x1": return <div className="flex-1 grid grid-cols-3 grid-rows-1 min-h-0">{renderViewport(0)}{renderViewport(1)}{renderViewport(2)}</div>;
      case "full":
      default: return <div className="flex-1 flex min-h-0">{renderViewport(0, "flex-1")}</div>;
    }
  };

  return (
    <main className="flex-1 flex flex-col relative bg-gray-11 min-h-0 min-w-0">
      <Toolbar 
        axis={axis} setAxis={setAxis} currentFrame={activeState.localFrame} maxFrames={maxFrames} 
        activeTool={activeTool} setActiveTool={setActiveTool} 
        activeFlipMode={activeFlipMode} setActiveFlipMode={setActiveFlipMode}
        layout={layout} setLayout={setLayout}
        zoomLevel={activeState.zoomLevel} setZoomLevel={(val) => updateViewport(activeViewport, 'zoomLevel', val)} 
        flipState={activeState.flipState} setFlipState={(val) => updateViewport(activeViewport, 'flipState', val)} 
        isInverted={activeState.isInverted} setIsInverted={(val) => updateViewport(activeViewport, 'isInverted', val)} 
        rotation={activeState.rotation} setRotation={(val) => updateViewport(activeViewport, 'rotation', val)}
        setIsMagnifierOpen={setIsMagnifierOpen} 
      />

      <div className="flex items-center justify-between px-4 py-4 absolute top-12 left-0 right-0 z-10 pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto">
          <div className="flex flex-row justify-between text-xs text-white bg-gray-3 border-gray-3 border-3 rounded">
            <div className="bg-gray-3 border-gray-3 rounded-l items-center my-auto mx-3 hidden sm:block">AI Overlay</div>
            <div className="flex bg-gray-10 rounded-r overflow-hidden text-xs">
              <button className="w-1/2 text-white px-2 py-1">ON</button>
              <button className="w-1/2 text-gray-1 px-2 py-1 hover:bg-gray-7">OFF</button>
            </div>
          </div>
        </div>
      </div>

      {renderGrid()}
    </main>
  );
}