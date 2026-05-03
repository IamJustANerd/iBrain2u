// src/components/AnnotationOverlay.tsx
import type { Annotation } from "./ViewerCanvas";

interface AnnotationOverlayProps {
  annotations: Annotation[];
  localAnnotation: Annotation | null;
  getImageToScreen: (ix: number, iy: number) => { x: number; y: number };
}

export default function AnnotationOverlay({ annotations, localAnnotation, getImageToScreen }: AnnotationOverlayProps) {
  
  const TextShadow = ({ x, y, text }: { x: number, y: number, text: string }) => (
    <text x={x} y={y} fill="currentColor" fontSize="16" fontWeight="bold" textAnchor="middle" style={{ filter: "drop-shadow(1px 1px 2px rgba(0,0,0,0.8))" }}>
      {text}
    </text>
  );

  const renderAnnotation = (a: Annotation, isLocal: boolean) => {
    const colorClass = isLocal 
      ? "text-[#facc15] pointer-events-none" 
      : "text-[#3b82f6] hover:text-[#facc15] cursor-pointer pointer-events-auto group";

    if (a.type === 'distance' && a.points.length >= 2) {
      const p0 = getImageToScreen(a.points[0].x, a.points[0].y);
      const p1 = getImageToScreen(a.points[1].x, a.points[1].y);
      const rawPxDistance = Math.hypot(a.points[1].x - a.points[0].x, a.points[1].y - a.points[0].y);
      const cmDistance = (rawPxDistance * 0.05).toFixed(2); 

      return (
        <g key={a.id} className={colorClass}>
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

        const v1x = a.points[1].x - a.points[0].x, v1y = a.points[1].y - a.points[0].y;
        const v2x = a.points[3].x - a.points[2].x, v2y = a.points[3].y - a.points[2].y;
        const dot = v1x * v2x + v1y * v2y;
        const mag1 = Math.hypot(v1x, v1y);
        const mag2 = Math.hypot(v2x, v2y);
        
        let angle = Math.acos(dot / (mag1 * mag2)) * (180 / Math.PI);
        if (angle > 90) angle = 180 - angle;

        const denominator = (p0.x - p1.x) * (p2.y - p3.y) - (p0.y - p1.y) * (p2.x - p3.x);
        
        if (denominator !== 0) {
          const t = ((p0.x - p2.x) * (p2.y - p3.y) - (p0.y - p2.y) * (p2.x - p3.x)) / denominator;
          const intersectX = p0.x + t * (p1.x - p0.x);
          const intersectY = p0.y + t * (p1.y - p0.y);

          const mid1X = (p0.x + p1.x) / 2;
          const mid1Y = (p0.y + p1.y) / 2;
          const mid2X = (p2.x + p3.x) / 2;
          const mid2Y = (p2.y + p3.y) / 2;

          angleInfo = (
            <>
              <line x1={mid1X} y1={mid1Y} x2={intersectX} y2={intersectY} stroke="currentColor" strokeWidth="1.5" strokeDasharray="5,5" className="pointer-events-none" />
              <line x1={mid2X} y1={mid2Y} x2={intersectX} y2={intersectY} stroke="currentColor" strokeWidth="1.5" strokeDasharray="5,5" className="pointer-events-none" />
              <TextShadow x={intersectX - 20} y={intersectY + 5} text={`${angle.toFixed(1)}°`} />
            </>
          );
        } else {
           angleInfo = <TextShadow x={(p0.x + p2.x) / 2} y={(p0.y + p2.y) / 2} text="0.0°" />;
        }
      }

      return (
        <g key={a.id} className={colorClass}>
          <line x1={p0.x} y1={p0.y} x2={p1.x} y2={p1.y} stroke="transparent" strokeWidth="15" />
          <line x1={p0.x} y1={p0.y} x2={p1.x} y2={p1.y} stroke="currentColor" strokeWidth="2" className="pointer-events-none" />
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

    if (a.type === 'ellipse' && a.points.length >= 2) {
      const p0 = getImageToScreen(a.points[0].x, a.points[0].y);
      const p1 = getImageToScreen(a.points[1].x, a.points[1].y);
      const cx = (p0.x + p1.x) / 2;
      const cy = (p0.y + p1.y) / 2;
      const rx = Math.abs(p1.x - p0.x) / 2;
      const ry = Math.abs(p1.y - p0.y) / 2;

      return (
        <g key={a.id} className={colorClass}>
          <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="transparent" stroke="transparent" strokeWidth="15" />
          <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="transparent" stroke="currentColor" strokeWidth="2" className="pointer-events-none" />
        </g>
      );
    }

    if (a.type === 'rectangle' && a.points.length >= 2) {
      const p0 = getImageToScreen(a.points[0].x, a.points[0].y);
      const p1 = getImageToScreen(a.points[1].x, a.points[1].y);
      const x = Math.min(p0.x, p1.x);
      const y = Math.min(p0.y, p1.y);
      const width = Math.abs(p1.x - p0.x);
      const height = Math.abs(p1.y - p0.y);

      return (
        <g key={a.id} className={colorClass}>
          <rect x={x} y={y} width={width} height={height} fill="transparent" stroke="transparent" strokeWidth="15" />
          <rect x={x} y={y} width={width} height={height} fill="transparent" stroke="currentColor" strokeWidth="2" className="pointer-events-none" />
        </g>
      );
    }

    if (a.type === 'elliptical' && a.points.length >= 2) {
      const p0 = getImageToScreen(a.points[0].x, a.points[0].y);
      const p1 = getImageToScreen(a.points[1].x, a.points[1].y);

      const xMin = Math.min(p0.x, p1.x);
      const yMin = Math.min(p0.y, p1.y);
      const xMax = Math.max(p0.x, p1.x);
      const yMax = Math.max(p0.y, p1.y);
      
      const cx = (p0.x + p1.x) / 2;
      const cy = (p0.y + p1.y) / 2;
      const rx = Math.abs(p1.x - p0.x) / 2;
      const ry = Math.abs(p1.y - p0.y) / 2;

      const areaCm = (Math.PI * (rx * 0.05) * (ry * 0.05)).toFixed(2);
      const simulatedMean = Math.floor((rx * ry * 0.8) % 50000);
      const simulatedError = Math.floor(Math.sqrt(rx * ry) % 5000);

      const boxW = 140;
      const boxH = 45;
      const boxX = xMax;
      const boxY = yMax;

      return (
        <g key={a.id} className={colorClass}>
          <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="transparent" stroke="transparent" strokeWidth="15" />
          <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="transparent" stroke="currentColor" strokeWidth="2" className="pointer-events-none" />
          
          <rect x={xMin} y={yMin} width={xMax - xMin} height={yMax - yMin} fill="transparent" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4,4" className="pointer-events-none opacity-80" />
          <line x1={cx} y1={cy} x2={cx} y2={yMax} stroke="currentColor" strokeWidth="1.5" strokeDasharray="4,4" className="pointer-events-none opacity-80" />

          <g className="pointer-events-none">
            <rect x={boxX} y={boxY} width={boxW} height={boxH} fill="rgba(0,0,0,0.5)" stroke="currentColor" strokeWidth="1" />
            <text x={boxX + 5} y={boxY + 20} fill="currentColor" fontSize="16" fontWeight="bold">
              {simulatedMean} ± {simulatedError}
            </text>
            <text x={boxX + 5} y={boxY + 40} fill="currentColor" fontSize="14" fontWeight="bold">
              A : {areaCm} cm²
            </text>
          </g>
        </g>
      );
    }

    // NEW: Freehand Drawing Tool (maps continuous array of points)
    if (a.type === 'draw' && a.points.length >= 2) {
      const screenPoints = a.points.map(p => getImageToScreen(p.x, p.y));
      const pointsString = screenPoints.map(p => `${p.x},${p.y}`).join(' ');

      return (
        <g key={a.id} className={colorClass}>
          {/* Transparent hit-box so it is easy to hover/select later */}
          <polyline points={pointsString} fill="none" stroke="transparent" strokeWidth="15" strokeLinecap="round" strokeLinejoin="round" />
          <polyline points={pointsString} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="pointer-events-none" />
        </g>
      );
    }

    // NEW: Arrow Tool
    if (a.type === 'arrow' && a.points.length >= 2) {
      // points[0] is the Head (where you first click), points[1] is the Dragging Tail
      const head = getImageToScreen(a.points[0].x, a.points[0].y);
      const tail = getImageToScreen(a.points[1].x, a.points[1].y);

      // Trigonometry to perfectly orient the arrowhead dynamically
      const angle = Math.atan2(tail.y - head.y, tail.x - head.x);
      const headLen = 15;
      const arrowP1 = { 
        x: head.x + headLen * Math.cos(angle - Math.PI / 6), 
        y: head.y + headLen * Math.sin(angle - Math.PI / 6) 
      };
      const arrowP2 = { 
        x: head.x + headLen * Math.cos(angle + Math.PI / 6), 
        y: head.y + headLen * Math.sin(angle + Math.PI / 6) 
      };

      return (
        <g key={a.id} className={colorClass}>
          <line x1={tail.x} y1={tail.y} x2={head.x} y2={head.y} stroke="transparent" strokeWidth="15" />
          <line x1={tail.x} y1={tail.y} x2={head.x} y2={head.y} stroke="currentColor" strokeWidth="2" className="pointer-events-none" />
          <polygon points={`${head.x},${head.y} ${arrowP1.x},${arrowP1.y} ${arrowP2.x},${arrowP2.y}`} fill="currentColor" className="pointer-events-none" />
        </g>
      );
    }

    // NEW: Finalized Text Rendering (when it's no longer an input box)
    if (a.type === 'drawText' && a.text) {
      const pt = getImageToScreen(a.points[0].x, a.points[0].y);
      return (
        <g key={a.id} className={colorClass}>
          <text x={pt.x} y={pt.y} fill="currentColor" fontSize="20" fontWeight="bold" textAnchor="start" style={{ filter: "drop-shadow(1px 1px 2px rgba(0,0,0,0.8))" }}>
            {a.text}
          </text>
        </g>
      );
    }

    return null;
  };

  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none z-20 overflow-visible">
      {annotations.map((a) => renderAnnotation(a, false))}
      {localAnnotation && renderAnnotation(localAnnotation, true)}
    </svg>
  );
}