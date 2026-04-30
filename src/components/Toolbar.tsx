// src/components/Toolbar.tsx
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

interface ToolbarProps {
  axis: "axial" | "sagittal" | "coronal";
  setAxis: (axis: "axial" | "sagittal" | "coronal") => void;
  currentFrame: number;
  maxFrames: number;
}

export default function Toolbar({ axis, setAxis, currentFrame, maxFrames }: ToolbarProps) {
  return (
    <>
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

      {/* Sub-toolbar (Overlay toggles & Slice counter) */}
      <div className="flex items-center justify-between px-4 py-4 absolute top-12 left-0 right-0 z-10 pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto">
          <div className="flex flex-row justify-between text-xs text-white bg-gray-3 border-gray-3 border-3 rounded">
            <div className="bg-gray-3 border-gray-3 rounded-l items-center my-auto mx-3 hidden sm:block">
              AI Overlay
            </div>
            <div className="flex bg-gray-10 rounded-r overflow-hidden text-xs">
              <button className="w-1/2 text-white px-2 py-1">ON</button>
              <button className="w-1/2 text-gray-1 px-2 py-1 hover:bg-gray-7">OFF</button>
            </div>
          </div>
        </div>
        <div className="text-white text-sm pointer-events-auto font-medium">
          Slice : {currentFrame} / {maxFrames}
        </div>
      </div>
    </>
  );
}