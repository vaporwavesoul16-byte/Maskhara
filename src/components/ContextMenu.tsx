import { CardType, SectionKey, SECTION_ACCENT } from '../types';
import { StickyNote, ImageIcon, Link2, Palette, User, Briefcase, LayoutGrid, Group, Lock, Unlock } from 'lucide-react';

interface Props {
  x: number; y: number;
  onAddCard: (type: CardType) => void;
  onAddSection: (key: SectionKey) => void;
  onAddGroup: () => void;
  // Element extras — shown at top when right-clicking an element
  targetId?: string;
  targetLocked?: boolean;
  onToggleLock?: () => void;
  onDeleteTarget?: () => void;
  onClose: () => void;
}

const ITEM: React.CSSProperties = {
  display:'flex', alignItems:'center', gap:9, padding:'8px 14px',
  cursor:'pointer', fontSize:12, fontFamily:'Outfit, sans-serif',
  color:'rgba(255,255,255,0.65)', border:'none', background:'none', width:'100%', textAlign:'left',
};
const LBL: React.CSSProperties = {
  fontSize:9, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase',
  color:'rgba(255,255,255,0.18)', fontFamily:'Syne, sans-serif', padding:'9px 14px 4px',
};
const SEP = <div style={{ height:1, background:'rgba(255,255,255,0.06)', margin:'3px 0' }} />;

const CARDS: Array<{ type: CardType; icon: React.ReactNode; label: string }> = [
  { type:'note',    icon:<StickyNote size={13}/>, label:'Note' },
  { type:'image',   icon:<ImageIcon size={13}/>,  label:'Image' },
  { type:'link',    icon:<Link2 size={13}/>,       label:'Link' },
  { type:'swatch',  icon:<Palette size={13}/>,     label:'Colour Swatch' },
  { type:'persona', icon:<User size={13}/>,        label:'Client Persona' },
  { type:'project', icon:<Briefcase size={13}/>,   label:'Project Card' },
];
const SECTIONS: Array<{ key: SectionKey; label: string }> = [
  { key:'services', label:'Services & Products' }, { key:'clients', label:'Buyers & Clients' },
  { key:'identity', label:'Brand Identity' },       { key:'projects', label:'Projects' },
  { key:'notes', label:'Open Notes' },
];

function HoverBtn({ style, children, onClick }: { style?: React.CSSProperties; children: React.ReactNode; onClick: () => void }) {
  return (
    <button style={{ ...ITEM, ...style }} onClick={onClick}
      onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.04)'}
      onMouseLeave={e=>e.currentTarget.style.background='none'}>
      {children}
    </button>
  );
}

export function ContextMenu({ x, y, onAddCard, onAddSection, onAddGroup, targetId, targetLocked, onToggleLock, onDeleteTarget, onClose }: Props) {
  return (
    <>
      <div style={{ position:'fixed', inset:0, zIndex:199 }} onClick={onClose} />
      <div onMouseDown={e=>e.stopPropagation()} style={{ position:'fixed', left:x, top:y, zIndex:200, background:'#0E0E0E', border:'1px solid rgba(255,255,255,0.1)', borderRadius:10, minWidth:210, boxShadow:'0 16px 48px rgba(0,0,0,0.85)', overflow:'hidden' }}>

        {/* Element options — only shown when right-clicking an element */}
        {targetId && onToggleLock && (
          <>
            <div style={LBL}>This element</div>
            <HoverBtn onClick={()=>{ onToggleLock(); onClose(); }}
              style={{ color: targetLocked ? '#D4A843' : 'rgba(255,255,255,0.65)' }}>
              {targetLocked ? <><Unlock size={13}/> Unlock position & size</> : <><Lock size={13}/> Lock position & size</>}
            </HoverBtn>
            {onDeleteTarget && !targetLocked && (
              <HoverBtn style={{ color:'#C23B22' }} onClick={()=>{ onDeleteTarget(); onClose(); }}>
                <span style={{ fontSize:13 }}>✕</span> Delete
              </HoverBtn>
            )}
            {SEP}
          </>
        )}

        {/* Add options — always shown */}
        <div style={LBL}>Add Card</div>
        {CARDS.map(({type,icon,label}) => (
          <HoverBtn key={type} onClick={()=>{ onAddCard(type); onClose(); }}>
            <span style={{ color:'rgba(255,255,255,0.28)' }}>{icon}</span>{label}
          </HoverBtn>
        ))}
        {SEP}
        <div style={LBL}>Add Section</div>
        {SECTIONS.map(({key,label}) => (
          <HoverBtn key={key} style={{ color:SECTION_ACCENT[key], opacity:0.85 }} onClick={()=>{ onAddSection(key); onClose(); }}>
            <LayoutGrid size={13}/>{label}
          </HoverBtn>
        ))}
        {SEP}
        <HoverBtn onClick={()=>{ onAddGroup(); onClose(); }}>
          <span style={{ color:'rgba(255,255,255,0.28)' }}><Group size={13}/></span>Add Group Label
        </HoverBtn>
      </div>
    </>
  );
}
