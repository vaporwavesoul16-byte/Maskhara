import { useState } from 'react';
import { SectionData, GroupData, SECTION_ACCENT } from '../types';
import { ChevronRight, ChevronLeft, Layers, Group } from 'lucide-react';

interface Props {
  sections: SectionData[];
  groups: GroupData[];
  onNavigate: (item: { x: number; y: number; width: number; height: number }) => void;
  isMobile: boolean;
}

export function Sidebar({ sections, groups, onNavigate, isMobile }: Props) {
  const [open, setOpen] = useState(!isMobile);
  const [tab, setTab] = useState<'sections'|'groups'>('sections');

  const toggleBtn = (
    <button onClick={()=>setOpen(v=>!v)}
      style={{ position:'fixed', left: open ? 221 : 0, top: isMobile ? 62 : 58, zIndex:101, background:'#181C22', border:'1px solid rgba(255,255,255,0.1)', borderLeft: open ? '1px solid rgba(255,255,255,0.1)' : 'none', borderRadius:open?'0 8px 8px 0':'0 8px 8px 0', padding:'8px 5px', cursor:'pointer', color:'rgba(255,255,255,0.4)', transition:'left 0.2s', boxShadow:'2px 0 8px rgba(0,0,0,0.4)' }}>
      {open ? <ChevronLeft size={14}/> : <ChevronRight size={14}/>}
    </button>
  );

  return (
    <>
      {toggleBtn}
      {open && (
        <div style={{ position:'fixed', left:0, top: isMobile ? 52 : 48, bottom:0, width:220, background:'rgba(11,11,11,0.97)', borderRight:'1px solid rgba(255,255,255,0.07)', zIndex:100, display:'flex', flexDirection:'column', backdropFilter:'blur(12px)' }}>
          {/* Tabs */}
          <div style={{ display:'flex', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
            {([['sections','Sections'],['groups','Groups']] as const).map(([t,label]) => (
              <button key={t} onClick={()=>setTab(t)}
                style={{ flex:1, padding:'9px 0', background:'none', border:'none', cursor:'pointer', fontSize:10, fontFamily:'Syne, sans-serif', fontWeight:700, letterSpacing:'0.07em', textTransform:'uppercase', color: tab===t ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.2)', borderBottom: tab===t ? '2px solid #D4A843' : '2px solid transparent' }} />
            ))}
          </div>

          {/* List */}
          <div style={{ flex:1, overflowY:'auto', padding:'6px 0' }}>
            {tab==='sections' && (
              sections.length===0
                ? <div style={{ padding:'20px 14px', fontSize:12, color:'rgba(255,255,255,0.18)', fontFamily:'Outfit, sans-serif' }}>No sections yet</div>
                : sections.map(s => (
                  <button key={s.id} onClick={()=>onNavigate(s)}
                    style={{ display:'flex', flexDirection:'column', width:'100%', textAlign:'left', padding:'9px 14px', background:'none', border:'none', cursor:'pointer', borderLeft:`3px solid ${s.customColor??SECTION_ACCENT[s.key]}`, marginBottom:2 }}
                    onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.03)'}
                    onMouseLeave={e=>e.currentTarget.style.background='none'}>
                    <span style={{ fontSize:12, fontWeight:700, color:'rgba(255,255,255,0.75)', fontFamily:'Syne, sans-serif' }}>{s.label}</span>
                    <span style={{ fontSize:10, color:'rgba(255,255,255,0.28)', fontFamily:'Outfit, sans-serif', marginTop:2 }}>{s.sublabel}</span>
                  </button>
                ))
            )}
            {tab==='groups' && (
              groups.length===0
                ? <div style={{ padding:'20px 14px', fontSize:12, color:'rgba(255,255,255,0.18)', fontFamily:'Outfit, sans-serif' }}>No groups yet</div>
                : groups.map(g => (
                  <button key={g.id} onClick={()=>onNavigate(g)}
                    style={{ display:'flex', alignItems:'center', gap:8, width:'100%', textAlign:'left', padding:'9px 14px', background:'none', border:'none', cursor:'pointer', borderLeft:`3px solid ${g.color}` }}
                    onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.03)'}
                    onMouseLeave={e=>e.currentTarget.style.background='none'}>
                    <div style={{ width:8, height:8, borderRadius:'50%', background:g.color, flexShrink:0 }} />
                    <span style={{ fontSize:12, fontWeight:600, color:'rgba(255,255,255,0.65)', fontFamily:'Syne, sans-serif' }}>{g.label}</span>
                  </button>
                ))
            )}
          </div>
        </div>
      )}
    </>
  );
}
