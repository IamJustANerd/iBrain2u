// src/components/Toolbar.tsx
import ArrowRight from "../assets/icons/gray/arrowRight.svg";
import Border from "../assets/icons/gray/border.svg";
import Circle from "../assets/icons/gray/circle.svg";
import Draw from "../assets/icons/gray/draw.svg";
import Grid from "../assets/icons/gray/grid.svg";
import Layer from "../assets/icons/gray/layer.svg";
import Mouse from "../assets/icons/blue/mouse.svg";
import ScrollMouse from "../assets/icons/gray/scrollMouse.svg"
import Move from "../assets/icons/gray/move.svg";
import Refresh from "../assets/icons/gray/refresh.svg";
import Ruler from "../assets/icons/gray/ruler.svg";
import Invert from "../assets/icons/gray/invert.svg";
import FlipHorizontal from "../assets/icons/gray/flipHorizontal.svg";
import FlipVertical from "../assets/icons/gray/flipVertical.svg";
import FlipRight from "../assets/icons/gray/flipRight.svg";
import Report from "../assets/icons/gray/report.svg";
import WindowLevel from "../assets/icons/gray/windowLevel.svg";
import Zoom from "../assets/icons/gray/zoom.svg";
import Dropdown from "../assets/icons/gray/dropdown.svg";

import ViewFull from "../assets/icons/gray/viewFull.svg";
import ViewVertical from "../assets/icons/gray/viewVertical.svg";
import ViewHorizontal from "../assets/icons/gray/viewHorizontal.svg";
import View1Plus2 from "../assets/icons/gray/view1+2.svg";
import View2Plus1 from "../assets/icons/gray/view2+1.svg";
import View2x2 from "../assets/icons/gray/view2x2.svg";
import View3x1 from "../assets/icons/gray/view3x1.svg";

// NEW DRAW TOOL IMPORTS (Assumes standard naming matching your sequence)
import Distance from "../assets/icons/gray/distance.svg";
import Angle from "../assets/icons/gray/angle.svg";
import Elliptical from "../assets/icons/gray/elliptical.svg";
import Ellipse from "../assets/icons/gray/ellipse.svg";
import Rectangle from "../assets/icons/gray/rectangle.svg";
import DrawText from "../assets/icons/gray/drawText.svg";
import Arrow from "../assets/icons/gray/arrow.svg";

interface ToolbarProps {
  axis: "axial" | "sagittal" | "coronal";
  setAxis: (axis: "axial" | "sagittal" | "coronal") => void;
  currentFrame: number;
  maxFrames: number;
  activeTool: string;
  setActiveTool: (tool: string) => void;
  zoomLevel: number;
  setZoomLevel: (zoom: number | ((prev: number) => number)) => void;
  setIsMagnifierOpen: (isOpen: boolean) => void;
  flipState: { horizontal: boolean; vertical: boolean };
  setFlipState: React.Dispatch<React.SetStateAction<{ horizontal: boolean; vertical: boolean }>>;
  activeFlipMode: "horizontal" | "vertical";
  setActiveFlipMode: React.Dispatch<React.SetStateAction<"horizontal" | "vertical">>;
  isInverted: boolean;
  setIsInverted: React.Dispatch<React.SetStateAction<boolean>>;
  rotation: number;
  setRotation: React.Dispatch<React.SetStateAction<number>>;
  layout: string;
  setLayout: (layout: string) => void;
}

export default function Toolbar({ 
  axis, setAxis, currentFrame, maxFrames, 
  activeTool, setActiveTool, 
  zoomLevel, setZoomLevel, setIsMagnifierOpen,
  flipState, setFlipState, activeFlipMode,
  setActiveFlipMode, isInverted, setIsInverted,
  rotation, setRotation, layout, setLayout
}: ToolbarProps) {

  const getButtonClass = (toolName: string) => {
    const baseClass = "p-1 rounded h-5 w-5 sm:h-8 sm:w-8 shrink-0 flex items-center justify-center transition-colors";
    return activeTool === toolName ? `${baseClass} bg-gray-4` : `${baseClass} hover:bg-gray-6`;
  };

  const getLayoutIcon = (l: string) => {
    switch(l) {
      case "vertical": return ViewVertical;
      case "horizontal": return ViewHorizontal;
      case "1+2": return View1Plus2;
      case "2+1": return View2Plus1;
      case "2x2": return View2x2;
      case "3x1": return View3x1;
      default: return ViewFull;
    }
  };

  // Helper to dynamically show the correct icon for the selected draw tool
  const getActiveDrawIcon = () => {
    switch(activeTool) {
      case "distance": return Distance;
      case "angle": return Angle;
      case "elliptical": return Elliptical;
      case "ellipse": return Ellipse;
      case "rectangle": return Rectangle;
      case "drawText": return DrawText;
      case "arrow": return Arrow;
      case "draw": 
      default: return Draw;
    }
  };

  return (
    <>
      {/* OVERFLOW VISIBLE: Essential for Dropdowns */}
      <div className="h-8 sm:h-12 border-b-0 border-gray-6 bg-gray-7 flex items-center justify-between px-4 overflow-visible">
        <div className="flex items-center gap-4 text-gray-1 shrink-0 h-full">
          
          <button className={getButtonClass("mouse")} onClick={() => setActiveTool("mouse")}>
            <img src={Mouse} className="h-3 w-4.5 sm:h-5 sm:w-6.5" alt="Mouse" />
          </button>
          <button className={getButtonClass("move")} onClick={() => setActiveTool("move")}>
            <img src={Move} className="h-3 w-4.5 sm:h-5 sm:w-6.5" alt="Move" />
          </button>
          <button className={getButtonClass("scrollMouse")} onClick={() => setActiveTool("scrollMouse")}>
            <img src={ScrollMouse} className="h-3 w-4.5 sm:h-5 sm:w-6.5" alt="Scroll" />
          </button>
          
          <img src={Border} className="h-3 w-4.5 sm:h-5 sm:w-6.5" alt="Separator" />
          
          {/* LAYOUT DROPDOWN */}
          <div className="relative group flex items-center h-full">
            <button className="p-1 rounded h-5 w-5 sm:h-8 sm:w-8 shrink-0 flex items-center justify-center transition-colors hover:bg-gray-6 cursor-pointer">
              <img src={getLayoutIcon(layout)} className="h-3 w-4.5 sm:h-5 sm:w-6.5 object-contain" alt="Layout" />
              <img src={Dropdown} className="w-2 h-2 ml-0.5" alt="Dropdown Arrow" />
            </button>
            <div className="absolute hidden group-hover:flex top-full left-0 z-50 pt-2">
              <div className="bg-gray-7 border border-gray-5 rounded shadow-xl overflow-hidden flex flex-col p-1.5 gap-1.5 min-w-max">
                {[
                  { id: "full", icon: ViewFull },
                  { id: "vertical", icon: ViewVertical },
                  { id: "horizontal", icon: ViewHorizontal },
                  { id: "1+2", icon: View1Plus2 },
                  { id: "2+1", icon: View2Plus1 },
                  { id: "2x2", icon: View2x2 },
                  { id: "3x1", icon: View3x1 }
                ].map((item) => (
                  <button key={item.id} className={`h-8 w-10 sm:h-10 sm:w-12 shrink-0 rounded flex items-center justify-center transition-colors ${layout === item.id ? 'bg-gray-5' : 'hover:bg-gray-6'}`} onClick={() => setLayout(item.id)}>
                    <img src={item.icon} className="h-4 w-5 sm:h-5 sm:w-7 object-contain" alt={item.id} />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button className={getButtonClass("grid")} onClick={() => setActiveTool("grid")}>
            <img src={Grid} className="h-3 w-4.5 sm:h-5 sm:w-6.5" alt="Grid" />
          </button>

          {/* ZOOM DROPDOWN */}
          <div className="relative group flex items-center h-full">
            <div className={`p-1 rounded h-5 w-5 sm:h-8 sm:w-8 shrink-0 flex items-center justify-center transition-colors cursor-pointer ${activeTool === "manualZoom" ? "bg-gray-4" : "hover:bg-gray-6 group-hover:bg-gray-6"}`} onClick={() => setActiveTool("manualZoom")}>
              <img src={Zoom} className="h-3 w-4.5 sm:h-5 sm:w-6.5" alt="Zoom" />
              <img src={Dropdown} className="w-2 h-2 ml-0.5" alt="Dropdown Arrow"></img>
            </div>
            <div className="absolute hidden group-hover:block top-full left-0 z-50 pt-2">
              <div className="bg-gray-7 border border-gray-5 rounded shadow-xl min-w-[180px] text-sm text-gray-200 overflow-hidden flex flex-col">
                <button className="w-full text-left px-4 py-2 hover:bg-gray-5 hover:text-white transition-colors" onClick={() => { setZoomLevel(1); setIsMagnifierOpen(false); }}>Zoom to Fit</button>
                <button className="w-full text-left px-4 py-2 hover:bg-gray-5 hover:text-white transition-colors" onClick={() => { setActiveTool("manualZoom"); setIsMagnifierOpen(false); }}>Manual Zoom</button>
                <button className="w-full text-left px-4 py-2 hover:bg-gray-5 hover:text-white transition-colors" onClick={() => { setZoomLevel(2); setIsMagnifierOpen(false); }}>2x</button>
                <button className="w-full text-left px-4 py-2 hover:bg-gray-5 hover:text-white transition-colors" onClick={() => { setZoomLevel(3); setIsMagnifierOpen(false); }}>3x</button>
                <button className="w-full text-left px-4 py-2 hover:bg-gray-5 hover:text-white transition-colors" onClick={() => { setZoomLevel(4); setIsMagnifierOpen(false); }}>4x</button>
                <button className="w-full text-left px-4 py-2 hover:bg-blue-600 hover:text-white transition-colors border-t border-gray-5 bg-gray-8 text-blue-300 font-medium" onClick={() => setIsMagnifierOpen(true)}>Magnifying Glass</button>
              </div>
            </div>
          </div>

          <img src={Border} className="h-3 w-4.5 sm:h-5 sm:w-6.5" alt="Separator" />
          
          <button className={getButtonClass("windowLevel")} onClick={() => setActiveTool("windowLevel")}>
            <img src={WindowLevel} className="h-3 w-4.5 sm:h-5 sm:w-6.5" alt="Window Level" />
          </button>
          
          <button className={`p-1 rounded h-5 w-5 sm:h-8 sm:w-8 shrink-0 flex items-center justify-center transition-colors ${isInverted ? 'bg-gray-4' : 'hover:bg-gray-6'}`} onClick={() => setIsInverted(prev => !prev)}>
            <img src={Invert} className="h-3 w-4.5 sm:h-5 sm:w-6.5" alt="Invert" />
          </button>

          {/* FLIP DROPDOWN */}
          <div className="relative group flex items-center h-full">
            <button className="p-1 rounded h-5 w-5 sm:h-8 sm:w-8 shrink-0 flex items-center justify-center transition-colors hover:bg-gray-6 cursor-pointer" onClick={() => {
                if (activeFlipMode === "horizontal") setFlipState(prev => ({ ...prev, horizontal: !prev.horizontal }));
                else setFlipState(prev => ({ ...prev, vertical: !prev.vertical }));
              }}>
              <img src={activeFlipMode === "horizontal" ? FlipHorizontal : FlipVertical} className="h-3 w-4.5 sm:h-5 sm:w-6.5" alt="Flip" />
              <img src={Dropdown} className="w-2 h-2 ml-0.5" alt="Dropdown Arrow" />
            </button>
            <div className="absolute hidden group-hover:block top-full left-0 z-50 pt-2">
              <div className="bg-gray-7 border border-gray-5 rounded shadow-xl min-w-[150px] text-sm text-gray-200 overflow-hidden flex flex-col">
                <button className="w-full flex items-center px-4 py-2 hover:bg-gray-5 hover:text-white transition-colors" onClick={() => {
                    const newMode = activeFlipMode === "horizontal" ? "vertical" : "horizontal";
                    setActiveFlipMode(newMode);
                    if (newMode === "horizontal") setFlipState(prev => ({ ...prev, horizontal: !prev.horizontal }));
                    else setFlipState(prev => ({ ...prev, vertical: !prev.vertical }));
                  }}>
                  <img src={activeFlipMode === "horizontal" ? FlipVertical : FlipHorizontal} className="h-4 w-4 mr-3" alt="Other Flip" />
                  {activeFlipMode === "horizontal" ? "Flip Vertical" : "Flip Horizontal"}
                </button>
                <button className="w-full flex items-center px-4 py-2 hover:bg-gray-5 hover:text-white transition-colors border-t border-gray-5" onClick={() => setRotation((prev: number) => prev + 90)}>
                  <img src={FlipRight} className="h-4 w-4 mr-3" alt="Flip Right" />
                  Rotate Right 90°
                </button>
              </div>
            </div>
          </div>
          
          {/* NEW DRAW DROPDOWN */}
          <div className="relative group flex items-center h-full">
            <button className="p-1 rounded h-5 w-5 sm:h-8 sm:w-8 shrink-0 flex items-center justify-center transition-colors hover:bg-gray-6 cursor-pointer">
              <img src={getActiveDrawIcon()} className="h-3 w-4.5 sm:h-5 sm:w-6.5 object-contain" alt="Draw Menu" />
              <img src={Dropdown} className="w-2 h-2 ml-0.5" alt="Dropdown Arrow" />
            </button>
            
            <div className="absolute hidden group-hover:flex top-full left-0 z-50 pt-2">
              <div className="bg-gray-7 border border-gray-5 rounded shadow-xl overflow-hidden flex flex-col p-1.5 gap-1.5 min-w-max">
                {[
                  { id: "distance", icon: Distance },
                  { id: "angle", icon: Angle },
                  { id: "elliptical", icon: Elliptical },
                  { id: "draw", icon: Draw },
                  { id: "ellipse", icon: Ellipse },
                  { id: "rectangle", icon: Rectangle },
                  { id: "drawText", icon: DrawText },
                  { id: "arrow", icon: Arrow }
                ].map((item) => (
                  <button 
                    key={item.id} 
                    className={`h-8 w-10 sm:h-10 sm:w-12 shrink-0 rounded flex items-center justify-center transition-colors ${activeTool === item.id ? 'bg-gray-4' : 'hover:bg-gray-6'}`} 
                    onClick={() => setActiveTool(item.id)}
                  >
                    <img src={item.icon} className="h-4 w-5 sm:h-5 sm:w-7 object-contain" alt={item.id} />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button className="p-1 shrink-0"><img src={Report} className="h-3 w-4.5 sm:h-5 sm:w-6.5" alt="Report" /></button>
          <button className="p-1 shrink-0"><img src={Refresh} className="h-3 w-4.5 sm:h-5 sm:w-6.5" alt="Refresh" /></button>
        </div>

        {/* View Switcher */}
        <div className="hidden lg:flex w-2/10 text-[11px] justify-between px-4 font-semibold text-white bg-gray-10 h-9 border-gray-5 border-3 rounded gap-4 ml-4 shrink-0">
          <button className={`flex-1 ${axis === "axial" ? "text-blue-400" : "hover:text-white"}`} onClick={() => setAxis("axial")}>AXIAL</button>
          <button className={`flex-1 ${axis === "sagittal" ? "text-blue-400" : "hover:text-white"}`} onClick={() => setAxis("sagittal")}>SAGITTAL</button>
          <button className={`flex-1 ${axis === "coronal" ? "text-blue-400" : "hover:text-white"}`} onClick={() => setAxis("coronal")}>CORONAL</button>
        </div>
      </div>
    </>
  );
}