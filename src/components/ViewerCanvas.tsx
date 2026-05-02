import { useEffect, useRef, useState } from "react";

interface ViewerCanvasProps {
  activeImageSrc: string;
  currentFrame: number;
  maxFrames: number;
  setCurrentFrame: React.Dispatch<React.SetStateAction<number>>;
  activeTool: string;
  zoomLevel: number;
  setZoomLevel: React.Dispatch<React.SetStateAction<number>>;
  isMagnifierOpen: boolean;
  setIsMagnifierOpen: (isOpen: boolean) => void;
  windowLevel: { brightness: number; contrast: number };
  setWindowLevel: React.Dispatch<React.SetStateAction<{ brightness: number; contrast: number }>>;
  flipState: { horizontal: boolean; vertical: boolean };
  isInverted: boolean;
  rotation: number;
}

export default function ViewerCanvas({
  activeImageSrc,
  currentFrame,
  maxFrames,
  setCurrentFrame,
  activeTool,
  zoomLevel,
  setZoomLevel,
  isMagnifierOpen,
  setIsMagnifierOpen,
  windowLevel,
  setWindowLevel,
  flipState,
  isInverted,
  rotation
}: ViewerCanvasProps) {
  const scrollAccumulator = useRef(0);
  const imageContainerRef = useRef<HTMLDivElement>(null);

  // --- Pan / Move Tool State ---
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });

  // --- Window Level Tool State ---
  const initialWindowLevel = useRef({ brightness: 1, contrast: 1 });
  
  // --- Magnifier Container Size ---
  const [containerSize, setContainerSize] = useState({ w: 0, h: 0 });

  // Reset Pan when "Zoom to Fit" is clicked
  useEffect(() => {
    if (zoomLevel === 1) {
      setPanOffset({ x: 0, y: 0 });
    }
  }, [zoomLevel]);

  // --- Main Canvas Mouse Handlers ---
  const handleMouseDown = (e: React.MouseEvent) => {
    if (activeTool !== "move" && activeTool !== "windowLevel") return;
    
    setIsDragging(true);
    
    if (activeTool === "move") {
      dragStart.current = {
        x: e.clientX - panOffset.x,
        y: e.clientY - panOffset.y,
      };
    } else if (activeTool === "windowLevel") {
      dragStart.current = { x: e.clientX, y: e.clientY };
      initialWindowLevel.current = { ...windowLevel };
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;

    if (activeTool === "move") {
      setPanOffset({
        x: e.clientX - dragStart.current.x,
        y: e.clientY - dragStart.current.y,
      });
    } else if (activeTool === "windowLevel") {
      const deltaX = e.clientX - dragStart.current.x;
      const deltaY = e.clientY - dragStart.current.y;

      const brightnessSensitivity = 0.005; 
      const contrastSensitivity = 0.005;

      const newBrightness = Math.max(0, initialWindowLevel.current.brightness - (deltaY * brightnessSensitivity));
      const newContrast = Math.max(0, initialWindowLevel.current.contrast + (deltaX * contrastSensitivity));

      setWindowLevel({
        brightness: newBrightness,
        contrast: newContrast,
      });
    }
  };

  const handleMouseUpOrLeave = () => {
    if (isDragging) setIsDragging(false);
  };

  // --- Resize Observer & Wheel Scroll ---
  useEffect(() => {
    const container = imageContainerRef.current;
    if (!container) return;

    const observer = new ResizeObserver(() => {
      const rect = container.getBoundingClientRect();
      setContainerSize({ w: rect.width, h: rect.height });
    });
    observer.observe(container);

    const handleNativeWheel = (e: WheelEvent) => {
      // Always prevent default to stop the webpage from scrolling when hovering the canvas
      e.preventDefault();

      // 1. Manual Zoom Behavior
      if (activeTool === "manualZoom") {
        setZoomLevel(prev => {
          const zoomDelta = e.deltaY < 0 ? 0.25 : -0.25;
          return Math.max(1, prev + zoomDelta);
        });
        return; 
      }

      // 2. Slice Scrolling Behavior (NOW GATED BEHIND THE SCROLLMOUSE TOOL)
      if (activeTool === "scrollMouse") {
        scrollAccumulator.current += e.deltaY;
        const sensitivityThreshold = 30;

        if (scrollAccumulator.current > sensitivityThreshold) {
          setCurrentFrame((prev) => Math.min(maxFrames, prev + 1));
          scrollAccumulator.current = 0;
        } else if (scrollAccumulator.current < -sensitivityThreshold) {
          setCurrentFrame((prev) => Math.max(1, prev - 1));
          scrollAccumulator.current = 0;
        }
      }
    };

    container.addEventListener("wheel", handleNativeWheel, { passive: false });
    return () => {
      observer.disconnect();
      container.removeEventListener("wheel", handleNativeWheel);
    };
  }, [maxFrames, setCurrentFrame, activeTool, setZoomLevel]);

  // Determine cursor style based on tool state
  let cursorStyle = "cursor-default"; // Set default to standard pointer
  if (activeTool === "move") cursorStyle = isDragging ? "cursor-grabbing" : "cursor-grab";
  if (activeTool === "windowLevel") cursorStyle = "cursor-crosshair";
  if (activeTool === "manualZoom") cursorStyle = "cursor-zoom-in";
  if (activeTool === "scrollMouse") cursorStyle = "cursor-ns-resize"; // Apply scroll cursor only when active

  const scaleX = zoomLevel * (flipState.horizontal ? -1 : 1);
  const scaleY = zoomLevel * (flipState.vertical ? -1 : 1);
  const filterStyle = `brightness(${windowLevel.brightness}) contrast(${windowLevel.contrast}) ${isInverted ? 'invert(1)' : ''}`;

  const verticalPositionClass = flipState.vertical ? "top-4" : "bottom-16";

  // ==========================================================================
  // --- DYNAMIC L/R MARKER CALCULATOR ---
  // ==========================================================================
  const getMarkerPositions = () => {
    let l_x = 'left';
    let l_y = 'bottom';
    let r_x = 'right';
    let r_y = 'bottom';

    if (flipState.horizontal) {
      l_x = 'right';
      r_x = 'left';
    }
    if (flipState.vertical) {
      l_y = 'top';
      r_y = 'top';
    }

    const steps = (((rotation % 360) + 360) % 360) / 90;

    const rotateCorner = (x: string, y: string) => {
      let currX = x;
      let currY = y;
      for (let i = 0; i < steps; i++) {
        if (currX === 'left' && currY === 'top') { currX = 'right'; currY = 'top'; }
        else if (currX === 'right' && currY === 'top') { currX = 'right'; currY = 'bottom'; }
        else if (currX === 'right' && currY === 'bottom') { currX = 'left'; currY = 'bottom'; }
        else if (currX === 'left' && currY === 'bottom') { currX = 'left'; currY = 'top'; }
      }
      return { x: currX, y: currY };
    };

    return { L: rotateCorner(l_x, l_y), R: rotateCorner(r_x, r_y) };
  };

  const markers = getMarkerPositions();

  const getCornerClass = (pos: {x: string, y: string}) => {
    if (pos.y === 'top' && pos.x === 'left') return "top-4 left-4";
    if (pos.y === 'top' && pos.x === 'right') return "top-4 right-4";
    if (pos.y === 'bottom' && pos.x === 'left') return "bottom-14 left-4";
    if (pos.y === 'bottom' && pos.x === 'right') return "bottom-14 right-4";
    return "";
  };

  return (
    <div
      ref={imageContainerRef}
      className={`flex-1 flex items-center justify-center overflow-hidden relative min-h-0 w-full h-full ${cursorStyle}`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUpOrLeave}
      onMouseLeave={handleMouseUpOrLeave}
    >
      {/* Patient Left/Right Markers */}
      <div className={`absolute ${getCornerClass(markers.L)} text-yellow-1 text-xl font-bold select-none pointer-events-none z-10 transition-all duration-300`}>
        L
      </div>
      <div className={`absolute ${getCornerClass(markers.R)} text-yellow-1 text-xl font-bold select-none pointer-events-none z-10 transition-all duration-300`}>
        R
      </div>

      {activeImageSrc ? (
        <img
          src={activeImageSrc}
          alt={`Brain Scan Slice ${currentFrame}`}
          className="select-none max-w-full max-h-full object-contain origin-center"
          draggable="false"
          onDragStart={(e) => e.preventDefault()}
          style={{
            transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${scaleX}, ${scaleY}) rotate(${rotation}deg)`,
            filter: filterStyle, 
            transition: isDragging ? "none" : "transform 0.15s ease-out",
          }}
        />
      ) : (
        <div className="sm:w-3/4 sm:h-3/4 w-full h-full bg-gray-9 border border-gray-6 rounded flex items-center justify-center animate-pulse text-gray-5 text-sm">
          Loading slice...
        </div>
      )}

      {isMagnifierOpen && (
        <MagnifierWindow 
          activeImageSrc={activeImageSrc} 
          onClose={() => setIsMagnifierOpen(false)}
          panOffset={panOffset}
          zoomLevel={zoomLevel}
          containerSize={containerSize}
          windowLevel={windowLevel}
          flipState={flipState}
          isInverted={isInverted}
          rotation={rotation}
        />
      )}
    </div>
  );
}

// ============================================================================
// --- ISOLATED MAGNIFIER COMPONENT ---
// ============================================================================
interface MagnifierProps {
  activeImageSrc: string;
  onClose: () => void;
  panOffset: { x: number; y: number };
  zoomLevel: number;
  containerSize: { w: number; h: number };
  windowLevel: { brightness: number; contrast: number };
  flipState: { horizontal: boolean; vertical: boolean };
  isInverted: boolean;
  rotation: number;
}

function MagnifierWindow({ activeImageSrc, onClose, panOffset, zoomLevel, containerSize, windowLevel, flipState, isInverted, rotation }: MagnifierProps) {
  const [pos, setPos] = useState({ x: 50, y: 50 });
  const [magZoom, setMagZoom] = useState(2.0);
  
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      setPos({
        x: e.clientX - dragStartRef.current.x,
        y: e.clientY - dragStartRef.current.y,
      });
    };

    const handleGlobalMouseUp = () => {
      isDraggingRef.current = false;
    };

    window.addEventListener("mousemove", handleGlobalMouseMove);
    window.addEventListener("mouseup", handleGlobalMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleGlobalMouseMove);
      window.removeEventListener("mouseup", handleGlobalMouseUp);
    };
  }, []);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation(); 
    isDraggingRef.current = true;
    dragStartRef.current = {
      x: e.clientX - pos.x,
      y: e.clientY - pos.y,
    };
  };

  const scaleX = zoomLevel * (flipState.horizontal ? -1 : 1);
  const scaleY = zoomLevel * (flipState.vertical ? -1 : 1);
  const filterStyle = `brightness(${windowLevel.brightness}) contrast(${windowLevel.contrast}) ${isInverted ? 'invert(1)' : ''}`;

  return (
    <div
      className="absolute z-50 w-64 bg-black border border-gray-3 shadow-2xl flex flex-col cursor-move"
      style={{ top: `${pos.y}px`, left: `${pos.x}px` }}
      onMouseDown={handleMouseDown}
    >
      <button 
        onClick={(e) => { e.stopPropagation(); onClose(); }}
        className="absolute top-1 right-1 z-20 bg-white text-black leading-none font-bold text-xs p-1 rounded-sm hover:bg-red-500 hover:text-white"
        onMouseDown={(e) => e.stopPropagation()} 
      >
        ✕
      </button>

      <div className="h-64 relative overflow-hidden bg-black pointer-events-none">
        <div 
          className="flex justify-center sm:p-8 px-8 pb-16 pt-16 relative"
          style={{
            position: 'absolute',
            top: -(pos.y + 1),
            left: -(pos.x + 1),
            width: containerSize.w || '100%',
            height: containerSize.h || '100%',
            transformOrigin: `${pos.x + 128}px ${pos.y + 128}px`, 
            transform: `scale(${magZoom})`
          }}
        >
          <img
            src={activeImageSrc}
            className="select-none sm:w-3/4 sm:h-3/4 sm:object-contain pt-8 origin-center"
            style={{
              transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${scaleX}, ${scaleY}) rotate(${rotation}deg)`,
              filter: filterStyle, 
            }}
            draggable="false"
            alt="Magnified View"
          />
        </div>
      </div>

      <div 
        className="h-8 bg-black border-t border-gray-4 flex items-center px-2 gap-2 text-white text-xs cursor-default"
        onMouseDown={(e) => e.stopPropagation()} 
      >
        <span className="w-10 text-orange-400 font-bold">{magZoom.toFixed(1)}x</span>
        <button className="bg-white text-black font-bold px-1 rounded-sm active:bg-gray-300" onClick={() => setMagZoom(prev => Math.max(1, prev - 0.5))}>-</button>
        <input type="range" min={1} max={10} step={0.5} value={magZoom} onChange={(e) => setMagZoom(parseFloat(e.target.value))} className="flex-1 h-1 bg-gray-6 appearance-none rounded-full cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-white" />
        <button className="bg-white text-black font-bold px-1 rounded-sm active:bg-gray-300" onClick={() => setMagZoom(prev => Math.min(10, prev + 0.5))}>+</button>
      </div>
    </div>
  );
}