// src/components/ViewerCanvas.tsx
import { useEffect, useRef, useState } from "react";

// The shape of our drawing annotations
export interface Annotation {
  id: number;
  type: 'distance' | 'angle';
  points: { x: number, y: number }[]; // Coordinates strictly mapped to the raw Image Data Space
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
  // NEW PROPS for Drawing
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

  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const initialWindowLevel = useRef({ brightness: 1, contrast: 1 });
  const [containerSize, setContainerSize] = useState({ w: 0, h: 0 });

  // Dedicated state for the annotation currently being drawn (60fps updates)
  const [localAnnotation, setLocalAnnotation] = useState<Annotation | null>(null);

  // Math Setup
  const scaleX = zoomLevel * (flipState.horizontal ? -1 : 1);
  const scaleY = zoomLevel * (flipState.vertical ? -1 : 1);

  // Math Magic: Convert Raw Monitor Mouse Position -> Image Pixel Position
  const getScreenToImage = (sx: number, sy: number) => {
    if (!imageContainerRef.current) return { x: 0, y: 0 };
    const rect = imageContainerRef.current.getBoundingClientRect();
    
    // 1. Remove Center Offset & Pan translation
    const dx = sx - (rect.left + rect.width / 2) - panOffset.x;
    const dy = sy - (rect.top + rect.height / 2) - panOffset.y;

    // 2. Reverse Rotation
    const rad = -rotation * Math.PI / 180;
    const rx = dx * Math.cos(rad) - dy * Math.sin(rad);
    const ry = dx * Math.sin(rad) + dy * Math.cos(rad);

    // 3. Reverse Scale & Flip
    return { x: rx / scaleX, y: ry / scaleY };
  }

  // Math Magic: Convert Image Pixel Position -> Raw Monitor Rendering Position
  const getImageToScreen = (ix: number, iy: number) => {
    if (!imageContainerRef.current) return { x: 0, y: 0 };
    const rect = imageContainerRef.current.getBoundingClientRect();
    
    // 1. Apply Scale & Flip
    const rx = ix * scaleX;
    const ry = iy * scaleY;

    // 2. Apply Rotation
    const rad = rotation * Math.PI / 180;
    const dx = rx * Math.cos(rad) - ry * Math.sin(rad);
    const dy = rx * Math.sin(rad) + ry * Math.cos(rad);

    // 3. Apply Pan & Center Offset
    return {
      x: dx + panOffset.x + rect.width / 2,
      y: dy + panOffset.y + rect.height / 2
    };
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!["move", "windowLevel", "distance", "angle"].includes(activeTool)) return;
    
    setIsDragging(true);
    
    if (activeTool === "move") {
      dragStart.current = { x: e.clientX - panOffset.x, y: e.clientY - panOffset.y };
    } else if (activeTool === "windowLevel") {
      dragStart.current = { x: e.clientX, y: e.clientY };
      initialWindowLevel.current = { ...windowLevel };
    } else if (activeTool === "distance") {
      const pt = getScreenToImage(e.clientX, e.clientY);
      setLocalAnnotation({ id: Date.now(), type: 'distance', points: [pt, pt] });
    } else if (activeTool === "angle") {
      const pt = getScreenToImage(e.clientX, e.clientY);
      
      // If we are starting a brand new angle measurement
      if (!localAnnotation || localAnnotation.type !== 'angle' || localAnnotation.points.length === 4) {
        setLocalAnnotation({ id: Date.now(), type: 'angle', points: [pt, pt] });
      } 
      // If we already have the first line, start the SECOND independent line
      else if (localAnnotation.points.length === 2) {
        // We push TWO identical points to start the second line segment
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
      const newBrightness = Math.max(0, initialWindowLevel.current.brightness - (deltaY * 0.005));
      const newContrast = Math.max(0, initialWindowLevel.current.contrast + (deltaX * 0.005));
      setWindowLevel({ brightness: newBrightness, contrast: newContrast });
    } else if (activeTool === "distance" && localAnnotation) {
      const pt = getScreenToImage(e.clientX, e.clientY);
      setLocalAnnotation({ ...localAnnotation, points: [localAnnotation.points[0], pt] });
    } else if (activeTool === "angle" && localAnnotation) {
      const pt = getScreenToImage(e.clientX, e.clientY);
      // Dragging the first line
      if (localAnnotation.points.length === 2) {
        setLocalAnnotation({ ...localAnnotation, points: [localAnnotation.points[0], pt] });
      } 
      // Dragging the second line
      else if (localAnnotation.points.length === 4) {
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
      // Commit drawing to permanent array on mouse release
      if (activeTool === "distance" && localAnnotation) {
        setAnnotations((prev: Annotation[]) => [...prev, localAnnotation]);
        setLocalAnnotation(null);
      } else if (activeTool === "angle" && localAnnotation) {
        // Only commit if BOTH lines have been drawn
        if (localAnnotation.points.length === 4) {
          setAnnotations((prev: Annotation[]) => [...prev, localAnnotation]);
          setLocalAnnotation(null);
        }
      }
    }
  };

  // If the user switches tools while drawing, clear the temp line
  useEffect(() => {
    if (activeTool !== 'angle' && activeTool !== 'distance') {
      setLocalAnnotation(null);
    }
  }, [activeTool]);

  // Handle zooming, scrolling, and ResizeObserver logic 
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
  if (["distance", "angle"].includes(activeTool)) cursorStyle = "cursor-crosshair";

  const filterStyle = `brightness(${windowLevel.brightness}) contrast(${windowLevel.contrast}) ${isInverted ? 'invert(1)' : ''}`;

  const renderAnnotation = (a: Annotation) => {
    const TextShadow = ({ x, y, text }: { x: number, y: number, text: string }) => (
      <text x={x} y={y} fill="currentColor" fontSize="16" fontWeight="bold" textAnchor="middle" style={{ filter: "drop-shadow(1px 1px 2px rgba(0,0,0,0.8))" }}>
        {text}
      </text>
    );

    if (a.type === 'distance' && a.points.length >= 2) {
      const p0 = getImageToScreen(a.points[0].x, a.points[0].y);
      const p1 = getImageToScreen(a.points[1].x, a.points[1].y);
      const rawPxDistance = Math.hypot(a.points[1].x - a.points[0].x, a.points[1].y - a.points[0].y);
      const cmDistance = (rawPxDistance * 0.05).toFixed(2); 

      return (
        <g key={a.id} className="group pointer-events-auto cursor-pointer text-[#3b82f6] hover:text-[#facc15]">
          <line x1={p0.x} y1={p0.y} x2={p1.x} y2={p1.y} stroke="transparent" strokeWidth="15" />
          <line x1={p0.x} y1={p0.y} x2={p1.x} y2={p1.y} stroke="currentColor" strokeWidth="2" className="pointer-events-none" />
          <rect x={p0.x-2} y={p0.y-2} width={4} height={4} fill="currentColor" className="pointer-events-none" />
          <rect x={p1.x-2} y={p1.y-2} width={4} height={4} fill="currentColor" className="pointer-events-none" />
          <TextShadow x={(p0.x + p1.x) / 2} y={(p0.y + p1.y) / 2 - 10} text={`${cmDistance} cm`} />
        </g>
      );
    } 
    
    if (a.type === 'angle' && a.points.length >= 2) {
      const p0 = getImageToScreen(a.points[0].x, a.points[0].y);
      const p1 = getImageToScreen(a.points[1].x, a.points[1].y);
      
      let p2, p3, angleInfo = null;
      
      if (a.points.length === 4) {
        p2 = getImageToScreen(a.points[2].x, a.points[2].y);
        p3 = getImageToScreen(a.points[3].x, a.points[3].y);

        // Vector Math for Angle
        const v1x = a.points[1].x - a.points[0].x, v1y = a.points[1].y - a.points[0].y;
        const v2x = a.points[3].x - a.points[2].x, v2y = a.points[3].y - a.points[2].y;
        const dot = v1x * v2x + v1y * v2y;
        const mag1 = Math.hypot(v1x, v1y);
        const mag2 = Math.hypot(v2x, v2y);
        
        let angle = Math.acos(dot / (mag1 * mag2)) * (180 / Math.PI);
        if (angle > 90) angle = 180 - angle;

        // NEW: Calculate the exact mathematical intersection point of the two lines
        // Standard line intersection formula (Line 1: p0->p1, Line 2: p2->p3)
        const denominator = (p0.x - p1.x) * (p2.y - p3.y) - (p0.y - p1.y) * (p2.x - p3.x);
        
        // If lines are perfectly parallel, denominator is 0
        if (denominator !== 0) {
          const t = ((p0.x - p2.x) * (p2.y - p3.y) - (p0.y - p2.y) * (p2.x - p3.x)) / denominator;
          const intersectX = p0.x + t * (p1.x - p0.x);
          const intersectY = p0.y + t * (p1.y - p0.y);

          // Find the center of the lines to draw the dashed lines from
          const mid1X = (p0.x + p1.x) / 2;
          const mid1Y = (p0.y + p1.y) / 2;
          const mid2X = (p2.x + p3.x) / 2;
          const mid2Y = (p2.y + p3.y) / 2;

          angleInfo = (
            <>
              {/* Draw dashed lines connecting the midpoints to the intersection */}
              <line x1={mid1X} y1={mid1Y} x2={intersectX} y2={intersectY} stroke="currentColor" strokeWidth="1.5" strokeDasharray="5,5" className="pointer-events-none" />
              <line x1={mid2X} y1={mid2Y} x2={intersectX} y2={intersectY} stroke="currentColor" strokeWidth="1.5" strokeDasharray="5,5" className="pointer-events-none" />
              
              {/* Position the text slightly offset from the intersection */}
              <TextShadow x={intersectX - 20} y={intersectY + 5} text={`${angle.toFixed(1)}°`} />
            </>
          );
        } else {
           // If they are perfectly parallel, just show 0 degrees in the middle
           angleInfo = <TextShadow x={(p0.x + p2.x) / 2} y={(p0.y + p2.y) / 2} text="0.0°" />;
        }
      }

      return (
        <g key={a.id} className="group pointer-events-auto cursor-pointer text-[#3b82f6] hover:text-[#facc15]">
          {/* First Line */}
          <line x1={p0.x} y1={p0.y} x2={p1.x} y2={p1.y} stroke="transparent" strokeWidth="15" />
          <line x1={p0.x} y1={p0.y} x2={p1.x} y2={p1.y} stroke="currentColor" strokeWidth="2" className="pointer-events-none" />
          
          {/* Second Line (Only renders when started) */}
          {p2 && p3 && (
            <>
              <line x1={p2.x} y1={p2.y} x2={p3.x} y2={p3.y} stroke="transparent" strokeWidth="15" />
              <line x1={p2.x} y1={p2.y} x2={p3.x} y2={p3.y} stroke="currentColor" strokeWidth="2" className="pointer-events-none" />
            </>
          )}
          {angleInfo}
        </g>
      );
    }
    return null;
  };

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

      {/* SVG LAYER: Perfectly transparent, holds dynamic annotations */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-20 overflow-visible">
        {/* Render committed arrays plus the one currently being drawn */}
        {[...annotations, localAnnotation].filter(Boolean).map((a) => a && renderAnnotation(a))}
      </svg>

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

// ... (KEEP MagnifierWindow COMPONENT EXACTLY THE SAME AS PREVIOUS) ...
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
      setPos({ x: e.clientX - dragStartRef.current.x, y: e.clientY - dragStartRef.current.y });
    };
    const handleGlobalMouseUp = () => { isDraggingRef.current = false; };
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
    dragStartRef.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
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
      <button onClick={(e) => { e.stopPropagation(); onClose(); }} className="absolute top-1 right-1 z-20 bg-white text-black leading-none font-bold text-xs p-1 rounded-sm hover:bg-red-500 hover:text-white" onMouseDown={(e) => e.stopPropagation()}>✕</button>
      <div className="h-64 relative overflow-hidden bg-black pointer-events-none">
        <div className="flex justify-center sm:p-8 px-8 pb-16 pt-16 relative" style={{ position: 'absolute', top: -(pos.y + 1), left: -(pos.x + 1), width: containerSize.w || '100%', height: containerSize.h || '100%', transformOrigin: `${pos.x + 128}px ${pos.y + 128}px`, transform: `scale(${magZoom})` }}>
          <img src={activeImageSrc} className="select-none sm:w-3/4 sm:h-3/4 sm:object-contain pt-8 origin-center" style={{ transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${scaleX}, ${scaleY}) rotate(${rotation}deg)`, filter: filterStyle }} draggable="false" alt="Magnified View" />
        </div>
      </div>
      <div className="h-8 bg-black border-t border-gray-4 flex items-center px-2 gap-2 text-white text-xs cursor-default" onMouseDown={(e) => e.stopPropagation()}>
        <span className="w-10 text-orange-400 font-bold">{magZoom.toFixed(1)}x</span>
        <button className="bg-white text-black font-bold px-1 rounded-sm active:bg-gray-300" onClick={() => setMagZoom(prev => Math.max(1, prev - 0.5))}>-</button>
        <input type="range" min={1} max={10} step={0.5} value={magZoom} onChange={(e) => setMagZoom(parseFloat(e.target.value))} className="flex-1 h-1 bg-gray-6 appearance-none rounded-full cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-white" />
        <button className="bg-white text-black font-bold px-1 rounded-sm active:bg-gray-300" onClick={() => setMagZoom(prev => Math.min(10, prev + 0.5))}>+</button>
      </div>
    </div>
  );
}