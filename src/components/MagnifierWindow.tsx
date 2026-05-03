// src/components/MagnifierWindow.tsx
import { useEffect, useRef, useState } from "react";

export interface MagnifierProps {
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

export default function MagnifierWindow({ 
  activeImageSrc, onClose, panOffset, zoomLevel, containerSize, 
  windowLevel, flipState, isInverted, rotation 
}: MagnifierProps) {
  
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