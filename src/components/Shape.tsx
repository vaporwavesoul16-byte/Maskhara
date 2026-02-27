import { ShapeData } from '../types';
import { Lock, RotateCw } from 'lucide-react';

interface Props {
  shape: ShapeData;
  isSelected: boolean;
  onSelect: (e: React.MouseEvent) => void;
  onStartMove: (e: React.MouseEvent) => void;
  onStartResize: (e: React.MouseEvent, edge: string) => void;
  onStartRotate: (e: React.MouseEvent) => void;
  onDelete: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
}

const HANDLES = [
  { edge:'nw', style:{ top:-4, left:-4 } }, { edge:'n', style:{ top:-4, left:'50%', transform:'translateX(-50%)' } },
  { edge:'ne', style:{ top:-4, right:-4 } }, { edge:'e', style:{ top:'50%', right:-4, transform:'translateY(-50%)' } },
  { edge:'se', style:{ bottom:-4, right:-4 } }, { edge:'s', style:{ bottom:-4, left:'50%', transform:'translateX(-50%)' } },
  { edge:'sw', style:{ bottom:-4, left:-4 } }, { edge:'w', style:{ top:'50%', left:-4, transform:'translateY(-50%)' } },
];
const CURSOR: Record<string,string> = { nw:'nw-resize',n:'n-resize',ne:'ne-resize',e:'e-resize',se:'se-resize',s:'s-resize',sw:'sw-resize',w:'w-resize' };

export function Shape({ shape, isSelected, onSelect, onStartMove, onStartResize, onStartRotate, onDelete, onContextMenu }: Props) {
  const locked = !!shape.locked;
  const rot = shape.rotation ?? 0;

  return (
    <div
      onMouseDown={e=>{ onSelect(e); if(!locked) onStartMove(e); }}
      onContextMenu={onContextMenu}
      style={{
        position:'absolute', left:shape.x, top:shape.y, width:shape.width, height:shape.height,
        background: shape.fill === 'transparent' ? 'transparent' : shape.fill,
        border: `${shape.strokeWidth}px solid ${shape.stroke}`,
        borderRadius: 3,
        boxSizing: 'border-box',
        transform: rot ? `rotate(${rot}deg)` : undefined,
        transformOrigin: 'center center',
        boxShadow: isSelected ? '0 0 0 2px rgba(212,168,67,0.5)' : 'none',
        userSelect: 'none',
      }}
    >
      {/* Lock badge */}
      {locked && (
        <div style={{ position:'absolute', top:4, right:4, color:'rgba(255,180,0,0.7)' }}><Lock size={10}/></div>
      )}

      {/* Rotation handle */}
      {isSelected && !locked && (
        <div onMouseDown={e=>{ e.stopPropagation(); onStartRotate(e); }}
          style={{ position:'absolute', top:-32, left:'50%', transform:'translateX(-50%)', width:20, height:20, borderRadius:'50%', background:'rgba(14,14,14,0.9)', border:'1.5px solid rgba(212,168,67,0.6)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'grab', zIndex:20 }}>
          <RotateCw size={11} style={{ color:'#D4A843' }}/>
        </div>
      )}

      {/* Resize handles */}
      {isSelected && !locked && HANDLES.map(({edge,style}) => (
        <div key={edge} onMouseDown={e=>{ e.stopPropagation(); onStartResize(e,edge); }}
          style={{ position:'absolute', width:8, height:8, background:'#D4A843', border:'1.5px solid #0A0A0A', borderRadius:2, zIndex:10, cursor:CURSOR[edge], ...style } as React.CSSProperties} />
      ))}
    </div>
  );
}
