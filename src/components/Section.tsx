import { useState } from 'react';
import { SectionData, SECTION_ACCENT, SECTION_BG } from '../types';
import { Lock, RotateCw } from 'lucide-react';

interface Props {
  section: SectionData; isSelected: boolean; zoom: number;
  onSelect: (e: React.MouseEvent) => void;
  onStartMove: (e: React.MouseEvent) => void;
  onStartResize: (e: React.MouseEvent, edge: string) => void;
  onStartRotate: (e: React.MouseEvent) => void;
  onUpdate: (patch: Partial<SectionData>) => void;
  onDelete: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
}

const EDGES = [
  { id:'n',  style:{ top:0, left:12, right:12, height:10, cursor:'n-resize' } },
  { id:'s',  style:{ bottom:0, left:12, right:12, height:10, cursor:'s-resize' } },
  { id:'e',  style:{ right:0, top:12, bottom:12, width:10, cursor:'e-resize' } },
  { id:'w',  style:{ left:0, top:12, bottom:12, width:10, cursor:'w-resize' } },
  { id:'ne', style:{ top:0, right:0, width:12, height:12, cursor:'ne-resize' } },
  { id:'nw', style:{ top:0, left:0, width:12, height:12, cursor:'nw-resize' } },
  { id:'se', style:{ bottom:0, right:0, width:12, height:12, cursor:'se-resize' } },
  { id:'sw', style:{ bottom:0, left:0, width:12, height:12, cursor:'sw-resize' } },
];

export function Section({ section, isSelected, onSelect, onStartMove, onStartResize, onStartRotate, onUpdate, onDelete, onContextMenu }: Props) {
  const [editingLabel, setEditingLabel] = useState(false);
  const [editingSub, setEditingSub] = useState(false);
  const locked = !!section.locked;
  const rot = section.rotation ?? 0;
  const accent = section.customColor ?? SECTION_ACCENT[section.key];
  const bg     = section.customColor ? `${section.customColor}08` : SECTION_BG[section.key];

  return (
    <div
      style={{ position:'absolute', left:section.x, top:section.y, width:section.width, height:section.height, background:bg, border:`1.5px solid ${isSelected?accent:`${accent}30`}`, borderLeft:`3px solid ${locked?'rgba(255,180,0,0.5)':accent}`, borderRadius:14, boxShadow:isSelected?`0 0 0 2px ${accent}18`:'none', transform:rot?`rotate(${rot}deg)`:undefined, transformOrigin:'center center', transition:'border-color 0.2s, box-shadow 0.2s' }}
      onMouseDown={e=>{ onSelect(e); if(!locked) onStartMove(e); }}
      onContextMenu={onContextMenu}
    >
      {/* Rotation handle */}
      {isSelected && !locked && (
        <div onMouseDown={e=>{ e.stopPropagation(); onStartRotate(e); }}
          style={{ position:'absolute', top:-32, left:'50%', transform:'translateX(-50%)', width:20, height:20, borderRadius:'50%', background:'rgba(14,14,14,0.9)', border:`1.5px solid ${accent}99`, display:'flex', alignItems:'center', justifyContent:'center', cursor:'grab', zIndex:20 }}>
          <RotateCw size={11} style={{ color:accent }}/>
        </div>
      )}

      <div style={{ position:'absolute', top:0, left:0, right:0, padding:'10px 14px 8px', display:'flex', alignItems:'baseline', gap:10, pointerEvents:'none' }}>
        {editingLabel
          ? <input autoFocus value={section.label} onChange={e=>onUpdate({label:e.target.value})}
              onBlur={()=>setEditingLabel(false)} onKeyDown={e=>{ if(e.key==='Enter') setEditingLabel(false); }}
              onMouseDown={e=>e.stopPropagation()} onClick={e=>e.stopPropagation()}
              style={{ background:'transparent', border:'none', outline:'none', fontSize:13, fontWeight:700, color:accent, fontFamily:'Syne, sans-serif', letterSpacing:'-0.01em', pointerEvents:'all', minWidth:80 }} />
          : <span onDoubleClick={e=>{ if(!locked){e.stopPropagation(); setEditingLabel(true);} }}
              style={{ fontSize:13, fontWeight:700, color:accent, fontFamily:'Syne, sans-serif', letterSpacing:'-0.01em', cursor:locked?'default':'text', pointerEvents:'all' }}>
              {section.label}
            </span>
        }
        {editingSub
          ? <input autoFocus value={section.sublabel} onChange={e=>onUpdate({sublabel:e.target.value})}
              onBlur={()=>setEditingSub(false)} onKeyDown={e=>{ if(e.key==='Enter') setEditingSub(false); }}
              onMouseDown={e=>e.stopPropagation()} onClick={e=>e.stopPropagation()}
              style={{ background:'transparent', border:'none', outline:'none', fontSize:11, color:'rgba(255,255,255,0.3)', fontFamily:'Outfit, sans-serif', pointerEvents:'all', minWidth:60 }} />
          : <span onDoubleClick={e=>{ if(!locked){e.stopPropagation(); setEditingSub(true);} }}
              style={{ fontSize:11, color:'rgba(255,255,255,0.28)', fontFamily:'Outfit, sans-serif', cursor:locked?'default':'text', pointerEvents:'all' }}>
              {section.sublabel}
            </span>
        }
        {locked && <Lock size={11} style={{ color:'rgba(255,180,0,0.5)', pointerEvents:'all', marginLeft:'auto' }} />}
      </div>

      {isSelected && !locked && (
        <div style={{ position:'absolute', top:8, right:10, display:'flex', gap:6, alignItems:'center', pointerEvents:'all' }}>
          <div style={{ position:'relative', width:14, height:14, borderRadius:'50%', background:accent, border:'1.5px solid rgba(255,255,255,0.2)', overflow:'hidden' }}
            onMouseDown={e=>e.stopPropagation()} onClick={e=>e.stopPropagation()}>
            <input type="color" value={accent} onChange={e=>onUpdate({customColor:e.target.value})}
              style={{ position:'absolute', inset:0, opacity:0, width:'100%', height:'100%', cursor:'pointer', border:'none' }} />
          </div>
          <button onMouseDown={e=>e.stopPropagation()} onClick={e=>{ e.stopPropagation(); onDelete(); }}
            style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:5, cursor:'pointer', color:'rgba(255,255,255,0.35)', fontSize:10, padding:'2px 7px', fontFamily:'Outfit, sans-serif' }}>
            Remove
          </button>
        </div>
      )}

      {!locked && EDGES.map(({id,style}) => (
        <div key={id} style={{ position:'absolute', ...style, zIndex:10 }}
          onMouseDown={e=>{ e.stopPropagation(); onStartResize(e,id); }} />
      ))}
    </div>
  );
}
