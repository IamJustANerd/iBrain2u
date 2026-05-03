// src/components/ViewerCanvas.tsx
import { useEffect, useRef, useState } from "react";
import MagnifierWindow from "./MagnifierWindow";
import AnnotationOverlay from "./AnnotationOverlay";

export interface Annotation {
  id: number;
  type: 'distance' | 'angle' | 'elliptical' | 'ellipse' | 'rectangle' | 'drawText' | 'arrow' | 'draw';
  points: { x: number, y: number }[]; 
  text?: string;
}

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
  annotations: Annotation[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setAnnotations: (val: any) => void;
}

export default function ViewerCanvas({
  activeImageSrc, currentFrame, maxFrames, setCurrentFrame,
  activeTool, zoomLevel, setZoomLevel, isMagnifierOpen, setIsMagnifierOpen,
  windowLevel, setWindowLevel, flipState, isInverted, rotation,
  annotations, setAnnotations
}: ViewerCanvasProps) {
  
  const scrollAccumulator = useRef(0);
  const imageContainerRef = useRef<HTMLDivElement>(null);

  // NEW: Ref to force focus on the input when it spawns
  const textInputRef = useRef<HTMLInputElement>(null);

  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const initialWindowLevel = useRef({ brightness: 1, contrast: 1 });
  const [containerSize, setContainerSize] = useState({ w: 0, h: 0 });

  const [localAnnotation, setLocalAnnotation] = useState<Annotation | null>(null);
  const [activeTextInput, setActiveTextInput] = useState<{ id: number, x: number, y: number } | null>(null);

  const scaleX = zoomLevel * (flipState.horizontal ? -1 : 1);
  const scaleY = zoomLevel * (flipState.vertical ? -1 : 1);

  const getScreenToImage = (sx: number, sy: number) => {
    if (!imageContainerRef.current) return { x: 0, y: 0 };
    const rect = imageContainerRef.current.getBoundingClientRect();
    const dx = sx - (rect.left + rect.width / 2) - panOffset.x;
    const dy = sy - (rect.top + rect.height / 2) - panOffset.y;
    const rad = -rotation * Math.PI / 180;
    const rx = dx * Math.cos(rad) - dy * Math.sin(rad);
    const ry = dx * Math.sin(rad) + dy * Math.cos(rad);
    return { x: rx / scaleX, y: ry / scaleY };
  }

  const getImageToScreen = (ix: number, iy: number) => {
    if (!imageContainerRef.current) return { x: 0, y: 0 };
    const rect = imageContainerRef.current.getBoundingClientRect();
    const rx = ix * scaleX;
    const ry = iy * scaleY;
    const rad = rotation * Math.PI / 180;
    const dx = rx * Math.cos(rad) - ry * Math.sin(rad);
    const dy = rx * Math.sin(rad) + ry * Math.cos(rad);
    return {
      x: dx + panOffset.x + rect.width / 2,
      y: dy + panOffset.y + rect.height / 2
    };
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (activeTextInput) return; 

    if (!["move", "windowLevel", "distance", "angle", "ellipse", "rectangle", "elliptical", "draw", "arrow", "drawText"].includes(activeTool)) return;
    
    if (activeTool !== "drawText") setIsDragging(true);
    
    if (activeTool === "move") {
      dragStart.current = { x: e.clientX - panOffset.x, y: e.clientY - panOffset.y };
    } else if (activeTool === "windowLevel") {
      dragStart.current = { x: e.clientX, y: e.clientY };
      initialWindowLevel.current = { ...windowLevel };
    } else if (["distance", "ellipse", "rectangle", "elliptical", "arrow"].includes(activeTool)) {
      const pt = getScreenToImage(e.clientX, e.clientY);
      setLocalAnnotation({ id: Date.now(), type: activeTool as any, points: [pt, pt] });
    } else if (activeTool === "draw") {
      const pt = getScreenToImage(e.clientX, e.clientY);
      setLocalAnnotation({ id: Date.now(), type: 'draw', points: [pt] });
    } else if (activeTool === "drawText") {
      const pt = getScreenToImage(e.clientX, e.clientY);
      setActiveTextInput({ id: Date.now(), x: pt.x, y: pt.y });
    } else if (activeTool === "angle") {
      const pt = getScreenToImage(e.clientX, e.clientY);
      if (!localAnnotation || localAnnotation.type !== 'angle' || localAnnotation.points.length === 4) {
        setLocalAnnotation({ id: Date.now(), type: 'angle', points: [pt, pt] });
      } else if (localAnnotation.points.length === 2) {
        setLocalAnnotation({ ...localAnnotation, points: [...localAnnotation.points, pt, pt] });
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;

    if (activeTool === "move") {
      setPanOffset({ x: e.clientX - dragStart.current.x, y: e.clientY - dragStart.current.y });
    } else if (activeTool === "windowLevel") {
      const deltaX = e.clientX - dragStart.current.x;
      const deltaY = e.clientY - dragStart.current.y;
      setWindowLevel({ 
        brightness: Math.max(0, initialWindowLevel.current.brightness - (deltaY * 0.005)), 
        contrast: Math.max(0, initialWindowLevel.current.contrast + (deltaX * 0.005)) 
      });
    } else if (["distance", "ellipse", "rectangle", "elliptical", "arrow"].includes(activeTool) && localAnnotation) {
      const pt = getScreenToImage(e.clientX, e.clientY);
      setLocalAnnotation({ ...localAnnotation, points: [localAnnotation.points[0], pt] });
    } else if (activeTool === "draw" && localAnnotation) {
      const pt = getScreenToImage(e.clientX, e.clientY);
      setLocalAnnotation({ ...localAnnotation, points: [...localAnnotation.points, pt] });
    } else if (activeTool === "angle" && localAnnotation) {
      const pt = getScreenToImage(e.clientX, e.clientY);
      if (localAnnotation.points.length === 2) {
        setLocalAnnotation({ ...localAnnotation, points: [localAnnotation.points[0], pt] });
      } else if (localAnnotation.points.length === 4) {
        setLocalAnnotation({ 
          ...localAnnotation, 
          points: [localAnnotation.points[0], localAnnotation.points[1], localAnnotation.points[2], pt] 
        });
      }
    }
  };

  const handleMouseUpOrLeave = () => { 
    if (isDragging) {
      setIsDragging(false);
      
      if (activeTool === "draw" && localAnnotation && localAnnotation.points.length > 2) {
        const closedPoints = [...localAnnotation.points, localAnnotation.points[0]];
        setAnnotations((prev: Annotation[]) => [...prev, { ...localAnnotation, points: closedPoints }]);
        setLocalAnnotation(null);
      } 
      else if (["distance", "ellipse", "rectangle", "elliptical", "arrow"].includes(activeTool) && localAnnotation) {
        setAnnotations((prev: Annotation[]) => [...prev, localAnnotation]);
        setLocalAnnotation(null);
      } 
      else if (activeTool === "angle" && localAnnotation) {
        if (localAnnotation.points.length === 4) {
          setAnnotations((prev: Annotation[]) => [...prev, localAnnotation]);
          setLocalAnnotation(null);
        }
      }
    }
  };

  useEffect(() => {
    if (!["distance", "angle", "ellipse", "rectangle", "elliptical", "draw", "drawText", "arrow"].includes(activeTool)) {
      setLocalAnnotation(null);
      setActiveTextInput(null);
    }
  }, [activeTool]);

  // NEW: Force focus on the input whenever activeTextInput spawns
  useEffect(() => {
    if (activeTextInput && textInputRef.current) {
      textInputRef.current.focus();
    }
  }, [activeTextInput]);

  useEffect(() => {
    if (zoomLevel === 1) setPanOffset({ x: 0, y: 0 });
    const container = imageContainerRef.current;
    if (!container) return;

    const observer = new ResizeObserver(() => {
      const rect = container.getBoundingClientRect();
      setContainerSize({ w: rect.width, h: rect.height });
    });
    observer.observe(container);

    const handleNativeWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (activeTool === "manualZoom") {
        setZoomLevel(prev => Math.max(1, prev + (e.deltaY < 0 ? 0.25 : -0.25)));
        return; 
      }
      if (activeTool === "scrollMouse") {
        scrollAccumulator.current += e.deltaY;
        if (scrollAccumulator.current > 30) {
          setCurrentFrame((prev) => Math.min(maxFrames, prev + 1));
          scrollAccumulator.current = 0;
        } else if (scrollAccumulator.current < -30) {
          setCurrentFrame((prev) => Math.max(1, prev - 1));
          scrollAccumulator.current = 0;
        }
      }
    };
    container.addEventListener("wheel", handleNativeWheel, { passive: false });
    return () => { observer.disconnect(); container.removeEventListener("wheel", handleNativeWheel); };
  }, [maxFrames, setCurrentFrame, activeTool, setZoomLevel, zoomLevel]);

  let cursorStyle = "cursor-default"; 
  if (activeTool === "move") cursorStyle = isDragging ? "cursor-grabbing" : "cursor-grab";
  if (activeTool === "windowLevel") cursorStyle = "cursor-crosshair";
  if (activeTool === "manualZoom") cursorStyle = "cursor-zoom-in";
  if (activeTool === "scrollMouse") cursorStyle = "cursor-ns-resize";
  if (activeTool === "drawText") cursorStyle = "cursor-text";
  if (["distance", "angle", "ellipse", "rectangle", "elliptical", "draw", "arrow"].includes(activeTool)) cursorStyle = "cursor-crosshair";

  const filterStyle = `brightness(${windowLevel.brightness}) contrast(${windowLevel.contrast}) ${isInverted ? 'invert(1)' : ''}`;

  const markers = () => {
    let l_x = 'left', l_y = 'bottom', r_x = 'right', r_y = 'bottom';
    if (flipState.horizontal) { l_x = 'right'; r_x = 'left'; }
    if (flipState.vertical) { l_y = 'top'; r_y = 'top'; }
    const steps = (((rotation % 360) + 360) % 360) / 90;
    const rotateCorner = (x: string, y: string) => {
      let currX = x, currY = y;
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

  const getCornerClass = (pos: {x: string, y: string}) => {
    if (pos.y === 'top' && pos.x === 'left') return "top-4 left-4";
    if (pos.y === 'top' && pos.x === 'right') return "top-4 right-4";
    if (pos.y === 'bottom' && pos.x === 'left') return "bottom-14 left-4";
    if (pos.y === 'bottom' && pos.x === 'right') return "bottom-14 right-4";
    return "";
  };

  const m = markers();

  const commitText = (text: string) => {
    if (activeTextInput && text.trim()) {
      setAnnotations((prev: Annotation[]) => [...prev, {
        id: activeTextInput.id,
        type: 'drawText',
        points: [{ x: activeTextInput.x, y: activeTextInput.y }],
        text: text
      }]);
    }
    setActiveTextInput(null);
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
      <div className={`absolute ${getCornerClass(m.L)} text-yellow-1 text-lg font-bold select-none pointer-events-none z-10 transition-all duration-300`}>L</div>
      <div className={`absolute ${getCornerClass(m.R)} text-yellow-1 text-lg font-bold select-none pointer-events-none z-10 transition-all duration-300`}>R</div>

      {activeImageSrc ? (
        <img
          src={activeImageSrc}
          alt={`Brain Scan Slice ${currentFrame}`}
          className="select-none max-w-full max-h-full object-contain origin-center"
          draggable="false"
          style={{ transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${scaleX}, ${scaleY}) rotate(${rotation}deg)`, filter: filterStyle, transition: isDragging ? "none" : "transform 0.15s ease-out" }}
        />
      ) : (
        <div className="w-full h-full bg-gray-9 border border-gray-6 flex items-center justify-center animate-pulse text-gray-5 text-sm">
          Loading slice...
        </div>
      )}

      <AnnotationOverlay 
        annotations={annotations} 
        localAnnotation={localAnnotation} 
        getImageToScreen={getImageToScreen} 
      />

      {/* NEW FLOATING TEXT INPUT OVERLAY */}
      {activeTextInput && (
        <div 
          className="absolute z-50 pointer-events-auto"
          style={{
            left: getImageToScreen(activeTextInput.x, activeTextInput.y).x,
            top: getImageToScreen(activeTextInput.x, activeTextInput.y).y - 20, 
          }}
          // Fix: prevent ANY propagation so clicks don't hit the canvas
          onMouseDown={e => { e.stopPropagation(); e.preventDefault(); }} 
        >
          <input
            ref={textInputRef} // Connect the Ref here to force focus
            type="text"
            className="bg-transparent border-2 border-[#3b82f6] text-[#3b82f6] outline-none px-2 py-1 shadow-lg font-bold text-lg min-w-[200px]"
            placeholder="Type and press Enter..."
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                commitText(e.currentTarget.value);
              } else if (e.key === 'Escape') {
                setActiveTextInput(null); 
              }
            }}
            onBlur={(e) => commitText(e.currentTarget.value)} 
          />
        </div>
      )}

      {isMagnifierOpen && (
        <MagnifierWindow 
          activeImageSrc={activeImageSrc} onClose={() => setIsMagnifierOpen(false)}
          panOffset={panOffset} zoomLevel={zoomLevel} containerSize={containerSize}
          windowLevel={windowLevel} flipState={flipState} isInverted={isInverted} rotation={rotation}
        />
      )}
    </div>
  );
}