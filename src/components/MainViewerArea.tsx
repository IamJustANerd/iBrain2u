// src/components/MainViewerArea.tsx
import { useEffect, useRef, useMemo } from "react";

// Imports for all your tool icons
import ArrowRight from "../assets/icons/gray/arrowRight.svg";
import Border from "../assets/icons/gray/border.svg";
import Circle from "../assets/icons/gray/circle.svg";
import Draw from "../assets/icons/gray/draw.svg";
import Grid1 from "../assets/icons/gray/grid1.svg";
import Grid4 from "../assets/icons/gray/grid4.svg";
import Layer from "../assets/icons/gray/layer.svg";
import Mouse from "../assets/icons/blue/mouse.svg";
import Move from "../assets/icons/gray/move.svg";
import Redo from "../assets/icons/gray/redo.svg";
import Refresh from "../assets/icons/gray/refresh.svg";
import Ruler from "../assets/icons/gray/ruler.svg";
import Undo from "../assets/icons/gray/undo.svg";
import Zoom from "../assets/icons/gray/zoom.svg";
import Comment from "../assets/icons/comment.svg";

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
  const scrollAccumulator = useRef(0);
  const imageContainerRef = useRef<HTMLDivElement>(null);

  // Group important slices by their frame number to handle overlaps
  const markersBySlice = useMemo(() => {
    // Structure: { [sliceIndex: number]: string[] } -> { 65: ['lvl1', 'lvl2'] }
    const map: Record<number, string[]> = {};
    
    if (analysisData) {
      Object.keys(analysisData).forEach((levelKey) => {
        const levelInfo = analysisData[levelKey];
        if (levelInfo && Array.isArray(levelInfo.important_slice)) {
          levelInfo.important_slice.forEach((slice: number) => {
            if (!map[slice]) map[slice] = [];
            // Prevent duplicate levels on the same slice
            if (!map[slice].includes(levelKey)) {
              map[slice].push(levelKey);
            }
          });
        }
      });
    }

    // Ensure they are sorted so lvl1 is top, lvl2 middle, lvl3 bottom
    Object.values(map).forEach(levels => levels.sort());
    return map;
  }, [analysisData]);

  // Group ALL contiguous slices into "Islands", regardless of their anomaly levels
  const markerIslands = useMemo(() => {
    // Structure: { start: number, end: number, slices: { slice: number, levels: string[] }[] }
    const islands: { start: number; end: number; slices: { slice: number; levels: string[] }[] }[] = [];
    
    // Get all slice indices that have markers, sorted numerically
    const sortedSlices = Object.keys(markersBySlice)
      .map(Number)
      .sort((a, b) => a - b);

    if (sortedSlices.length === 0) return islands;

    let currentIsland = {
      start: sortedSlices[0],
      end: sortedSlices[0],
      slices: [{ slice: sortedSlices[0], levels: markersBySlice[sortedSlices[0]] }]
    };

    for (let i = 1; i < sortedSlices.length; i++) {
      const slice = sortedSlices[i];
      const prevSlice = sortedSlices[i - 1];

      if (slice === prevSlice + 1) {
        // If it's the exact next frame, extend the current island
        currentIsland.end = slice;
        currentIsland.slices.push({ slice, levels: markersBySlice[slice] });
      } else {
        // Break in continuity found, push the old island and start a new one
        islands.push(currentIsland);
        currentIsland = {
          start: slice,
          end: slice,
          slices: [{ slice, levels: markersBySlice[slice] }]
        };
      }
    }
    islands.push(currentIsland); // Push the final island

    return islands;
  }, [markersBySlice]);
  // Check if current frame is marked in our map
  const isCurrentFrameImportant = !!markersBySlice[currentFrame];

  // Dynamically assign Tailwind classes based on whether the current frame is an anomaly
  const thumbClasses = isCurrentFrameImportant
    ? "opacity-50 [&::-webkit-slider-thumb]:bg-blue-1 [&::-moz-range-thumb]:bg-blue-1"
    : "opacity-50 [&::-webkit-slider-thumb]:bg-gray-1 [&::-moz-range-thumb]:bg-gray-1";

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

  // Calculate the current thumb's position for the Dialogue Box
  const currentPositionPercent = maxFrames > 1 ? ((currentFrame - 1) / (maxFrames - 1)) * 100 : 0;
  const thumbWidth = 24; // Updated to match w-6 (24px)
  const currentOffset = (thumbWidth / 2) - (currentPositionPercent / 100) * thumbWidth;

  return (
    <main className="flex-1 flex flex-col relative bg-gray-11 min-h-0 min-w-0">
      {/* Top Viewer Toolbar */}
      <div className="h-8 sm:h-12 border-b-0 border-gray-6 bg-gray-7 flex items-center justify-between px-4 overflow-x-auto">
        <div className="flex items-center gap-4 text-gray-1 shrink-0">
          <button className="p-1 bg-gray-4 rounded h-5 w-5 sm:h-8 sm:w-8 shrink-0">
            <img src={Mouse} className="h-3 w-4.5 sm:h-5 sm:w-6.5" alt="Mouse" />
          </button>
          <button className="p-1 shrink-0">
            <img src={Move} className="h-3 w-4.5 sm:h-5 sm:w-6.5" alt="Move" />
          </button>
          <button className="p-1 shrink-0">
            <img src={Zoom} className="h-3 w-4.5 sm:h-5 sm:w-6.5" alt="Zoom" />
          </button>
          <button className="p-1 shrink-0">
            <img src={Layer} className="h-3 w-4.5 sm:h-5 sm:w-6.5" alt="Layer" />
          </button>
          <img src={Border} className="h-3 w-4.5 sm:h-5 sm:w-6.5" alt="Separator" />
          <button className="p-1 shrink-0">
            <img src={Grid1} className="h-3 w-4.5 sm:h-5 sm:w-6.5" alt="Grid1" />
          </button>
          <button className="p-1 shrink-0">
            <img src={Grid4} className="h-3 w-4.5 sm:h-5 sm:w-6.5" alt="Grid4" />
          </button>
          <button className="p-1 shrink-0">
            <img src={Undo} className="h-3 w-4.5 sm:h-5 sm:w-6.5" alt="Undo" />
          </button>
          <button className="p-1 shrink-0">
            <img src={Redo} className="h-3 w-4.5 sm:h-5 sm:w-6.5" alt="Redo" />
          </button>
          <img src={Border} className="h-3 w-4.5 sm:h-5 sm:w-6.5" alt="Separator" />
          <button className="p-1 shrink-0">
            <img src={Ruler} className="h-3 w-4.5 sm:h-5 sm:w-6.5" alt="Ruler" />
          </button>
          <button className="p-1 shrink-0">
            <img src={Draw} className="h-3 w-4.5 sm:h-5 sm:w-6.5" alt="Draw" />
          </button>
          <button className="p-1 shrink-0">
            <img src={ArrowRight} className="h-3 w-4.5 sm:h-5 sm:w-6.5" alt="Arrow" />
          </button>
          <button className="p-1 shrink-0">
            <img src={Circle} className="h-3 w-4.5 sm:h-5 sm:w-6.5" alt="Circle" />
          </button>
          <button className="p-1 shrink-0">
            <img src={Refresh} className="h-3 w-4.5 sm:h-5 sm:w-6.5" alt="Refresh" />
          </button>
        </div>

        {/* View Switcher */}
        <div className="hidden lg:flex w-2/10 text-[11px] justify-between px-4 font-semibold text-white bg-gray-10 h-9 border-gray-5 border-3 rounded gap-4 ml-4 shrink-0">
          <button
            className={`flex-1 ${axis === "axial" ? "text-blue-400" : "hover:text-white"}`}
            onClick={() => setAxis("axial")}
          >
            AXIAL
          </button>
          <button
            className={`flex-1 ${axis === "sagittal" ? "text-blue-400" : "hover:text-white"}`}
            onClick={() => setAxis("sagittal")}
          >
            SAGITTAL
          </button>
          <button
            className={`flex-1 ${axis === "coronal" ? "text-blue-400" : "hover:text-white"}`}
            onClick={() => setAxis("coronal")}
          >
            CORONAL
          </button>
        </div>
      </div>

      {/* Sub-toolbar */}
      <div className="flex items-center justify-between px-4 py-4 absolute top-12 left-0 right-0 z-10 pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto">
          <div className="flex flex-row justify-between text-xs text-white bg-gray-3 border-gray-3 border-3 rounded">
            <div className="bg-gray-3 border-gray-3 rounded-l items-center my-auto mx-3 hidden sm:block">
              AI Overlay
            </div>
            <div className="flex bg-gray-10 rounded-r overflow-hidden text-xs">
              <button className="w-1/2 text-white px-2 py-1">ON</button>
              <button className="w-1/2 text-gray-1 px-2 py-1 hover:bg-gray-7">
                OFF
              </button>
            </div>
          </div>
        </div>
        <div className="text-white text-sm pointer-events-auto font-medium">
          Slice : {currentFrame} / {maxFrames}
        </div>
      </div>

      {/* Actual Scan Image Area */}
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

      {/* Custom Range Slider with Anomaly Markers */}
      <div className="absolute bottom-28 md:bottom-20 left-60 right-60 z-20">
        <div className="relative flex items-center w-full h-6">
          
          {/* UPDATED: Dialog Box (Comment Tooltip) positioned to the Bottom Right */}
          <div 
            className="absolute top-full flex justify-center items-center pointer-events-none z-30"
            style={{ 
              left: `calc(${currentPositionPercent}% + ${currentOffset}px)`, 
              transform: 'translateX(-10px)' 
            }}
          >
            <div className="relative flex justify-center items-center">
              <img src={Comment} alt="Comment Box" className="h-7 w-auto object-contain" />
              <span className="absolute text-[9px] font-semibold text-white mt-1.5 whitespace-nowrap px-2">
                Slice {currentFrame}
              </span>
            </div>
          </div>

          {/* Base Track */}
          <div className="absolute left-0 right-0 h-3 bg-gray-3 rounded-xl pointer-events-none"></div>

          {/* Interactive Range Input */}
          <input
            type="range"
            min={1}
            max={maxFrames}
            value={currentFrame}
            onChange={(e) => setCurrentFrame(Number(e.target.value))}
            className={`absolute inset-0 w-full h-full appearance-none bg-transparent cursor-pointer z-20 transition-opacity duration-200 focus:outline-none ${thumbClasses} [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow [&::-webkit-slider-thumb]:transition-colors [&::-moz-range-thumb]:w-6 [&::-moz-range-thumb]:h-6 [&::-moz-range-thumb]:border-none [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:transition-colors`}
          />

          {/* Anomaly Markers */}
          {markerIslands.map((island) => {
            const startPercent = maxFrames > 1 ? ((island.start - 1) / (maxFrames - 1)) * 100 : 0;
            const startOffset = (thumbWidth / 2) - (startPercent / 100) * thumbWidth;
            
            const endPercent = maxFrames > 1 ? ((island.end - 1) / (maxFrames - 1)) * 100 : 0;
            const endOffset = (thumbWidth / 2) - (endPercent / 100) * thumbWidth;

            return (
              <div
                key={`island-${island.start}-${island.end}`}
                // Changed to flex-row to stack the different colored slices horizontally
                className="absolute h-3 top-1/2 -translate-y-1/2 flex flex-row pointer-events-none z-10 overflow-hidden"
                style={{ 
                  left: `calc(${startPercent}% + ${startOffset}px - 1px)`,
                  right: `calc(100% - (${endPercent}% + ${endOffset}px) - 1px)`
                }}
              >
                {/* Map through every slice inside this contiguous island */}
                {island.slices.map((sliceData) => (
                  <div key={sliceData.slice} className="flex-1 flex flex-col">
                    {sliceData.levels.map((lvl) => {
                      let bgClass = "bg-gray-1"; 
                      if (lvl === "lvl1") bgClass = "bg-red-1";
                      if (lvl === "lvl2") bgClass = "bg-yellow-1";
                      if (lvl === "lvl3") bgClass = "bg-purple-1";

                      return <div key={lvl} className={`w-full flex-1 ${bgClass}`} />;
                    })}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Info */}
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