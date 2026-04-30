// src/components/ViewerCanvas.tsx
import { useEffect, useRef } from "react";

interface ViewerCanvasProps {
  activeImageSrc: string;
  currentFrame: number;
  maxFrames: number;
  setCurrentFrame: React.Dispatch<React.SetStateAction<number>>;
}

export default function ViewerCanvas({
  activeImageSrc,
  currentFrame,
  maxFrames,
  setCurrentFrame,
}: ViewerCanvasProps) {
  const scrollAccumulator = useRef(0);
  const imageContainerRef = useRef<HTMLDivElement>(null);

  // Non-passive wheel scroll handler restricted to just the canvas
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

  return (
    <div
      ref={imageContainerRef}
      className="flex-1 flex justify-center sm:p-8 px-8 pb-16 pt-16 overflow-hidden relative cursor-ns-resize min-h-0"
    >
      {activeImageSrc ? (
        <img
          src={activeImageSrc}
          alt={`Brain Scan Slice ${currentFrame}`}
          className="select-none sm:w-3/4 sm:h-3/4 sm:object-contain pt-8"
          draggable="false"
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