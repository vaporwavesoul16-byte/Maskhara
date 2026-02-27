import { SnapGuide } from '../utils/snap';

interface Props { guides: SnapGuide[]; }

export function SnapGuides({ guides }: Props) {
  if (!guides.length) return null;
  return (
    <>
      {guides.map((g, i) => {
        if (g.type === 'v') {
          return <div key={i} style={{ position:'absolute', left:g.pos, top:g.start, width:1, height:(g.end!-g.start!), background:'rgba(212,168,67,0.7)', pointerEvents:'none', zIndex:999, boxShadow:'0 0 4px rgba(212,168,67,0.4)' }} />;
        } else if (g.type === 'h') {
          return <div key={i} style={{ position:'absolute', left:g.start, top:g.pos, width:(g.end!-g.start!), height:1, background:'rgba(212,168,67,0.7)', pointerEvents:'none', zIndex:999, boxShadow:'0 0 4px rgba(212,168,67,0.4)' }} />;
        } else if (g.type === 'angle' && g.cx !== undefined && g.cy !== undefined && g.angleDeg !== undefined) {
          // Render angle guide as an SVG line
          const len = g.length ?? 400;
          const rad = (g.angleDeg * Math.PI) / 180;
          const x1 = g.cx - Math.cos(rad) * len, y1 = g.cy - Math.sin(rad) * len;
          const x2 = g.cx + Math.cos(rad) * len, y2 = g.cy + Math.sin(rad) * len;
          return (
            <svg key={i} style={{ position:'absolute', left:0, top:0, width:'100%', height:'100%', pointerEvents:'none', zIndex:999, overflow:'visible' }}>
              <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(212,168,67,0.7)" strokeWidth={1} />
            </svg>
          );
        }
        return null;
      })}
    </>
  );
}
