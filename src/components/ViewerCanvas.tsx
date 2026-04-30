import { useEffect, useRef, useState } from "react";

interface ViewerCanvasProps {
  activeImageSrc: string;
  currentFrame: number;
  maxFrames: number;
  setCurrentFrame: React.Dispatch<React.SetStateAction<number>>;
  activeTool: string; // Tells the canvas which tool is currently selected
}

export default function ViewerCanvas({
  activeImageSrc,
  currentFrame,
  maxFrames,
  setCurrentFrame,
  activeTool,
}: ViewerCanvasProps) {
  const scrollAccumulator = useRef(0);
  const imageContainerRef = useRef<HTMLDivElement>(null);

  // --- Move Tool State ---
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });

  // --- Move Tool Handlers ---
  const handleMouseDown = (e: React.MouseEvent) => {
    if (activeTool !== "move") return;
    
    setIsDragging(true);
    // Record where the mouse clicked, subtracting the current offset 
    // so the image doesn't snap back to 0,0 on subsequent drags.
    dragStart.current = {
      x: e.clientX - panOffset.x,
      y: e.clientY - panOffset.y,
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || activeTool !== "move") return;
    
    // Calculate new position based on current mouse position minus the start point
    setPanOffset({
      x: e.clientX - dragStart.current.x,
      y: e.clientY - dragStart.current.y,
    });
  };

  const handleMouseUpOrLeave = () => {
    if (isDragging) {
      setIsDragging(false);
    }
  };

  // --- Scroll Tool Handlers (Existing) ---
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
    return () => container.removeEventListener("wheel", handleNativeWheel);
  }, [maxFrames, setCurrentFrame]);

  // Determine cursor style based on tool state
  let cursorStyle = "cursor-ns-resize"; // Default scroll cursor
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
      onMouseLeave={handleMouseUpOrLeave} // Cancels drag if mouse leaves the viewer area
    >
      {activeImageSrc ? (
        <img
          src={activeImageSrc}
          alt={`Brain Scan Slice ${currentFrame}`}
          className="select-none sm:w-3/4 sm:h-3/4 sm:object-contain pt-8"
          draggable="false"
          onDragStart={(e) => e.preventDefault()}
          style={{
            transform: `translate(${panOffset.x}px, ${panOffset.y}px)`,
            // Disable transition while dragging for 1:1 real-time movement
            transition: isDragging ? "none" : "transform 0.1s ease-out", 
          }}
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            if (target.dataset.error) return;
            target.dataset.error = "true";
            target.src =
              "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='600' viewBox='0 0 600 600'%3E%3Crect width='600' height='600' fill='%23141414'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='24' fill='%23444444'%3EScan Missing%3C/text%3E%3C/svg%3E";
          }}
        />
      ) : (
        <div className="sm:w-3/4 sm:h-3/4 w-full h-full bg-gray-9 border border-gray-6 rounded flex items-center justify-center animate-pulse text-gray-5 text-sm">
          Loading slice...
        </div>
      )}
    </div>
  );
}