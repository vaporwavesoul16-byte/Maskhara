import { useState } from 'react';
import { GroupData } from '../types';
import { X, Lock } from 'lucide-react';

interface Props {
  group: GroupData;
  isSelected: boolean;
  onSelect: (e: React.MouseEvent) => void;
  onStartMove: (e: React.MouseEvent) => void;
  onStartResize: (e: React.MouseEvent, edge: string) => void;
  onUpdate: (patch: Partial<GroupData>) => void;
  onDelete: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
  onContextMenu: (e: React.MouseEvent) => void;
}

const EDGES = [
  { id:'n', style:{ top:0, left:12, right:12, height:8, cursor:'n-resize' } },
  { id:'s', style:{ bottom:0, left:12, right:12, height:8, cursor:'s-resize' } },
  { id:'e', style:{ right:0, top:12, bottom:12, width:8, cursor:'e-resize' } },
  { id:'w', style:{ left:0, top:12, bottom:12, width:8, cursor:'w-resize' } },
  { id:'ne', style:{ top:0, right:0, width:12, height:12, cursor:'ne-resize' } },
  { id:'nw', style:{ top:0, left:0, width:12, height:12, cursor:'nw-resize' } },
  { id:'se', style:{ bottom:0, right:0, width:12, height:12, cursor:'se-resize' } },
  { id:'sw', style:{ bottom:0, left:0, width:12, height:12, cursor:'sw-resize' } },
];

export function Group({ group, isSelected, onSelect, onStartMove, onStartResize, onUpdate, onDelete, onContextMenu }: Props) {
  const [editing, setEditing] = useState(false);
  const locked = !!group.locked;
  const hex = group.color;

  return (
    <div
      style={{ position:'absolute', left:group.x, top:group.y, width:group.width, height:group.height, background:`${hex}10`, border:`1.5px dashed ${isSelected?`${hex}90`:`${hex}40`}`, borderRadius:10, transition:'border-color 0.2s' }}
      onMouseDown={e=>{ onSelect(e); if(!locked) onStartMove(e); }}
      onContextMenu={e=>{ e.stopPropagation(); onContextMenu(e); }}
      onContextMenu={onContextMenu}
    >
      <div style={{ position:'absolute', top:-1, left:10, display:'flex', alignItems:'center', gap:6, background:'#141414', border:`1px solid ${hex}50`, borderRadius:'0 0 6px 6px', padding:'3px 8px', pointerEvents:'all' }}
        onMouseDown={e=>e.stopPropagation()}>
        <div style={{ position:'relative', width:10, height:10, borderRadius:'50%', background:hex, flexShrink:0, overflow:'hidden' }}>
          {!locked && <input type="color" value={hex} onChange={e=>onUpdate({color:e.target.value})} onClick={e=>e.stopPropagation()}
            style={{ position:'absolute', inset:0, opacity:0, width:'100%', height:'100%', cursor:'pointer', border:'none' }} />}
        </div>
        {editing && !locked
          ? <input autoFocus value={group.label} onChange={e=>onUpdate({label:e.target.value})}
              onBlur={()=>setEditing(false)} onKeyDown={e=>{ if(e.key==='Enter') setEditing(false); }}
              onClick={e=>e.stopPropagation()}
              style={{ background:'transparent', border:'none', outline:'none', fontSize:11, fontWeight:600, color:hex, fontFamily:'Syne, sans-serif', minWidth:60 }} />
          : <span onDoubleClick={e=>{ if(!locked){e.stopPropagation(); setEditing(true);} }}
              style={{ fontSize:11, fontWeight:600, color:hex, fontFamily:'Syne, sans-serif', cursor:locked?'default':'text', whiteSpace:'nowrap' }}>
              {group.label}
            </span>
        }
        {locked && <Lock size={9} style={{ color:'rgba(255,180,0,0.6)' }} />}
        {isSelected && !locked && (
          <button onClick={e=>{ e.stopPropagation(); onDelete(); }}
            style={{ background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.25)', display:'flex', padding:0, marginLeft:2 }}>
            <X size={10}/>
          </button>
        )}
      </div>
      {!locked && EDGES.map(({id,style}) => (
        <div key={id} style={{ position:'absolute', ...style, zIndex:10 }}
          onMouseDown={e=>{ e.stopPropagation(); onStartResize(e,id); }} />
      ))}
    </div>
  );
}
