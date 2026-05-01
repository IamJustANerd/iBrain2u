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
import FlipHorizontal from "../assets/icons/gray/flip_horizontal.svg";
import FlipVertical from "../assets/icons/gray/flip_vertical.svg";
import WindowLevel from "../assets/icons/gray/window-level.svg";
import Undo from "../assets/icons/gray/undo.svg";
import Zoom from "../assets/icons/gray/zoom.svg";
import Dropdown from "../assets/icons/gray/dropdown.svg"

interface ToolbarProps {
  axis: "axial" | "sagittal" | "coronal";
  setAxis: (axis: "axial" | "sagittal" | "coronal") => void;
  currentFrame: number;
  maxFrames: number;
  activeTool: string;
  setActiveTool: (tool: string) => void;
  zoomLevel: number;
  setZoomLevel: (zoom: number) => void;
  setIsMagnifierOpen: (isOpen: boolean) => void;
  flipState: { horizontal: boolean; vertical: boolean };
  setFlipState: React.Dispatch<React.SetStateAction<{ horizontal: boolean; vertical: boolean }>>;
  activeFlipMode: "horizontal" | "vertical";
  setActiveFlipMode: React.Dispatch<React.SetStateAction<"horizontal" | "vertical">>;
}

export default function Toolbar({ 
  axis, setAxis, currentFrame, maxFrames, 
  activeTool, setActiveTool, 
  zoomLevel, setZoomLevel, setIsMagnifierOpen,
  flipState, setFlipState, activeFlipMode, setActiveFlipMode
}: ToolbarProps) {

  const getButtonClass = (toolName: string) => {
    const baseClass = "p-1 rounded h-5 w-5 sm:h-8 sm:w-8 shrink-0 flex items-center justify-center transition-colors";
    return activeTool === toolName ? `${baseClass} bg-gray-4` : `${baseClass} hover:bg-gray-6`;
  };

  return (
    <>
      <div className="h-8 sm:h-12 border-b-0 border-gray-6 bg-gray-7 flex items-center justify-between px-4 overflow-visible z-50">
        <div className="flex items-center gap-4 text-gray-1 shrink-0 h-full">
          
          <button className={getButtonClass("mouse")} onClick={() => setActiveTool("mouse")}>
            <img src={Mouse} className="h-3 w-4.5 sm:h-5 sm:w-6.5" alt="Mouse" />
          </button>
          <button className={getButtonClass("move")} onClick={() => setActiveTool("move")}>
            <img src={Move} className="h-3 w-4.5 sm:h-5 sm:w-6.5" alt="Move" />
          </button>
          
          {/* ZOOM HOVER DROPDOWN */}
          <div className="relative group flex items-center h-full">
            {/* 
              The icon acts as a hover target. 
              Added group-hover:bg-gray-6 so it stays lit up when interacting with the menu! 
            */}
            <div className="p-1 rounded h-5 w-5 sm:h-8 sm:w-8 shrink-0 flex items-center justify-center transition-colors group-hover:bg-gray-6 cursor-default">
              <img src={Zoom} className="h-3 w-4.5 sm:h-5 sm:w-6.5" alt="Zoom" />
              <img src={Dropdown} className=""></img>
            </div>
            
            {/* 
              The Dropdown Menu 
              Fix: Changed mt-1 to pt-2. This creates an invisible hit-box that connects 
              the icon directly to the menu so the hover state never breaks.
            */}
            <div className="absolute hidden group-hover:block top-full left-0 z-50 pt-2">
              <div className="bg-gray-7 border border-gray-5 rounded shadow-xl min-w-[180px] text-sm text-gray-200 overflow-hidden flex flex-col">
                <button 
                  className="w-full text-left px-4 py-2 hover:bg-gray-5 hover:text-white transition-colors"
                  onClick={() => { setZoomLevel(1); setIsMagnifierOpen(false); }}
                >
                  Zoom to Fit
                </button>
                <button 
                  className="w-full text-left px-4 py-2 hover:bg-gray-5 hover:text-white transition-colors"
                  onClick={() => { setZoomLevel(2); setIsMagnifierOpen(false); }}
                >
                  2x
                </button>
                <button 
                  className="w-full text-left px-4 py-2 hover:bg-gray-5 hover:text-white transition-colors"
                  onClick={() => { setZoomLevel(3); setIsMagnifierOpen(false); }}
                >
                  3x
                </button>
                <button 
                  className="w-full text-left px-4 py-2 hover:bg-gray-5 hover:text-white transition-colors"
                  onClick={() => { setZoomLevel(4); setIsMagnifierOpen(false); }}
                >
                  4x
                </button>
                <button 
                  className="w-full text-left px-4 py-2 hover:bg-blue-600 hover:text-white transition-colors border-t border-gray-5 bg-gray-8 text-blue-300 font-medium"
                  onClick={() => setIsMagnifierOpen(true)}
                >
                  Magnifying Glass
                </button>
              </div>
            </div>
          </div>
          
          <button className={getButtonClass("layer")} onClick={() => setActiveTool("layer")}>
            <img src={Layer} className="h-3 w-4.5 sm:h-5 sm:w-6.5" alt="Layer" />
          </button>
          
          <img src={Border} className="h-3 w-4.5 sm:h-5 sm:w-6.5" alt="Separator" />
          
          <button className={getButtonClass("grid1")} onClick={() => setActiveTool("grid1")}>
            <img src={Grid1} className="h-3 w-4.5 sm:h-5 sm:w-6.5" alt="Grid1" />
          </button>
          <button className={getButtonClass("grid4")} onClick={() => setActiveTool("grid4")}>
            <img src={Grid4} className="h-3 w-4.5 sm:h-5 sm:w-6.5" alt="Grid4" />
          </button>
          <button className="p-1 shrink-0"><img src={Undo} className="h-3 w-4.5 sm:h-5 sm:w-6.5" alt="Undo" /></button>
          <button className="p-1 shrink-0"><img src={Redo} className="h-3 w-4.5 sm:h-5 sm:w-6.5" alt="Redo" /></button>
          <img src={Border} className="h-3 w-4.5 sm:h-5 sm:w-6.5" alt="Separator" />
          <button 
            className={getButtonClass("windowLevel")} 
            onClick={() => setActiveTool("windowLevel")}
          >
            <img src={WindowLevel} className="h-3 w-4.5 sm:h-5 sm:w-6.5" alt="Window Level" />
          </button>
          <button className="p-1 shrink-0"><img src={Draw} className="h-3 w-4.5 sm:h-5 sm:w-6.5" alt="Draw" /></button>
          {/* FLIP HOVER DROPDOWN */}
          <div className="relative group flex items-center h-full">
            <button 
              className="p-1 rounded h-5 w-5 sm:h-8 sm:w-8 shrink-0 flex items-center justify-center transition-colors hover:bg-gray-6 cursor-pointer"
              onClick={() => {
                if (activeFlipMode === "horizontal") {
                  setFlipState(prev => ({ ...prev, horizontal: !prev.horizontal }));
                } else {
                  setFlipState(prev => ({ ...prev, vertical: !prev.vertical }));
                }
              }}
            >
              <img src={activeFlipMode === "horizontal" ? FlipHorizontal : FlipVertical} className="h-3 w-4.5 sm:h-5 sm:w-6.5" alt="Flip" />
              <img src={Dropdown} className="w-2 h-2 ml-0.5" alt="Dropdown Arrow" />
            </button>
            
            <div className="absolute hidden group-hover:block top-full left-0 z-50 pt-2">
              <div className="bg-gray-7 border border-gray-5 rounded shadow-xl min-w-[150px] text-sm text-gray-200 overflow-hidden flex flex-col">
                <button 
                  className="w-full flex items-center px-4 py-2 hover:bg-gray-5 hover:text-white transition-colors"
                  onClick={() => {
                    // Set the new mode AND immediately execute the flip
                    const newMode = activeFlipMode === "horizontal" ? "vertical" : "horizontal";
                    setActiveFlipMode(newMode);
                    if (newMode === "horizontal") {
                      setFlipState(prev => ({ ...prev, horizontal: !prev.horizontal }));
                    } else {
                      setFlipState(prev => ({ ...prev, vertical: !prev.vertical }));
                    }
                  }}
                >
                  <img src={activeFlipMode === "horizontal" ? FlipVertical : FlipHorizontal} className="h-4 w-4 mr-3" alt="Other Flip" />
                  {activeFlipMode === "horizontal" ? "Flip Vertical" : "Flip Horizontal"}
                </button>
              </div>
            </div>
          </div>
          <button className="p-1 shrink-0"><img src={Refresh} className="h-3 w-4.5 sm:h-5 sm:w-6.5" alt="Refresh" /></button>

        </div>

        {/* View Switcher */}
        <div className="hidden lg:flex w-2/10 text-[11px] justify-between px-4 font-semibold text-white bg-gray-10 h-9 border-gray-5 border-3 rounded gap-4 ml-4 shrink-0">
          <button className={`flex-1 ${axis === "axial" ? "text-blue-400" : "hover:text-white"}`} onClick={() => setAxis("axial")}>AXIAL</button>
          <button className={`flex-1 ${axis === "sagittal" ? "text-blue-400" : "hover:text-white"}`} onClick={() => setAxis("sagittal")}>SAGITTAL</button>
          <button className={`flex-1 ${axis === "coronal" ? "text-blue-400" : "hover:text-white"}`} onClick={() => setAxis("coronal")}>CORONAL</button>
        </div>
      </div>

      {/* Sub-toolbar */}
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
        <div className="text-white text-sm pointer-events-auto font-medium">
          Slice : {currentFrame} / {maxFrames}
        </div>
      </div>
    </>
  );
}