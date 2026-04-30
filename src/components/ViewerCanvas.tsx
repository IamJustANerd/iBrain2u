import { useEffect, useRef, useState } from "react";

interface ViewerCanvasProps {
  activeImageSrc: string;
  currentFrame: number;
  maxFrames: number;
  setCurrentFrame: React.Dispatch<React.SetStateAction<number>>;
  activeTool: string;
  zoomLevel: number;
  isMagnifierOpen: boolean;
  setIsMagnifierOpen: (isOpen: boolean) => void;
}

export default function ViewerCanvas({
  activeImageSrc,
  currentFrame,
  maxFrames,
  setCurrentFrame,
  activeTool,
  zoomLevel,
  isMagnifierOpen,
  setIsMagnifierOpen,
}: ViewerCanvasProps) {
  const scrollAccumulator = useRef(0);
  const imageContainerRef = useRef<HTMLDivElement>(null);

  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  
  const [containerSize, setContainerSize] = useState({ w: 0, h: 0 });

  useEffect(() => {
    if (zoomLevel === 1) {
      setPanOffset({ x: 0, y: 0 });
    }
  }, [zoomLevel]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (activeTool !== "move") return;
    setIsDragging(true);
    dragStart.current = {
      x: e.clientX - panOffset.x,
      y: e.clientY - panOffset.y,
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || activeTool !== "move") return;
    setPanOffset({
      x: e.clientX - dragStart.current.x,
      y: e.clientY - dragStart.current.y,
    });
  };

  const handleMouseUpOrLeave = () => {
    if (isDragging) setIsDragging(false);
  };

  useEffect(() => {
    const container = imageContainerRef.current;
    if (!container) return;

    const observer = new ResizeObserver(() => {
      // FIX: Use getBoundingClientRect to get the FULL dimensions including padding
      const rect = container.getBoundingClientRect();
      setContainerSize({
        w: rect.width,
        h: rect.height,
      });
    });
    observer.observe(container);

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
      observer.disconnect();
      container.removeEventListener("wheel", handleNativeWheel);
    };
  }, [maxFrames, setCurrentFrame]);

  let cursorStyle = "cursor-ns-resize";
  if (activeTool === "move") {
    cursorStyle = isDragging ? "cursor-grabbing" : "cursor-grab";
  }

  return (
    <div
      ref={imageContainerRef}
      className={`flex-1 flex justify-center sm:p-8 px-8 pb-16 pt-16 overflow-hidden relative min-h-0 ${cursorStyle}`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUpOrLeave}
      onMouseLeave={handleMouseUpOrLeave}
    >
      {activeImageSrc ? (
        <img
          src={activeImageSrc}
          alt={`Brain Scan Slice ${currentFrame}`}
          className="select-none sm:w-3/4 sm:h-3/4 sm:object-contain pt-8 origin-center"
          draggable="false"
          onDragStart={(e) => e.preventDefault()}
          style={{
            transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
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
        />
      )}
    </div>
  );
}

// --- Isolated & Upgraded Magnifier Component ---
interface MagnifierProps {
  activeImageSrc: string;
  onClose: () => void;
  panOffset: { x: number; y: number };
  zoomLevel: number;
  containerSize: { w: number; h: number };
}

function MagnifierWindow({ activeImageSrc, onClose, panOffset, zoomLevel, containerSize }: MagnifierProps) {
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

      <div className="h-64 relative overflow-hidden bg-gray-10 pointer-events-none">
        <div 
          className="flex justify-center sm:p-8 px-8 pb-16 pt-16 relative"
          style={{
            position: 'absolute',
            // FIX: Added -1 to offset the 1px border of the magnifier window
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
              transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`
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
        
        <button 
          className="bg-white text-black font-bold px-1 rounded-sm active:bg-gray-300"
          onClick={() => setMagZoom(prev => Math.max(1, prev - 0.5))}
        >-</button>
        
        <input 
          type="range" 
          min={1} max={10} step={0.5} 
          value={magZoom}
          onChange={(e) => setMagZoom(parseFloat(e.target.value))}
          className="flex-1 h-1 bg-gray-6 appearance-none rounded-full cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-white"
        />
        
        <button 
          className="bg-white text-black font-bold px-1 rounded-sm active:bg-gray-300"
          onClick={() => setMagZoom(prev => Math.min(10, prev + 0.5))}
        >+</button>
      </div>
    </div>
  );
}