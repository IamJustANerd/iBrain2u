// src/components/ImportantSlider.tsx
import { useMemo } from "react";
import Comment from "../assets/icons/comment.svg";

interface ImportantSliderProps {
  currentFrame: number;
  setCurrentFrame: React.Dispatch<React.SetStateAction<number>>;
  maxFrames: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  analysisData?: any;
}

export default function ImportantSlider({
  currentFrame,
  setCurrentFrame,
  maxFrames,
  analysisData,
}: ImportantSliderProps) {
  // Group important slices by their frame number to handle overlaps
  const markersBySlice = useMemo(() => {
    const map: Record<number, string[]> = {};
    if (analysisData) {
      Object.keys(analysisData).forEach((levelKey) => {
        const levelInfo = analysisData[levelKey];
        if (levelInfo && Array.isArray(levelInfo.important_slice)) {
          levelInfo.important_slice.forEach((slice: number) => {
            if (!map[slice]) map[slice] = [];
            if (!map[slice].includes(levelKey)) {
              map[slice].push(levelKey);
            }
          });
        }
      });
    }
    Object.values(map).forEach((levels) => levels.sort());
    return map;
  }, [analysisData]);

  // Group ALL contiguous slices into "Islands"
  const markerIslands = useMemo(() => {
    const islands: { start: number; end: number; slices: { slice: number; levels: string[] }[] }[] = [];
    const sortedSlices = Object.keys(markersBySlice).map(Number).sort((a, b) => a - b);

    if (sortedSlices.length === 0) return islands;

    let currentIsland = {
      start: sortedSlices[0],
      end: sortedSlices[0],
      slices: [{ slice: sortedSlices[0], levels: markersBySlice[sortedSlices[0]] }],
    };

    for (let i = 1; i < sortedSlices.length; i++) {
      const slice = sortedSlices[i];
      const prevSlice = sortedSlices[i - 1];

      if (slice === prevSlice + 1) {
        currentIsland.end = slice;
        currentIsland.slices.push({ slice, levels: markersBySlice[slice] });
      } else {
        islands.push(currentIsland);
        currentIsland = {
          start: slice,
          end: slice,
          slices: [{ slice, levels: markersBySlice[slice] }],
        };
      }
    }
    islands.push(currentIsland);
    return islands;
  }, [markersBySlice]);

  const isCurrentFrameImportant = !!markersBySlice[currentFrame];
  const thumbClasses = isCurrentFrameImportant
    ? "opacity-50 [&::-webkit-slider-thumb]:bg-blue-1 [&::-moz-range-thumb]:bg-blue-1"
    : "opacity-50 [&::-webkit-slider-thumb]:bg-gray-1 [&::-moz-range-thumb]:bg-gray-1";

  const currentPositionPercent = maxFrames > 1 ? ((currentFrame - 1) / (maxFrames - 1)) * 100 : 0;
  const thumbWidth = 24; 
  const currentOffset = thumbWidth / 2 - (currentPositionPercent / 100) * thumbWidth;

  return (
    <div className="relative w-full z-20 pointer-events-auto">
      <div className="relative flex items-center w-full h-6">
        
        {/* Dialog Box (Comment Tooltip) */}
        <div
          className="absolute top-full flex justify-center items-center pointer-events-none z-30"
          style={{
            left: `calc(${currentPositionPercent}% + ${currentOffset}px)`,
            transform: "translateX(-10px)",
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
          const startOffset = thumbWidth / 2 - (startPercent / 100) * thumbWidth;
          const endPercent = maxFrames > 1 ? ((island.end - 1) / (maxFrames - 1)) * 100 : 0;
          const endOffset = thumbWidth / 2 - (endPercent / 100) * thumbWidth;

          return (
            <div
              key={`island-${island.start}-${island.end}`}
              className="absolute h-3 top-1/2 -translate-y-1/2 flex flex-row pointer-events-none z-10 overflow-hidden"
              style={{
                left: `calc(${startPercent}% + ${startOffset}px - 1px)`,
                right: `calc(100% - (${endPercent}% + ${endOffset}px) - 1px)`,
              }}
            >
              {island.slices.map((sliceData) => (
                <div key={sliceData.slice} className="flex-1 flex flex-col">
                  {sliceData.levels.map((lvl) => {
                    let bgClass = "bg-gray-1";
                    if (lvl === "diagnosis") bgClass = "bg-red-1";
                    if (lvl === "subtype") bgClass = "bg-yellow-1";
                    if (lvl === "stage") bgClass = "bg-purple-1";

                    return <div key={lvl} className={`w-full flex-1 ${bgClass}`} />;
                  })}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}